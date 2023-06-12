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
} from './index';
import {
  PaginatedResolveResult,
  PaginateOptions,
  PaginateQuery,
  pluginPagination,
} from './Paginatation';
import { Answer, Status } from './Answer';
import { Question, QuestionType } from './Question';
import {
  Subject,
  SubjectQuestion,
  SubjectQuestionProps,
  Topic,
} from './Subject';
import { User } from './User';
import { MentorExportJson } from '../gql/query/mentor-export';
import {
  AnswerUpdateInput,
  MentorImportJson,
  ReplacedMentorDataChanges,
} from '../gql/mutation/me/mentor-import';
import { idOrNew } from '../gql/mutation/me/helpers';
import UserQuestion, {
  UserQuestion as UserQuestionInterface,
} from './UserQuestion';
import { QuestionUpdateInput } from '../gql/mutation/me/question-update';
import { Organization } from './Organization';
import { externalVideoIdsDefault } from '../gql/mutation/api/update-answers';

export enum MentorType {
  VIDEO = 'VIDEO',
  CHAT = 'CHAT',
}

export enum OrgViewPermissionType {
  NONE = 'NONE', // no custom settings, use "isPrivate"
  HIDDEN = 'HIDDEN', // org cannot see or use mentor
  SHARE = 'SHARE', // org can use mentor as-is
}

export enum OrgEditPermissionType {
  NONE = 'NONE', // no custom settings, use "isPrivate"
  MANAGE = 'MANAGE', // org can edit content
  ADMIN = 'ADMIN', // org can edit content and edit sharing settings
}

export interface OrgPermissionProps {
  org: Organization['_id'];
  viewPermission: OrgViewPermissionType;
  editPermission: OrgEditPermissionType;
}

export interface OrgPermission extends OrgPermissionProps, Document {}

export const OrgPermissionSchema = new Schema({
  org: { type: mongoose.Types.ObjectId, ref: 'Organization' },
  viewPermission: {
    type: String,
    enum: [
      OrgViewPermissionType.NONE,
      OrgViewPermissionType.HIDDEN,
      OrgViewPermissionType.SHARE,
    ],
    default: OrgViewPermissionType.NONE,
  },
  editPermission: {
    type: String,
    enum: [
      OrgEditPermissionType.NONE,
      OrgEditPermissionType.MANAGE,
      OrgEditPermissionType.ADMIN,
    ],
    default: OrgEditPermissionType.NONE,
  },
});

export enum MentorDirtyReason {
  ANSWERS_REMOVED = 'ANSWERS_REMOVED',
  ANSWERS_ADDED = 'ANSWERS_ADDED',
  NONE = 'NONE',
}

export interface Mentor extends Document {
  name: string;
  firstName: string;
  title: string;
  goal: string;
  email: string;
  mentorType: string;
  thumbnail: string;
  allowContact: boolean;
  defaultSubject: Subject['_id'];
  subjects: Subject['_id'][];
  keywords: string[];
  recordQueue: Question['_id'][];
  lastTrainedAt: Date;
  lastPreviewedAt: Date;
  isDirty: boolean;
  trainId: string;
  dirtyReason: MentorDirtyReason;
  isPrivate: boolean;
  isArchived: boolean;
  isAdvanced: boolean;
  orgPermissions: OrgPermissionProps[];
  hasVirtualBackground: boolean;
  virtualBackgroundUrl: string;
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
  getTopics(
    { mentor, defaultSubject, subjectId }: GetMentorDataParams,
    subjects?: Subject[]
  ): Topic[];
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
  import(
    mentor: string,
    json: MentorImportJson,
    replacedMentorDataChanges: ReplacedMentorDataChanges
  ): Promise<Mentor>;
}

export const MentorSchema = new Schema<Mentor, MentorModel>(
  {
    name: { type: String },
    firstName: { type: String },
    title: { type: String },
    goal: { type: String },
    email: { type: String },
    thumbnail: { type: String, default: '' },
    allowContact: { type: Boolean, default: false },
    defaultSubject: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
    },
    subjects: { type: [{ type: Schema.Types.ObjectId, ref: 'Subject' }] },
    keywords: { type: [String] },
    recordQueue: { type: [{ type: Schema.Types.ObjectId, ref: 'Question' }] },
    lastTrainedAt: { type: Date },
    lastPreviewedAt: { type: Date },
    isDirty: { type: Boolean, default: true },
    isPrivate: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    isAdvanced: { type: Boolean, default: false },
    orgPermissions: { type: [OrgPermissionSchema], default: [] },
    hasVirtualBackground: { type: Boolean, default: false },
    virtualBackgroundUrl: { type: String, default: '' },
    mentorType: {
      type: String,
      enum: [MentorType.VIDEO, MentorType.CHAT],
      default: MentorType.VIDEO,
    },
    trainId: { type: String, default: '' },
    dirtyReason: {
      type: String,
      enum: MentorDirtyReason,
      default: MentorDirtyReason.NONE,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: '{PATH} is required!',
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

  let userQuestions = await UserQuestion.find({
    mentor: mentor._id,
  });

  // Filter out any userQuestions that contain answers that do not exist within the answers we're going to send out
  const answerDocIds = answers.map((a) => `${a._id}`);
  userQuestions = userQuestions.filter((userQuestion) =>
    answerDocIds.find(
      (answerDocId) => answerDocId == userQuestion.classifierAnswer?._id
    )
  );

  return {
    id: mentor._id,
    mentorInfo: mentor,
    subjects,
    questions,
    answers,
    userQuestions,
  };
};

async function createOrFetchQuestionDocAddToArray(
  questionDocsMatchedWithImportedQuestions: Question[],
  questionUpdateAndCreationDocs: QuestionUpdateInput[],
  importedQDoc: QuestionUpdateInput,
  mentorId: string,
  existingSubjectQuestionDocs: Question[]
) {
  let updatedOrCreatedQuestion;
  const isNewMentorSpecificQuestion =
    importedQDoc.mentor && `${importedQDoc.mentor}` !== `${mentorId}`;
  if (isNewMentorSpecificQuestion) {
    const qCopy: QuestionUpdateInput = JSON.parse(JSON.stringify(importedQDoc));
    qCopy._id = idOrNew(qCopy._id);
    qCopy.mentor = mentorId;
    questionUpdateAndCreationDocs.push(qCopy);
    updatedOrCreatedQuestion = qCopy;
  } else {
    // Try to find pre-existing queston document by id or text
    const questionDocument = existingSubjectQuestionDocs.length
      ? existingSubjectQuestionDocs.find(
          (existingQ) =>
            `${existingQ._id}` === `${importedQDoc._id}` ||
            (existingQ.question === importedQDoc.question && !existingQ.mentor)
        )
      : questionDocsMatchedWithImportedQuestions.find(
          (existingQ) =>
            `${existingQ._id}` === `${importedQDoc._id}` ||
            (existingQ.question === importedQDoc.question && !existingQ.mentor)
        );
    // question document must either not be mentor specific or be specific to the mentor being replaced, else this mentor can't see the question.
    const questionDocumentExists =
      questionDocument &&
      (!questionDocument.mentor ||
        `${questionDocument.mentor}` === `${mentorId}`);
    if (questionDocumentExists) {
      // question document already exists in DB, no need to add to do any mutation here
      updatedOrCreatedQuestion = questionDocument;
    } else {
      // No pre-existing question documents found by text or id, so make this new question mentor specific.
      importedQDoc.mentor = mentorId;
      importedQDoc._id = idOrNew(importedQDoc._id);
      questionUpdateAndCreationDocs.push(importedQDoc);
      updatedOrCreatedQuestion = importedQDoc;
    }
  }
  return {
    questionUpdateAndCreationDocs,
    updatedOrCreatedQuestion,
  };
}

async function updateCreateAnswerDocumentAndUserQuestion(
  importedAnswers: AnswerUpdateInput[],
  jsonUserQuestions: UserQuestionInterface[],
  originalQuestionId: string,
  newCreatedQuestionId: string,
  mentorId: string
) {
  const importedAnswerDocumentForQuestion = importedAnswers.find(
    (importedAnswer) => importedAnswer.question._id === originalQuestionId
  );
  if (importedAnswerDocumentForQuestion) {
    // With the new question document created, handle creating the new answer documents for that question
    if (importedAnswerDocumentForQuestion.webMedia) {
      importedAnswerDocumentForQuestion.webMedia.needsTransfer = true;
    }
    if (importedAnswerDocumentForQuestion.mobileMedia) {
      importedAnswerDocumentForQuestion.mobileMedia.needsTransfer = true;
    }
    if (importedAnswerDocumentForQuestion.vttMedia) {
      importedAnswerDocumentForQuestion.vttMedia.needsTransfer = true;
    }
    // TODO: Perform this as a batch update
    const newAnswerDocument = await AnswerModel.findOneAndUpdate(
      {
        question: newCreatedQuestionId,
        mentor: mentorId,
      },
      {
        transcript: importedAnswerDocumentForQuestion.transcript,
        status: importedAnswerDocumentForQuestion.status,
        webMedia: importedAnswerDocumentForQuestion.webMedia,
        mobileMedia: importedAnswerDocumentForQuestion.mobileMedia,
        vttMedia: importedAnswerDocumentForQuestion.vttMedia,
        externalVideoIds:
          importedAnswerDocumentForQuestion.externalVideoIds ||
          externalVideoIdsDefault,
        hasUntransferredMedia: true,
      },
      {
        upsert: true,
        new: true,
      }
    );
    // Anytime an answer document is created, update related imported userQuestions that contain the imported answer document in either classifierAnswer or graderAnswer with the new answer document
    const importedUserQuestions = jsonUserQuestions.filter(
      (importedUserQuestion) =>
        importedUserQuestion.classifierAnswer?.question?._id ==
          importedAnswerDocumentForQuestion.question._id ||
        importedUserQuestion.graderAnswer?.question?._id ==
          importedAnswerDocumentForQuestion.question._id
    );
    if (importedUserQuestions.length) {
      for (const importedUserQuestion of importedUserQuestions) {
        const replaceClassifierAnswer =
          importedUserQuestion.classifierAnswer?.question?._id ==
          importedAnswerDocumentForQuestion.question._id;
        const replaceGraderAnswer =
          importedUserQuestion.graderAnswer?.question?._id ==
          importedAnswerDocumentForQuestion.question._id;
        if (replaceClassifierAnswer) {
          importedUserQuestion.classifierAnswer = newAnswerDocument;
        }
        if (replaceGraderAnswer) {
          importedUserQuestion.graderAnswer = newAnswerDocument;
        }

        // Updating jsonUserQuestions by reference
        for (let userQuestion of jsonUserQuestions) {
          if (userQuestion._id == importedUserQuestion._id) {
            userQuestion = importedUserQuestion;
          }
        }
      }
    }
  }
}

MentorSchema.statics.import = async function (
  m: string | Mentor,
  json: MentorImportJson,
  replacedMentorDataChanges: ReplacedMentorDataChanges
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
    // remove specified answer documents for current mentor
    const answerQIdsToRemove = replacedMentorDataChanges.answerChanges
      .filter((q) => q.editType === 'REMOVED')
      .map((a) => a.data.question._id);
    await AnswerModel.deleteMany({
      question: { $in: answerQIdsToRemove },
      mentor: mentor._id,
    });

    // remove specified questions (and their answer docs, if they exist) from current mentor
    // safeguard against removal of any questions that are not specific to this mentor
    const questionIdsToRemove = replacedMentorDataChanges.questionChanges
      .filter(
        (q) =>
          q.editType === 'REMOVED' &&
          q.data.mentor &&
          `${q.data.mentor}` === `${mentor._id}`
      )
      .map((q) => q.data._id);
    await AnswerModel.deleteMany({
      question: { $in: questionIdsToRemove },
      mentor: mentor._id,
    });
    await QuestionModel.deleteMany({
      _id: { $in: questionIdsToRemove },
      mentor: mentor._id,
    });

    // removing selected q's from subjects
    const subjectIds = mentor.subjects.map((subj) => subj._id);
    subjectIds.forEach(async (id) => {
      const subject = await SubjectModel.findOne({ _id: id });
      if (subject) {
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
          (subj) => `${subj._id}` == `${subject._id}`
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
      } else {
        console.error(
          `Failed to find subject with id ${id} when removing specific question ids`
        );
      }
    });

    // Safeguard: Filter out any userQuestions that contain answer documents that were not imported with this mentor, this could result in null references
    json.userQuestions = json.userQuestions.filter((userQuestion) =>
      json.answers.find(
        (a) =>
          `${a.question._id}` ==
          `${userQuestion.classifierAnswer?.question?._id}`
      )
    );

    // Start the mentor with no subjects, and we add them on as we go.
    mentor = await this.findOneAndUpdate(
      { _id: mentor._id },
      { subjects: [] },
      { new: true }
    );

    // This is our 'batch' call to get all the question docs we need at start
    const existingQuestionDocsMatchedWithImportedQuestions =
      await QuestionModel.find({
        $or: [
          {
            _id: json.questions.map((importedQuestion) =>
              idOrNew(importedQuestion._id)
            ),
          },
          {
            $and: [
              {
                question: {
                  $in: json.questions.map(
                    (importedQuestion) => importedQuestion.question
                  ),
                },
              },
              { mentor: { $exists: false } },
            ],
          },
        ],
      });

    for (const s of json.subjects) {
      let questionUpdateAndCreationDocs: QuestionUpdateInput[] = [];
      const subjectQuestionsToAddTosubject: SubjectQuestionProps[] = [];

      const existingSubject = await SubjectModel.findOne({
        _id: idOrNew(s._id),
      });
      const existingSubjectQuestionDocs = existingSubject
        ? await QuestionModel.find({
            _id: { $in: existingSubject.questions.map((q) => `${q.question}`) },
          })
        : [];

      // for each subject question from the imported subject
      for (const q of s.questions) {
        const originalQId = JSON.parse(JSON.stringify(q.question._id));
        const importedQDoc = json.questions.find(
          (importedQ) => `${importedQ._id}` === `${q.question._id}`
        );
        if (!importedQDoc) {
          console.error(
            `Failed to find an imported question document for subject question: ${JSON.stringify(
              q
            )}`
          );
          continue;
        }

        let updatedOrCreatedQuestion;
        ({ questionUpdateAndCreationDocs, updatedOrCreatedQuestion } =
          await createOrFetchQuestionDocAddToArray(
            existingQuestionDocsMatchedWithImportedQuestions,
            questionUpdateAndCreationDocs,
            importedQDoc,
            mentor._id,
            existingSubjectQuestionDocs
          ));

        const newQId = updatedOrCreatedQuestion._id;

        // If this is a pre-existing subject, then just add the question document to it
        if (existingSubject) {
          const existingSubjectAlreadyHasQuestion =
            existingSubject.questions.find(
              (existingQ) => `${existingQ.question._id}` === `${newQId}`
            );
          if (!existingSubjectAlreadyHasQuestion) {
            subjectQuestionsToAddTosubject.push({
              question: newQId,
              category: q.category?.id,
              topics: q.topics?.map((t) => t.id),
            });
          }
        } else {
          // Subject does not exist, so we update the imported json with the new question id
          q.question._id = newQId;
        }

        await updateCreateAnswerDocumentAndUserQuestion(
          json.answers,
          json.userQuestions,
          originalQId,
          newQId,
          mentor._id
        );
      }
      // Batch write all questions
      await QuestionModel.bulkWrite(
        questionUpdateAndCreationDocs.map((questionDoc) => {
          return {
            updateOne: {
              filter: { _id: questionDoc._id },
              update: questionDoc,
              upsert: true,
            },
          };
        })
      );

      // Create userQuestion documents now that they all contain existing answer documents
      await UserQuestion.bulkWrite(
        json.userQuestions.map((userQuestion) => {
          return {
            updateOne: {
              filter: { _id: idOrNew(userQuestion._id) },
              update: {
                ...userQuestion,
                mentor: mentor._id,
              },
              upsert: true,
            },
          };
        })
      );

      if (!existingSubject) {
        const newSubject = await SubjectModel.findOneAndUpdate(
          { _id: idOrNew(s._id) },
          {
            name: s.name,
            description: s.description,
            isRequired: s.isRequired,
            isArchived: s.isArchived,
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
        // Add the question to the existing subject
        await SubjectModel.findOneAndUpdate(
          { _id: existingSubject._id },
          {
            questions: [
              ...existingSubject.questions,
              ...subjectQuestionsToAddTosubject,
            ],
          },
          {
            new: true,
          }
        );

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

MentorSchema.statics.getTopics = async function (
  { mentor, defaultSubject, subjectId: targetSubjectId }: GetMentorDataParams,
  subjects?: Subject[]
): Promise<Topic[]> {
  const userMentor: Mentor =
    typeof mentor === 'string' ? await this.findById(mentor) : mentor;
  if (!userMentor) {
    throw new Error(`mentor ${mentor} not found`);
  }
  const topics: Topic[] = [];
  const mentorDefaultSubjectId =
    defaultSubject && userMentor.defaultSubject
      ? userMentor.defaultSubject
      : '';
  const mentorDefaultSubjectDoc = mentorDefaultSubjectId
    ? await SubjectModel.findById(mentorDefaultSubjectId)
    : undefined;
  const mentorDefaultSubjectTopics = mentorDefaultSubjectDoc
    ? mentorDefaultSubjectDoc.topics
    : [];

  const targetSubjectDoc =
    targetSubjectId && userMentor.subjects.includes(targetSubjectId)
      ? await SubjectModel.findById(targetSubjectId)
      : undefined;
  const targetSubjectTopics = targetSubjectDoc ? targetSubjectDoc.topics : [];

  topics.push(...targetSubjectTopics);
  topics.push(...mentorDefaultSubjectTopics);

  let ss = subjects || (await this.getSubjects(userMentor));
  // remove targeted and mentors default subject from list, if they were used
  ss = ss.filter(
    (subject) =>
      subject._id !== mentorDefaultSubjectId && subject._id !== targetSubjectId
  );
  // add all other subjects topics, but sorted in alphabetical order
  const otherSubjectTopics: Topic[] = [];
  for (const s of ss) {
    otherSubjectTopics.push(...s.topics);
  }
  otherSubjectTopics.sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

  topics.push(...otherSubjectTopics);

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
  // Gets all questions that exist in all subjects
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
  const questions: Question[] = await QuestionModel.find({
    _id: { $in: questionIds },
  });
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
    const questionId = `${cur.question}`;
    const questionDoc = questions.find((q) => questionId === `${q._id}`);
    cur.question = questionDoc || questionId;
    acc[questionId] = cur;
    return acc;
  }, {});
  const answerResult = questionIds.map((qid: string) => {
    const questionDoc = questions.find((q) => qid == `${q._id}`);
    return (
      answersByQid[`${qid}`] || {
        mentor: userMentor._id,
        question: questionDoc || qid,
        transcript: '',
        status: Status.NONE,
        webMedia: undefined,
        mobileMedia: undefined,
        vttMedia: undefined,
        externalVideoIds: externalVideoIdsDefault,
      }
    );
  });
  if (status) {
    if (status === Status.INCOMPLETE) {
      return answerResult.filter(
        (a: Answer) =>
          !isAnswerComplete(
            a,
            questions.find((q) => `${q._id}` === `${a.question}`),
            userMentor
          )
      );
    } else if (status === Status.COMPLETE) {
      return answerResult.filter((a: Answer) =>
        isAnswerComplete(
          a,
          questions.find((q) => `${q._id}` === `${a.question}`),
          userMentor
        )
      );
    } else {
      return answerResult.filter((a: Answer) => a.status === status);
    }
  } else {
    return answerResult;
  }
};

export function isAnswerComplete(
  answer: Answer,
  question: Question,
  mentor: Mentor
): boolean {
  if (answer.status === Status.COMPLETE) {
    return true;
  }
  if (answer.status === Status.NONE) {
    if (mentor.mentorType === MentorType.CHAT) {
      return Boolean(answer.transcript);
    } else if (mentor.mentorType === MentorType.VIDEO) {
      return (
        (Boolean(answer.transcript) || question?.name === '_IDLE_') &&
        Boolean(answer.webMedia?.url || answer.mobileMedia?.url)
      );
    }
  }
  return false;
}

MentorSchema.index({ name: -1, _id: -1 });
MentorSchema.index({ firstName: -1, _id: -1 });
MentorSchema.index({ mentorType: -1, _id: -1 });
pluginPagination(MentorSchema);

export default mongoose.model<Mentor, MentorModel>('Mentor', MentorSchema);
