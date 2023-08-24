/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLID,
  GraphQLFloat,
  GraphQLBoolean,
} from 'graphql';
import { Answer as AnswerModel, Mentor as MentorModel } from '../../models';
import { UserQuestion } from '../../models/UserQuestion';
import AnswerType from './answer';
import DateType from './date';
import MentorType from './mentor';

export const UserQuestionType = new GraphQLObjectType({
  name: 'UserQuestion',
  fields: () => ({
    _id: { type: GraphQLID },
    question: { type: GraphQLString },
    confidence: { type: GraphQLFloat },
    classifierAnswerType: { type: GraphQLString },
    classifierUsed: { type: GraphQLString },
    feedback: { type: GraphQLString },
    mentor: {
      type: MentorType,
      resolve: async function (uq: UserQuestion) {
        return MentorModel.findById(uq.mentor);
      },
    },
    classifierAnswer: {
      type: AnswerType,
      resolve: async function (uq: UserQuestion) {
        return AnswerModel.findById(uq.classifierAnswer);
      },
    },
    graderAnswer: {
      type: AnswerType,
      resolve: async function (uq: UserQuestion) {
        return AnswerModel.findById(uq.graderAnswer);
      },
    },
    chatSessionId: {
      type: GraphQLString,
      resolve: async function (uq: UserQuestion) {
        return uq.chatSessionId || '';
      },
    },
    createdAt: { type: DateType },
    updatedAt: { type: DateType },
    dismissed: { type: GraphQLBoolean },
  }),
});

export default UserQuestionType;
