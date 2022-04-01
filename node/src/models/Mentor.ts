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
  try {
    // Gets the mentor while also updating its info with that of the importing mentor
    let mentor: Mentor =
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

    // Main differences:
    /**
     * We work through each subject, that subjects questions, and then that questions answer document (if one exists) all in order
     */

    //START OF MY WAY
    // Start mentor from scratch and work through imported subjects
    mentor = await this.findOneAndUpdate({_id: mentor._id},{subjects:[]},{new:true})

    for (const s of json.subjects) {
      let existingSubject = await SubjectModel.findOne({ _id: idOrNew(s._id) });
      const existingSubjectQuestionDocs = existingSubject
        ? await QuestionModel.find({
            _id: { $in: existingSubject.questions.map((q) => `${q.question}`) },
          })
        : [];
      console.error(`Working on subject: ${s.name}`);
      for (const q of s.questions) {
        console.error(`working on question ${JSON.stringify(q.question)}`);
        const originalQId = JSON.parse(JSON.stringify(q.question._id));
        const importedQDoc = json.questions.find(
          (importedQ) => `${importedQ._id}` === `${q.question._id}`
        );
        if (!importedQDoc) {
          console.error(
            `Failed to find an imported question document for question: ${JSON.stringify(
              q
            )}`
          );
          continue;
        }
        let updatedOrCreatedQuestion;
        let isNewQuestion = false;
        // If the question has a specific mentor and it's not of the mentor being replaced, then always create a new question
        if (importedQDoc.mentor && importedQDoc.mentor !== mentor._id) {
          const qCopy = JSON.parse(JSON.stringify(importedQDoc));
          delete qCopy._id;
          qCopy.mentor = mentor._id;
          updatedOrCreatedQuestion = await QuestionModel.updateOrCreate(qCopy);
          isNewQuestion = true;
        } else {
          const questionDocument = existingSubjectQuestionDocs.length
            ? existingSubjectQuestionDocs.find(
                (existingQ) =>
                  `${existingQ._id}` === `${importedQDoc._id}` ||
                  existingQ.question === importedQDoc.question
              )
            : await QuestionModel.findOne({
                $or: [
                  { _id: idOrNew(importedQDoc._id) },
                  { question: importedQDoc.question },
                ],
              });
          if (questionDocument && !questionDocument.mentor) {
            console.error(
              `question document found for question ${JSON.stringify(
                importedQDoc
              )}, new question doc ${JSON.stringify(questionDocument)}`
            );
            updatedOrCreatedQuestion = questionDocument;
          } else {
            console.log(`mentor specific, or question document not found`);
            importedQDoc.mentor = typeof m === 'string' ? m : m._id;
            updatedOrCreatedQuestion = await QuestionModel.updateOrCreate(
              importedQDoc
            );
            isNewQuestion = true;
          }
        }
        const newQId = updatedOrCreatedQuestion._id;
        if (isNewQuestion) {
          console.error(
            `new question document created for ${JSON.stringify(
              q
            )}, new doc has id ${updatedOrCreatedQuestion._id}`
          );
        }
        // If the subject already exists, then no matter what we add the question to it
        if (existingSubject) {
          const existingSubjectAlreadyHasQuestion =
            existingSubject.questions.find(
              (existingQ) => `${existingQ.question._id}` === `${newQId}`
            );
          console.log(
            `${existingSubject.name} does${
              existingSubjectAlreadyHasQuestion ? ' ' : ' not '
            }have question ${JSON.stringify(updatedOrCreatedQuestion)}`
          );
          if (!existingSubjectAlreadyHasQuestion) {
            try {
              existingSubject = await SubjectModel.findOneAndUpdate(
                { _id: existingSubject._id },
                {
                  questions: [
                    ...existingSubject.questions,
                    {
                      question: updatedOrCreatedQuestion._id,
                      category: q.category?.id,
                      topics: q.topics?.map((t) => t.id),
                    },
                  ],
                },
                {
                  new: true,
                }
              );
            } catch (err) {
              throw new Error(`Failed to update existing subject model with `);
            }
          }
        } else {
          // Subject does not exist, so we update the imported json with the new question id
          // TODO: This is assuming that it's updating by reference, not sure if it will work.
          q.question._id = updatedOrCreatedQuestion._id;
        }

        const importedAnswerDocumentForQuestion = json.answers.find(
          (importedAnswer) => importedAnswer.question._id === originalQId
        );
        if (importedAnswerDocumentForQuestion) {
          // With the new question document created, handle creating the new answer documents for that question
          for (const m of importedAnswerDocumentForQuestion.media || []) {
            m.needsTransfer = true;
          }
          await AnswerModel.findOneAndUpdate(
            {
              question: updatedOrCreatedQuestion._id,
              mentor: mentor._id,
            },
            {
              transcript: importedAnswerDocumentForQuestion.transcript,
              status: importedAnswerDocumentForQuestion.status,
              media: importedAnswerDocumentForQuestion.media,
              hasUntransferredMedia: true,
            },
            {
              upsert: true,
            }
          );
        }
      }

      //  If the subject does not already exist, then just create it because the questions are already all
      //    created and assigned to id's in the DB
      if (!existingSubject) {
        const newSubject = await SubjectModel.findOneAndUpdate(
          { _id: idOrNew(s._id) },
          {
              name: s.name,
              description: s.description,
              isRequired: s.isRequired,
              categories: s.categories,
              topics: s.topics,
              questions: s.questions.map((sq) => ({
                question: sq.question._id,
                category: sq.category?.id,
                topics: sq.topics?.map((t) => t.id),
              })),
          },
          {
            new: true,
            upsert: true,
          }
        );
        // Add the new subject to the mentors subject id list
        mentor = await this.findByIdAndUpdate(
          mentor._id,
          {
            $set: {
              subjects: mentor.subjects.concat(
                newSubject._id as Subject['_id']
              ),
            },
          },
          {
            new: true,
          }
        );
      } else {
        // Check if the mentor already has the existing subject
        const mentorAlreadyHasSubject = mentor.subjects.find(
          (subj) => subj._id === existingSubject._id
        );
        if (!mentorAlreadyHasSubject) {
          mentor = await this.findByIdAndUpdate(
            mentor._id,
            {
              $set: {
                subjects: mentor.subjects.concat(
                  existingSubject._id as Subject['_id']
                ),
              },
            },
            {
              new: true,
            }
          );
        }
      }
    }
    return await this.findById(mentor._id);
  } catch (err) {
    console.error(err);
    throw new Error(err);
  }
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
