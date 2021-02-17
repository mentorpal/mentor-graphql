/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose from 'mongoose';
import { GraphQLString, GraphQLObjectType } from 'graphql';
import { Question as QuestionModel, Topic as TopicModel } from 'models';
import { User } from 'models/User';
import { Question } from 'models/Question';
import QuestionType, { QuestionGQL } from 'gql/types/question';

export const updateQuestion = {
  type: QuestionType,
  args: {
    question: { type: GraphQLString },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { question: string },
    context: { user: User }
  ): Promise<Question> => {
    if (!args.question) {
      throw new Error('missing required param question');
    }
    const questionUpdate: QuestionGQL = JSON.parse(decodeURI(args.question));
    for (const [i, topic] of questionUpdate.topics.entries()) {
      const t = await TopicModel.findOneAndUpdate(
        {
          _id: topic._id || mongoose.Types.ObjectId(),
        },
        {
          $set: {
            name: topic.name,
            description: topic.description,
          },
        },
        {
          new: true,
          upsert: true,
        }
      );
      questionUpdate.topics[i] = t;
    }
    return await QuestionModel.findOneAndUpdate(
      {
        _id: questionUpdate._id || mongoose.Types.ObjectId(),
      },
      {
        $set: {
          question: questionUpdate.question,
          topics: questionUpdate.topics.map((t) => t._id),
          paraphrases: questionUpdate.paraphrases,
          type: questionUpdate.type,
          name: questionUpdate.name,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );
  },
};

export default updateQuestion;
