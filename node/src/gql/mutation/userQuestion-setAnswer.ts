/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLObjectType, GraphQLString } from 'graphql';
import {
  UserQuestion as UserQuestionModel,
  Answer as AnswerModel,
  Question as QuestionModel,
} from 'models';
import { UserQuestion } from 'models/UserQuestion';
import { UserQuestionType } from 'gql/types/user-question';
import { Answer } from 'models/Answer';
import { Question } from 'models/Question';

export const userQuestionSetAnswer = {
  type: UserQuestionType,
  args: {
    id: { type: GraphQLString },
    answer: { type: GraphQLString },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { id: string; answer: string }
  ): Promise<UserQuestion> => {
    if (!args.id) {
      throw new Error('missing required param id');
    }
    if (!args.answer) {
      throw new Error('missing required param answer');
    }
    const feedback: UserQuestion = await UserQuestionModel.findOne({
      _id: args.id,
    });
    if (!feedback) {
      throw new Error('invalid id');
    }
    const answer: Answer = await AnswerModel.findOne({ _id: args.answer });
    if (!answer) {
      throw new Error('invalid answer');
    }
    const question: Question = await QuestionModel.findOne({
      _id: answer.question,
    });
    if (!question.paraphrases.includes(feedback.question)) {
      await QuestionModel.findOneAndUpdate(
        {
          _id: answer.question,
        },
        {
          $set: {
            paraphrases: [...question.paraphrases, feedback.question],
          },
        }
      );
    }

    return await UserQuestionModel.findOneAndUpdate(
      {
        _id: args.id,
      },
      {
        $set: {
          graderAnswer: args.answer,
        },
      },
      {
        new: true,
      }
    );
  },
};

export default userQuestionSetAnswer;
