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
  Question as QuestionModel,
} from 'models';
import { UserQuestion } from 'models/UserQuestion';
import { UserQuestionType } from 'gql/types/user-question';
import { Answer } from 'models/Answer';

export const userQuestionSetAnswer = {
  type: UserQuestionType,
  args: {
    id: { type: GraphQLNonNull(GraphQLID) },
    answer: { type: GraphQLString },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { id: string; answer: string }
  ): Promise<UserQuestion> => {
    // Remove old answer as a paraphrase from question
    const oldUserQuestion: UserQuestion = await UserQuestionModel.findById(
      args.id
    );
    if (!oldUserQuestion) {
      throw new Error('invalid id');
    }
    if (`${oldUserQuestion.graderAnswer}` === `${args.answer}`) {
      // no changes needed
      return oldUserQuestion;
    }
    const oldAnswer: Answer = await AnswerModel.findById(
      oldUserQuestion.graderAnswer
    );
    if (oldAnswer) {
      await QuestionModel.findByIdAndUpdate(oldAnswer.question, {
        $pull: {
          paraphrases: oldUserQuestion.question,
        },
      });
    }

    // Add new answer as a paraphrase to question
    const userQuestion: UserQuestion = await UserQuestionModel.findByIdAndUpdate(
      args.id,
      {
        graderAnswer: args.answer ? mongoose.Types.ObjectId(args.answer) : null,
      },
      {
        new: true,
      }
    );
    const answer: Answer = await AnswerModel.findById(args.answer);
    if (answer) {
      await QuestionModel.findByIdAndUpdate(answer.question, {
        $addToSet: {
          paraphrases: userQuestion.question,
        },
      });
    }
    return userQuestion;
  },
};

export default userQuestionSetAnswer;
