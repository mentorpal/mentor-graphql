/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLFloat,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { UserQuestion as UserQuestionModel } from '../../models';
import {
  UserQuestion,
  Feedback,
  ClassifierAnswerType,
  ClassifierUsed,
} from '../../models/UserQuestion';
import { UserQuestionType } from '../types/user-question';

export interface UserQuestionCreateInput {
  question: string;
  mentor: string;
  classifierAnswer: string;
  classifierAnswerType: string;
  classifierUsed: ClassifierUsed;
  chatSessionId: string;
  confidence: number;
}

export const UserQuestionCreateInputType = new GraphQLInputObjectType({
  name: 'UserQuestionCreateInput',
  description: 'Input for creating a user question',
  fields: () => ({
    question: {
      type: new GraphQLNonNull(GraphQLString),
    },
    mentor: {
      type: new GraphQLNonNull(GraphQLID),
    },
    classifierAnswer: {
      type: new GraphQLNonNull(GraphQLID),
    },
    classifierAnswerType: {
      type: GraphQLString,
    },
    classifierUsed: {
      type: GraphQLString,
    },
    chatSessionId: {
      type: GraphQLString,
    },
    confidence: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
  }),
});

export const userQuestionCreate = {
  type: UserQuestionType,
  args: {
    userQuestion: { type: new GraphQLNonNull(UserQuestionCreateInputType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { userQuestion: UserQuestionCreateInput }
  ): Promise<UserQuestion> => {
    return await UserQuestionModel.create({
      question: args.userQuestion.question,
      mentor: args.userQuestion.mentor,
      classifierAnswer: args.userQuestion.classifierAnswer,
      classifierAnswerType:
        args.userQuestion.classifierAnswerType ||
        ClassifierAnswerType.CLASSIFIER,
      classifierUsed:
        args.userQuestion.classifierUsed || ClassifierUsed.NONE_SPECIFIED,
      confidence: args.userQuestion.confidence,
      graderAnswer: null,
      chatSessionId: args.userQuestion.chatSessionId || '',
      feedback: Feedback.NEUTRAL,
    });
  },
};

export default userQuestionCreate;
