/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import {
  Mentor as MentorModel,
  Subject as SubjectModel,
  Question as QuestionModel,
  Answer as AnswerModel,
} from '../../models';
import { Subject } from '../../models/Subject';
import { Question } from '../../models/Question';
import { Answer } from '../../models/Answer';
import { Organization } from '../../models/Organization';
import {
  AnswerUpdateInput,
  MentorImportJson,
  MentorImportJsonType,
} from '../mutation/me/mentor-import';
import SubjectType, { CategoryType, TopicType } from '../types/subject';
import QuestionType from '../types/question';
import AnswerType from '../types/answer';
import { SubjectUpdateInput } from '../mutation/me/subject-update';
import { QuestionUpdateInput } from '../mutation/me/question-update';
import { isId } from '../mutation/me/helpers';
import { User } from '../../models/User';
import { canViewMentor } from '../../utils/check-permissions';
import { ExternalVideoIdsObjectType } from 'gql/mutation/api/update-answers';

enum EditType {
  NONE = 'NONE',
  ADDED = 'ADDED',
  REMOVED = 'REMOVED',
  CREATED = 'CREATED',
  OLD_FOLLOWUP = 'OLD_FOLLOWUP',
  OLD_ANSWER = 'OLD_ANSWER',
}
interface ImportPreview<T, U> {
  importData?: T;
  curData?: U;
  editType: EditType;
}
interface MentorImportPreview {
  id: string;
  subjects: ImportPreview<SubjectUpdateInput, Subject>[];
  questions: ImportPreview<QuestionUpdateInput, Question>[];
  answers: ImportPreview<AnswerUpdateInput, Answer>[];
}

export const MentorImportPreviewType = new GraphQLObjectType({
  name: 'MentorImportPreviewType',
  fields: () => ({
    id: { type: GraphQLString },
    subjects: { type: GraphQLList(SubjectImportPreviewType) },
    questions: { type: GraphQLList(QuestionImportPreviewType) },
    answers: { type: GraphQLList(AnswerImportPreviewType) },
  }),
});
export const SubjectImportPreviewType = new GraphQLObjectType({
  name: 'SubjectImportPreviewType',
  fields: () => ({
    importData: { type: SubjectPreviewType },
    curData: { type: SubjectType },
    editType: { type: GraphQLString },
  }),
});
export const QuestionImportPreviewType = new GraphQLObjectType({
  name: 'QuestionImportPreviewType',
  fields: () => ({
    importData: { type: QuestionType },
    curData: { type: QuestionType },
    editType: { type: GraphQLString },
  }),
});
export const AnswerImportPreviewType = new GraphQLObjectType({
  name: 'AnswerImportPreviewType',
  fields: () => ({
    importData: { type: AnswerPreviewType },
    curData: { type: AnswerType },
    editType: { type: GraphQLString },
  }),
});

export const SubjectPreviewType = new GraphQLObjectType({
  name: 'SubjectPreview',
  fields: () => ({
    _id: { type: GraphQLID },
    name: { type: GraphQLString },
    type: { type: GraphQLString },
    description: { type: GraphQLString },
    isRequired: { type: GraphQLBoolean },
    isArchived: { type: GraphQLBoolean },
    topics: { type: GraphQLList(TopicType) },
    categories: { type: GraphQLList(CategoryType) },
    questions: { type: GraphQLList(SubjectQuestionPreviewType) },
  }),
});
export const SubjectQuestionPreviewType = new GraphQLObjectType({
  name: 'SubjectQuestionPreview',
  fields: {
    category: { type: CategoryType },
    topics: { type: GraphQLList(TopicType) },
    question: { type: QuestionType },
  },
});
export const AnswerPreviewType = new GraphQLObjectType({
  name: 'AnswerPreview',
  fields: () => ({
    question: { type: QuestionType },
    hasEditedTranscript: { type: GraphQLBoolean },
    transcript: { type: GraphQLString },
    status: { type: GraphQLString },
    hasUntransferredMedia: { type: GraphQLBoolean },
    webMedia: { type: AnswerMediaPreviewType },
    mobileMedia: { type: AnswerMediaPreviewType },
    vttMedia: { type: AnswerMediaPreviewType },
    externalVideoIds: { type: ExternalVideoIdsObjectType },
  }),
});
export const AnswerMediaPreviewType = new GraphQLObjectType({
  name: 'AnswerMediaPreview',
  fields: {
    type: { type: GraphQLString },
    tag: { type: GraphQLString },
    needsTransfer: { type: GraphQLBoolean },
    url: { type: GraphQLString },
  },
});

export const mentorImportPreview = {
  type: MentorImportPreviewType,
  args: {
    mentor: { type: GraphQLNonNull(GraphQLID) },
    json: { type: GraphQLNonNull(MentorImportJsonType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { mentor: string; json: MentorImportJson },
    context: { user: User; org: Organization }
  ): Promise<MentorImportPreview> => {
    const mentor = await MentorModel.findById(args.mentor);
    if (!canViewMentor(mentor, context.user, context.org)) {
      throw new Error(
        `mentor is private and you do not have permission to access`
      );
    }
    const importJson = args.json; //The mentor being imported
    const exportJson = await MentorModel.export(args.mentor); //The mentor being replaced
    const curSubjects = await SubjectModel.find({
      _id: {
        $in: importJson.subjects.map((s) => s._id).filter((id) => isId(id)),
      },
    });
    const subjectChanges = [];
    for (const subjectImport of importJson.subjects) {
      const cur = curSubjects.find(
        (s) => `${s._id}` === `${subjectImport._id}`
      );
      subjectChanges.push({
        importData: subjectImport,
        curData: cur,
        // If the subject does not exist, tags it to be CREATED
        // If the subject exists but the mentor being replaced does not currently have it added, then tags it to be ADDED
        // If the previous 2 are false, then the mentor already has the subject, no changes need to be made to that subjects existence
        editType: !cur
          ? EditType.CREATED
          : !exportJson.subjects.find(
              (s) => `${s._id}` === `${subjectImport._id}`
            )
          ? EditType.ADDED
          : EditType.NONE,
      });
    }
    // Check if the current mentor has subjects that the imported mentor does not, mark them for removal if so
    const removedSubjects = exportJson.subjects.filter(
      (s) => !importJson.subjects.find((ss) => `${ss._id}` === `${s._id}`)
    );
    subjectChanges.push(
      ...removedSubjects.map((s) => ({
        curData: s,
        editType: EditType.REMOVED,
      }))
    );

    const curQuestions: Question[] = await QuestionModel.find({});
    const questionChanges = [];
    for (const questionImport of importJson.questions) {
      const curQuestion = questionImport.mentor
        ? null
        : curQuestions.find(
            (q) =>
              `${q._id}` === `${questionImport._id}` ||
              (!questionImport.mentor &&
                `${q.question}` === `${questionImport.question}`)
          );
      const curMentorAlreadyHasQuestion = exportJson.questions.find(
        (q) => `${q._id}` === `${questionImport._id}`
      );

      questionChanges.push({
        importData: questionImport,
        curData: curQuestion,
        // If the question does not exist, tags it to be CREATED
        //    (this typically occurs when importing a mentor from careerfair --> v2 or vice versa, where questions have different id's, could this cause duplicate questions?)
        // If the question exists but the mentor being replaced does not currently have it added, then tags it to be ADDED
        // If the previous 2 are false, then the mentor already has the question, and no changes need to be made to that questions existence
        editType: !curQuestion
          ? EditType.CREATED
          : !curMentorAlreadyHasQuestion
          ? EditType.ADDED
          : EditType.NONE,
      });
    }

    // Check if the current mentor has questions that the imported mentor does not, mark them for removal if so
    const removedQuestions = exportJson.questions.filter(
      (q) => !importJson.questions.find((qq) => `${qq._id}` === `${q._id}`)
    );
    questionChanges.push(
      ...removedQuestions.map((q) => ({
        curData: q,
        editType: EditType.OLD_FOLLOWUP,
      }))
    );

    const curAnswers: Answer[] = await AnswerModel.find({
      mentor: args.mentor,
      question: {
        $in: importJson.answers
          .map((a) => a.question._id)
          .filter((id) => isId(id)),
      },
    });
    const answerChanges = [];
    for (const answerImport of importJson.answers) {
      const curAnswer = curAnswers.find(
        (a) => `${a.question}` === `${answerImport.question._id}`
      );
      // Media ALWAYS needs to be transferred between the 2 different mentors buckets so as to unlink them
      answerImport.hasUntransferredMedia =
        Boolean(answerImport.webMedia) ||
        Boolean(answerImport.mobileMedia) ||
        Boolean(answerImport.vttMedia);
      if (answerImport.webMedia) {
        answerImport.webMedia.needsTransfer = true;
      }
      if (answerImport.vttMedia) {
        answerImport.vttMedia.needsTransfer = true;
      }
      if (answerImport.mobileMedia) {
        answerImport.mobileMedia.needsTransfer = true;
      }

      if (
        answerImport.transcript ||
        answerImport.webMedia ||
        answerImport.mobileMedia ||
        answerImport.vttMedia ||
        curAnswer?.webMedia ||
        curAnswer?.mobileMedia ||
        curAnswer?.vttMedia ||
        curAnswer?.transcript
      )
        answerChanges.push({
          importData: answerImport,
          curData: curAnswer,
          editType: !curAnswer
            ? EditType.CREATED
            : !exportJson.answers.find(
                (a) => `${a.question}` === `${answerImport.question._id}`
              )
            ? EditType.ADDED
            : EditType.NONE,
        });
    }

    const removedAnswers = exportJson.answers.filter(
      (a) =>
        // Make sure that is is an answer of value
        Boolean(a.transcript || a.webMedia || a.mobileMedia || a.vttMedia) &&
        !importJson.answers.find(
          (aa) => `${aa.question._id}` === `${a.question}`
        )
    );
    answerChanges.push(
      ...removedAnswers.map((a) => ({
        curData: a,
        editType: EditType.OLD_ANSWER,
      }))
    );
    return {
      id: exportJson.id,
      subjects: subjectChanges,
      questions: questionChanges,
      answers: answerChanges,
    };
  },
};

export default mentorImportPreview;
