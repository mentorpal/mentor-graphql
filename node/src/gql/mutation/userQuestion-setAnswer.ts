/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import mongoose from 'mongoose';
import {
  UserQuestion as UserQuestionModel,
  Answer as AnswerModel,
} from '../../models';
import { UserQuestion } from '../../models/UserQuestion';
import { UserQuestionType } from '../types/user-question';

export const userQuestionSetAnswer = {
  type: UserQuestionType,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    answer: { type: GraphQLString },
    question: { type: GraphQLString },
    mentorId: { type: GraphQLID },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { id: string; answer: string; question: string; mentorId: string }
  ): Promise<UserQuestion> => {
    const oldUserQuestion: UserQuestion = await UserQuestionModel.findById(
      args.id
    );
    if (!oldUserQuestion) {
      throw new Error('invalid id');
    }
    if (args.answer && `${oldUserQuestion.graderAnswer}` === `${args.answer}`) {
      // no changes needed
      return oldUserQuestion;
    }
    let answerId = args.answer;
    // If no args.answer but a question is provided, create new answer document with question id
    if (!answerId && args.question && args.mentorId) {
      const newAnswer = await AnswerModel.findOneAndUpdate(
        { question: args.question, mentor: args.mentorId },
        { question: args.question },
        { upsert: true, new: true }
      );
      answerId = newAnswer._id.toString();
    }
    const userQuestion: UserQuestion =
      await UserQuestionModel.findByIdAndUpdate(
        args.id,
        {
          graderAnswer: answerId ? new mongoose.Types.ObjectId(answerId) : null,
        },
        {
          new: true,
        }
      );
    return userQuestion;
  },
};

export default userQuestionSetAnswer;
