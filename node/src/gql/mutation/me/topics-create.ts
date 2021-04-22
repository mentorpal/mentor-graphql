/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import TopicType from 'gql/types/topic';
import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInputObjectType,
  GraphQLString,
} from 'graphql';
import { Topic as TopicModel } from 'models';
import { User } from 'models/User';

export interface TopicInput {
  _id: string;
  name: string;
  description: string;
}

export interface TopicCreateInput {
  name: string;
  description: string;
}

export const TopicCreateInputType = new GraphQLInputObjectType({
  name: 'TopicCreateInput',
  description: 'Input for creating a topic',
  fields: () => ({
    name: {
      type: GraphQLString,
    },
    description: {
      type: GraphQLString,
    },
  }),
});

export interface TopicsPayload {
  topics: TopicInput[];
}

export const TopicsPayloadType = new GraphQLObjectType({
  name: 'TopicsPayload',
  fields: () => ({
    topics: { type: new GraphQLList(TopicType) },
  }),
});

export const topicsCreate = {
  type: TopicsPayloadType,
  args: {
    topics: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(TopicCreateInputType))
      ),
    },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { topics: TopicCreateInput[] },
    context: { user: User }
  ): Promise<TopicsPayload> => {
    if (!args.topics) {
      throw new Error('missing required param topic');
    }
    if (args.topics.length === 0) {
      throw new Error('input topics must include at least one item');
    }
    const topics = await TopicModel.insertMany(args.topics);
    return { topics };
  },
};

export default topicsCreate;
