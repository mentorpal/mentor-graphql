/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  Answer as AnswerModel,
  Subject as SubjectModel,
  Question as QuestionModel,
} from 'models';
import {
  PaginatedResolveResult,
  PaginateOptions,
  PaginateQuery,
  pluginPagination,
} from './Paginatation';
import { Answer, AnswerMedia, Status } from './Answer';
import { QuestionType } from './Question';
import { Subject, SubjectQuestion, Topic } from './Subject';
import { User } from './User';
import { MentorExportJson } from 'gql/query/mentor-export';
import { MentorImportJson } from 'gql/mutation/me/mentor-import';
import { idOrNew } from 'gql/mutation/me/helpers';

export enum MentorType {
  VIDEO = 'VIDEO',
  CHAT = 'CHAT',
}

export interface Mentor extends Document {
  name: string;
  firstName: string;
  title: string;
  email: string;
  thumbnail: string;
  allowContact: boolean;
  defaultSubject: Subject['_id'];
  subjects: Subject['_id'][];
  lastTrainedAt: Date;
  isDirty: boolean;
  mentorType: string;
  user: User['_id'];
}

export interface GetMentorDataParams {
  mentor: string | Mentor;
  defaultSubject?: boolean;
  subjectId?: string;
  topicId?: string;
  type?: QuestionType;
  status?: Status;
  categoryId?: string;
}

export interface MentorModel extends Model<Mentor> {
  paginate(
    query?: PaginateQuery<Mentor>,
    options?: PaginateOptions
  ): Promise<PaginatedResolveResult<Mentor>>;
  getSubjects(mentor: string | Mentor): Subject[];
  getTopics({
    mentor,
    defaultSubject,
    subjectId,
  }: GetMentorDataParams): Topic[];
  getQuestions({
    mentor,
    defaultSubject,
    subjectId,
    topicId,
    type,
    categoryId,
  }: GetMentorDataParams): SubjectQuestion[];
  getAnswers({
    mentor,
    defaultSubject,
    subjectId,
    topicId,
    status,
    type,
    categoryId,
  }: GetMentorDataParams): Answer[];
  export(mentor: string): Promise<MentorExportJson>;
  import(mentor: string, json: MentorImportJson): Promise<Mentor>;
}

export const MentorSchema = new Schema<Mentor, MentorModel>(
  {
    name: { type: String },
    firstName: { type: String },
    title: { type: String },
    email: { type: String },
    thumbnail: { type: String, default: '' },
    allowContact: { type: Boolean, default: false },
    defaultSubject: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      default: '',
    },
    subjects: { type: [{ type: Schema.Types.ObjectId, ref: 'Subject' }] },
    lastTrainedAt: { type: Date },
    isDirty: { type: Boolean, default: true },
    mentorType: {
      type: String,
      enum: [MentorType.VIDEO, MentorType.CHAT],
      default: MentorType.VIDEO,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: '{PATH} is required!',
      unique: true,
    },
  },
  { timestamps: true, collation: { locale: 'en', strength: 2 } }
);

MentorSchema.statics.export = async function (
  m: string | Mentor
): Promise<MentorExportJson> {
  const mentor: Mentor = typeof m === 'string' ? await this.findById(m) : m;
  if (!mentor) {
    throw new Error('mentor not found');
  }
  const subjects = await SubjectModel.find(
    {
      _id: { $in: mentor.subjects },
    },
    null,
    { sort: { name: 1 } }
  );
  const mentorQuestions = await QuestionModel.find({
    $or: [
      { mentor: mentor._id },
      { mentor: { $exists: false } },
      { mentor: null }, // not sure if we need an explicit null check?
    ],
  });

  // Filter out the questions from subjects that do not belong to this mentor
  for (const s of subjects) {
    s.questions = s.questions.filter((sq) =>
      Boolean(mentorQuestions.find((q) => `${q._id}` == `${sq.question._id}`))
    );
  }

  const sQuestions: SubjectQuestion[] = subjects.reduce(
    (accumulator, subject) => {
      return accumulator.concat(subject.questions);
    },
    []
  );

  const questions = await QuestionModel.find({
    _id: { $in: sQuestions.map((q) => q.question) },
    $or: [
      { mentor: mentor._id },
      { mentor: { $exists: false } },
      { mentor: null }, // not sure if we need an explicit null check?
    ],
  });

  const answers: Answer[] = await AnswerModel.find({
    mentor: mentor._id,
    question: { $in: questions.map((q) => q._id) },
  });
  return {
    id: mentor._id,
    mentorInfo: mentor,
    subjects,
    questions,
    answers,
  };
};

MentorSchema.statics.import = async function (
  m: string | Mentor,
  json: MentorImportJson
): Promise<Mentor> {
  // Gets the mentor while also updating its info with that of the importing mentor
  const mentor: Mentor =
    typeof m === 'string'
      ? await this.findByIdAndUpdate(m, { ...json.mentorInfo })
      : m;
  if (!mentor) {
    throw new Error('mentor not found');
  }
  // remove all answer documents for current mentor
  // remove all questions that are specific to the mentor getting replaced (keep track of these question ids
  // remove all question references in subjects importing and subject model
  const questionsToRemove = await QuestionModel.find({ mentor: mentor._id });
  const questionIdsToRemove = questionsToRemove.map((q) => `${q._id}`);
  await AnswerModel.deleteMany({
    mentor: mentor._id,
  });
  await QuestionModel.deleteMany({
    mentor: mentor._id,
  });
  //removing mentor specific q's from subjects
  const subjectIds = mentor.subjects.map((subj) => subj._id);
  subjectIds.forEach(async (id) => {
    const subject = await SubjectModel.findOne({ _id: id });
    if (subject) {
      try {
        const newQs = subject.questions.filter(
          (q) =>
            !Boolean(
              questionIdsToRemove.find(
                (qRemove) => `${qRemove}` === `${q.question._id}`
              )
            )
        );
        await SubjectModel.findOneAndUpdate(
          { _id: subject._id },
          {
            $set: {
              questions: newQs,
            },
          },
          {
            new: true,
          }
        );
        // remove questions from imported subject
        const importedSubject = json.subjects.find(
          (subj) => subj._id == subject._id
        );
        if (importedSubject) {
          importedSubject.questions = importedSubject.questions.filter(
            (q) =>
              !Boolean(
                questionIdsToRemove.find(
                  (qRemove) => `${qRemove}` === `${q.question._id}`
                )
              )
          );
        }
      } catch (err) {
        console.debug(`Failed to filter subject q's: ${err}`);
      }
    }
  });
  // TODO: currently, if one fails all the subsequent calls fail
  // need to have a list of promises, but still need to create questions before anything else

  for (const q of json.questions) {
    let updatedOrCreatedQuestion;
    // If the question has a specific mentor and it's not of the mentor being replaced, then always create a new question
    if (q.mentor && q.mentor !== mentor._id) {
      const qCopy = JSON.parse(JSON.stringify(q));
      delete qCopy._id;
      qCopy.mentor = mentor._id;
      updatedOrCreatedQuestion = await QuestionModel.updateOrCreate(qCopy);
    } else {
      updatedOrCreatedQuestion = await QuestionModel.updateOrCreate(q);
    }
    const newQId = updatedOrCreatedQuestion._id;
    const isNewQuestion = `${newQId}` !== `${q._id}`;
    if (isNewQuestion) {
      for (const subject of json.subjects) {
        const subjectQuestionIndex = subject.questions.findIndex(
          (sq) => `${sq.question._id}` === `${q._id}`
        );
        const subjectContainsQuestions = subjectQuestionIndex !== -1;
        if (subjectContainsQuestions) {
          subject.questions[subjectQuestionIndex].question._id = newQId;
        }
      }
      const answer = json.answers.find(
        (a) => `${a.question._id}` === `${q._id}`
      );
      if (answer) {
        answer.question._id = updatedOrCreatedQuestion._id;
      }
    }
  }
  for (const s of json.subjects) {
    // Merging categories, topics, and questions between the current subject and "new" subject
    const curSubject = await SubjectModel.findOne({ _id: s._id });
    const categoriesToMerge = curSubject
      ? curSubject.categories.filter(
          (cur_category) =>
            !Boolean(
              s.categories.find((new_cat) => cur_category.id === new_cat.id)
            )
        )
      : [];
    const topicsToMerge = curSubject
      ? curSubject.topics.filter(
          (cur_topic) =>
            !Boolean(
              s.topics.find((new_topic) => cur_topic.id === new_topic.id)
            )
        )
      : [];
    const questionsToMerge = curSubject
      ? curSubject.questions.filter(
          (cur_question) =>
            !Boolean(
              s.questions.find(
                (new_question) =>
                  `${cur_question.question}` === `${new_question.question._id}`
              )
            )
        )
      : [];
    const categories = [...s.categories, ...categoriesToMerge];
    const topics = [...s.topics, ...topicsToMerge];
    const questions = [
      ...s.questions.map((sq) => ({
        question: sq.question._id,
        category: sq.category?.id,
        topics: sq.topics?.map((t) => t.id),
      })),
      ...questionsToMerge.map((sq) => ({
        question: `${sq.question}`,
        category: sq.category,
        topics: sq.topics,
      })),
    ];
    const updatedSubject = await SubjectModel.findOneAndUpdate(
      { _id: idOrNew(s._id) },
      {
        $set: {
          name: s.name,
          description: s.description,
          isRequired: s.isRequired,
          categories: categories,
          topics: topics,
          questions: questions,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );
    if (`${updatedSubject._id}` !== `${s._id}`) {
      const subject = json.subjects.find((js) => `${js._id}` === `${s._id}`);
      if (subject) {
        subject._id = updatedSubject._id;
      }
    }
  }
  for (const a of json.answers || []) {
    // Media always needs to be transferred because we do not want the "new" mentor to use the "old" mentors bucket urls, else the 2 mentors would be linked via media urls
    a.hasUntransferredMedia = Boolean(a.media.length);
    for (const m of a.media || []) {
      m.needsTransfer = true;
    }
    // Typically will create all new answers since mentor ids differ
    await AnswerModel.findOneAndUpdate(
      {
        mentor: mentor._id,
        question: a.question._id,
      },
      {
        $set: {
          transcript: a.transcript,
          status: a.status,
          media: a.media,
          hasUntransferredMedia: a.hasUntransferredMedia,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );
  }
  return await this.findByIdAndUpdate(mentor._id, {
    $set: {
      subjects: json.subjects.map((s) => s._id as Subject['_id']),
    },
  });
};

// Return subjects in alphabetical order
MentorSchema.statics.getSubjects = async function (
  m: string | Mentor
): Promise<Subject[]> {
  const mentor: Mentor = typeof m === 'string' ? await this.findById(m) : m;
  if (!mentor) {
    throw new Error(`mentor ${m} not found`);
  }
  return await SubjectModel.find(
    {
      _id: { $in: mentor.subjects },
    },
    null,
    { sort: { name: 1 } }
  );
};

// Return topics for all subjects or for one subject
//  - one subject: sorted in subject order
//  - all subjects: sorted alphabetically
MentorSchema.statics.getTopics = async function ({
  mentor,
  defaultSubject,
  subjectId,
}: GetMentorDataParams): Promise<Topic[]> {
  const userMentor: Mentor =
    typeof mentor === 'string' ? await this.findById(mentor) : mentor;
  if (!userMentor) {
    throw new Error(`mentor ${mentor} not found`);
  }
  const topics: Topic[] = [];
  subjectId = defaultSubject ? userMentor.defaultSubject : subjectId;
  if (subjectId) {
    if (userMentor.subjects.includes(subjectId)) {
      const subject = await SubjectModel.findById(subjectId);
      topics.push(...subject.topics);
    }
  } else {
    const subjects: Subject[] = await this.getSubjects(userMentor);
    for (const s of subjects) {
      topics.push(...s.topics);
    }
    topics.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }
  const topicsIds = [...new Set(topics.map((t) => `${t.id}`))];
  return topicsIds.map((tId) => topics.find((t) => `${t.id}` === tId));
};

MentorSchema.statics.getQuestions = async function ({
  mentor,
  defaultSubject,
  subjectId,
  topicId,
  type,
  categoryId,
}: GetMentorDataParams): Promise<SubjectQuestion[]> {
  const userMentor: Mentor =
    typeof mentor === 'string' ? await this.findById(mentor) : mentor;
  if (!userMentor) {
    throw new Error(`mentor ${mentor} not found`);
  }
  subjectId = defaultSubject ? userMentor.defaultSubject : subjectId;
  const subjectIds = subjectId
    ? userMentor.subjects.includes(subjectId)
      ? [subjectId]
      : []
    : (userMentor.subjects as string[]);
  if (subjectIds.length == 0) {
    return [];
  }
  const subjects = await SubjectModel.find({ _id: { $in: subjectIds } }, null, {
    sort: { name: 1 },
  });
  // TODO: explore whether can batch all calls below
  // into a single mongo query?
  return (
    await Promise.all(
      subjects.map((s) =>
        SubjectModel.getQuestions(s, topicId, userMentor._id, type, categoryId)
      )
    )
  ).reduce((acc: SubjectQuestion[], cur: SubjectQuestion[]) => {
    acc.push(...cur);
    return acc;
  }, [] as SubjectQuestion[]);
};

MentorSchema.statics.getAnswers = async function ({
  mentor,
  defaultSubject,
  subjectId,
  topicId,
  status,
  type,
  categoryId,
}: GetMentorDataParams) {
  const userMentor: Mentor =
    typeof mentor === 'string' ? await this.findById(mentor) : mentor;
  if (!userMentor) {
    throw new Error(`mentor ${mentor} not found`);
  }
  const sQuestions = await this.getQuestions({
    mentor: userMentor,
    defaultSubject: defaultSubject,
    subjectId: subjectId,
    topicId: topicId,
    type: type,
    categoryId: categoryId,
  });
  const questionIds = sQuestions.map(
    (sq: { question: { _id: string } }) => sq.question._id
  );
  const answers: Answer[] = await AnswerModel.find({
    mentor: userMentor._id,
    question: { $in: questionIds },
  });
  answers.sort((a: Answer, b: Answer) => {
    return (
      questionIds.indexOf(a.question._id) - questionIds.indexOf(b.question._id)
    );
  });
  const answersByQid = answers.reduce((acc: Record<string, Answer>, cur) => {
    acc[`${cur.question}`] = cur;
    return acc;
  }, {});
  const answerResult = questionIds.map((qid: string) => {
    return (
      answersByQid[`${qid}`] || {
        mentor: userMentor._id,
        question: qid,
        transcript: '',
        status: Status.INCOMPLETE,
        media: [] as AnswerMedia[],
      }
    );
  });
  return status
    ? answerResult.filter((a: Answer) => a.status === status)
    : answerResult;
};

MentorSchema.index({ name: -1, _id: -1 });
MentorSchema.index({ firstName: -1, _id: -1 });
MentorSchema.index({ mentorType: -1, _id: -1 });
pluginPagination(MentorSchema);

export default mongoose.model<Mentor, MentorModel>('Mentor', MentorSchema);
