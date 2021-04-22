/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLList,
} from 'graphql';
import { Question as QuestionModel, Topic as TopicModel } from 'models';
import { User } from 'models/User';
import { Question } from 'models/Question';
import QuestionType from 'gql/types/question';
import { TopicUpdateInput, TopicUpdateInputType } from './update-topic';
import { idOrNew } from './helpers';

export interface QuestionUpdateInput {
  _id: string;
  question: string;
  type: string;
  name: string;
  paraphrases: string[];
  topics: TopicUpdateInput[];
}

export const QuestionUpdateInputType = new GraphQLInputObjectType({
  name: 'QuestionUpdateInputType',
  fields: () => ({
    _id: { type: GraphQLString },
    question: { type: GraphQLString },
    type: { type: GraphQLString },
    name: { type: GraphQLString },
    paraphrases: { type: GraphQLList(GraphQLString) },
    topics: { type: GraphQLList(TopicUpdateInputType) },
  }),
});

export const updateQuestion = {
  type: QuestionType,
  args: {
    question: { type: GraphQLNonNull(QuestionUpdateInputType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { question: QuestionUpdateInput },
    context: { user: User }
  ): Promise<Question> => {
    const questionUpdate: QuestionUpdateInput = args.question;
    for (const [i, topic] of (questionUpdate.topics || []).entries()) {
      topic._id = idOrNew(topic._id);
      const t = await TopicModel.findOneAndUpdate(
        {
          _id: topic._id,
        },
        {
          $set: {
            ...topic,
          },
        },
        {
          new: true,
          upsert: true,
        }
      );
      questionUpdate.topics[i] = t;
    }

    const question: any = { ...questionUpdate };
    if (questionUpdate.topics) {
      question._id = idOrNew(questionUpdate._id);
      question.topics = questionUpdate.topics.map((t) => t._id);
    }

    return await QuestionModel.findOneAndUpdate(
      {
        _id: question._id,
      },
      {
        $set: {
          ...question,
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
