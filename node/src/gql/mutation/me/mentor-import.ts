/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLFloat,
} from 'graphql';
import { MentorType } from '../../types/mentor';
import { Mentor as MentorModel } from '../../../models';
import { Mentor } from '../../../models/Mentor';
import { AnswerMedia, AnswerMediaProps, Status } from '../../../models/Answer';
import { SubjectUpdateInput, SubjectUpdateInputType } from './subject-update';
import {
  QuestionUpdateInput,
  QuestionUpdateInputType,
} from './question-update';
import {
  ExportedMentorInfo,
  ExportedMentorInfoInputType,
} from '../../query/mentor-export';
import { UserQuestion } from '../../../models/UserQuestion';

export interface MentorImportJson {
  id: string;
  mentorInfo: ExportedMentorInfo;
  subjects: SubjectUpdateInput[];
  questions: QuestionUpdateInput[];
  answers: AnswerUpdateInput[];
  userQuestions: UserQuestion[];
}

export const MentorImportJsonType = new GraphQLInputObjectType({
  name: 'MentorImportJsonType',
  fields: () => ({
    id: { type: GraphQLString },
    mentorInfo: { type: ExportedMentorInfoInputType },
    subjects: { type: GraphQLList(SubjectUpdateInputType) },
    questions: { type: GraphQLList(QuestionUpdateInputType) },
    answers: { type: GraphQLList(AnswerUpdateInputType) },
    userQuestions: { type: GraphQLList(UserQuestionInputType) },
  }),
});

interface Question {
  _id: string;
  question: string;
  type: string;
  name: string;
  clientId: string;
  paraphrases: string[];
  mentor: string;
  mentorType: string;
  minVideoLength: number;
}

interface AnswerGQL {
  _id: string;
  question: Question;
  hasEditedTranscript: boolean;
  transcript: string;
  status: Status;
  webMedia?: AnswerMedia;
  mobileMedia?: AnswerMedia;
  vttMedia?: AnswerMedia;
  hasUntransferredMedia: boolean;
  media: AnswerMedia[];
}

export interface ReplacedMentorQuestionChanges {
  editType: string;
  data: Question;
}

export interface ReplacedMentorAnswerChanges {
  editType: string;
  data: AnswerGQL;
}

export interface ReplacedMentorDataChanges {
  questionChanges: ReplacedMentorQuestionChanges[];
  answerChanges: ReplacedMentorAnswerChanges[];
}

export const ReplacedMentorDataChangesType = new GraphQLInputObjectType({
  name: 'ReplacedMentorDataChangesType',
  fields: () => ({
    questionChanges: {
      type: GraphQLList(ReplacedMentorQuestionChangesInputType),
    },
    answerChanges: {
      type: GraphQLList(ReplacedMentorAnswerChangesInputType),
    },
  }),
});

export interface AnswerUpdateInput {
  question: QuestionUpdateInput;
  hasEditedTranscript: boolean;
  transcript: string;
  status: Status;
  hasUntransferredMedia: boolean;
  webMedia: AnswerMediaProps;
  mobileMedia: AnswerMediaProps;
  vttMedia: AnswerMediaProps;
}

export const ReplacedMentorQuestionChangesInputType =
  new GraphQLInputObjectType({
    name: 'ReplacedMentorQuestionChangesInputType',
    fields: () => ({
      editType: { type: GraphQLString },
      data: { type: QuestionUpdateInputType },
    }),
  });

export const ReplacedMentorAnswerChangesInputType = new GraphQLInputObjectType({
  name: 'ReplacedMentorAnswerChangesInputType',
  fields: () => ({
    editType: { type: GraphQLString },
    data: { type: AnswerUpdateInputType },
  }),
});

export const AnswerUpdateInputType = new GraphQLInputObjectType({
  name: 'AnswerUpdateInputType',
  fields: () => ({
    _id: { type: GraphQLID },
    question: { type: GraphQLNonNull(QuestionUpdateInputType) },
    hasEditedTranscript: { type: GraphQLBoolean },
    transcript: { type: GraphQLNonNull(GraphQLString) },
    status: { type: GraphQLNonNull(GraphQLString) },
    hasUntransferredMedia: { type: GraphQLBoolean },
    webMedia: { type: AnswerMediaUpdateInputType },
    mobileMedia: { type: AnswerMediaUpdateInputType },
    vttMedia: { type: AnswerMediaUpdateInputType },
  }),
});

export const UserQuestionInputType = new GraphQLInputObjectType({
  name: 'UserQuestionInputType',
  fields: () => ({
    _id: { type: GraphQLID },
    question: { type: GraphQLString },
    confidence: { type: GraphQLFloat },
    classifierAnswerType: { type: GraphQLString },
    feedback: { type: GraphQLString },
    mentor: { type: MentorUserQuestionInputType },
    classifierAnswer: { type: AnswerUserQuestionInputType },
    graderAnswer: { type: AnswerUserQuestionInputType },
  }),
});

export const MentorUserQuestionInputType = new GraphQLInputObjectType({
  name: 'MentorUserQuestionInputType',
  fields: () => ({
    _id: { type: GraphQLID },
    name: { type: GraphQLString },
  }),
});

export const AnswerUserQuestionInputType = new GraphQLInputObjectType({
  name: 'AnswerUserQuestionInputType',
  fields: () => ({
    _id: { type: GraphQLID },
    transcript: { type: GraphQLString },
    question: { type: QuestionUserQuestionInputType },
  }),
});

export const QuestionUserQuestionInputType = new GraphQLInputObjectType({
  name: 'QuestionUserQuestionInputType',
  fields: () => ({
    _id: { type: GraphQLID },
    question: { type: GraphQLString },
  }),
});

export const AnswerMediaUpdateInputType = new GraphQLInputObjectType({
  name: 'AnswerMediaUpdateInputType',
  fields: {
    type: { type: GraphQLString },
    tag: { type: GraphQLString },
    url: { type: GraphQLString },
    needsTransfer: { type: GraphQLBoolean },
  },
});

export const importMentor = {
  type: MentorType,
  args: {
    mentor: { type: GraphQLNonNull(GraphQLID) },
    json: { type: GraphQLNonNull(MentorImportJsonType) },
    replacedMentorDataChanges: {
      type: GraphQLNonNull(ReplacedMentorDataChangesType),
    },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      mentor: string;
      json: MentorImportJson;
      replacedMentorDataChanges: ReplacedMentorDataChanges;
    }
  ): Promise<Mentor> => {
    return await MentorModel.import(
      args.mentor,
      args.json,
      args.replacedMentorDataChanges
    );
  },
};

export default importMentor;
