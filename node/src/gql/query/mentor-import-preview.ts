/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
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
} from 'models';
import { Subject } from 'models/Subject';
import { Question } from 'models/Question';
import { Answer } from 'models/Answer';
import {
  AnswerUpdateInput,
  MentorImportJson,
  MentorImportJsonType,
} from 'gql/mutation/me/mentor-import';
import SubjectType from 'gql/types/subject';
import QuestionType from 'gql/types/question';
import AnswerType from 'gql/types/answer';
import { SubjectUpdateInput } from 'gql/mutation/me/update-subject';
import { QuestionUpdateInput } from 'gql/mutation/me/update-question';
import { isId } from 'gql/mutation/me/helpers';

enum EditType {
  NONE = 'NONE',
  ADDED = 'ADDED',
  REMOVED = 'REMOVED',
  CREATED = 'CREATED',
}
interface ImportPreview<T, U> {
  importData: T | undefined;
  curData: U | undefined;
  editType: EditType;
}
interface MentorImportPreview {
  subjects: ImportPreview<SubjectUpdateInput, Subject>[];
  questions: ImportPreview<QuestionUpdateInput, Question>[];
  answers: ImportPreview<AnswerUpdateInput, Answer>[];
}

export const MentorImportPreviewType = new GraphQLObjectType({
  name: 'MentorImportPreviewType',
  fields: () => ({
    subjects: { type: GraphQLList(SubjectImportPreviewType) },
    questions: { type: GraphQLList(QuestionImportPreviewType) },
    answers: { type: GraphQLList(AnswerImportPreviewType) },
  }),
});
export const SubjectImportPreviewType = new GraphQLObjectType({
  name: 'SubjectImportPreviewType',
  fields: () => ({
    importData: { type: SubjectType },
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
    importData: { type: AnswerType },
    curData: { type: AnswerType },
    editType: { type: GraphQLString },
  }),
});

export const mentorImportPreview = {
  type: MentorImportPreviewType,
  args: {
    mentor: { type: GraphQLNonNull(GraphQLID) },
    json: { type: GraphQLNonNull(MentorImportJsonType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { mentor: string; json: MentorImportJson }
  ): Promise<MentorImportPreview> => {
    try {
      const importJson = args.json;
      const exportJson = await MentorModel.export(args.mentor);

      const curSubjects = await SubjectModel.find({
        _id: {
          $in: importJson.subjects.map((s) => s._id).filter((id) => isId(id)),
        },
      });
      const subjectChanges = [];
      for (const subjectImport of importJson.subjects) {
        const curSubject = curSubjects.find(
          (s) => `${s._id}` === `${subjectImport._id}`
        );
        subjectChanges.push({
          importData: subjectImport,
          curData: curSubject,
          editType: !curSubject
            ? EditType.CREATED
            : !exportJson.subjects.find(
                (s) => `${s._id}` === `${subjectImport._id}`
              )
            ? EditType.ADDED
            : EditType.NONE,
        });
      }
      const removedSubjects = exportJson.subjects.filter(
        (s) => !importJson.subjects.find((ss) => `${ss._id}` === `${s._id}`)
      );
      subjectChanges.push(
        ...removedSubjects.map((s) => ({
          importData: undefined,
          curData: s,
          editType: EditType.REMOVED,
        }))
      );

      const curQuestions: Question[] = await QuestionModel.find({
        _id: {
          $in: importJson.questions.map((q) => q._id).filter((id) => isId(id)),
        },
      });
      const questionChanges = [];
      for (const questionImport of importJson.questions) {
        const curQuestion = curQuestions.find(
          (q) => `${q._id}` === `${questionImport._id}`
        );
        questionChanges.push({
          importData: questionImport,
          curData: curQuestion,
          editType: !curQuestion
            ? EditType.CREATED
            : !exportJson.questions.find(
                (q) => `${q._id}` === `${questionImport._id}`
              )
            ? EditType.ADDED
            : EditType.NONE,
        });
      }
      const removedQuestions = exportJson.questions.filter(
        (q) => !importJson.questions.find((qq) => `${qq._id}` === `${q._id}`)
      );
      questionChanges.push(
        ...removedQuestions.map((q) => ({
          importData: undefined,
          curData: q,
          editType: EditType.REMOVED,
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
          !importJson.answers.find(
            (aa) => `${aa.question._id}` === `${a.question}`
          )
      );
      answerChanges.push(
        ...removedAnswers.map((a) => ({
          importData: undefined,
          curData: a,
          editType: EditType.REMOVED,
        }))
      );
      return {
        subjects: subjectChanges,
        questions: questionChanges,
        answers: answerChanges,
      };
    } catch (err) {
      throw err;
    }
  },
};

export default mentorImportPreview;
