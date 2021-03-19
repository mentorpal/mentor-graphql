/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
  GraphQLInputObjectType,
} from 'graphql';
import { Topic as TopicModel } from 'models';
import { User } from 'models/User';
import { Topic } from 'models/Topic';
import TopicType from 'gql/types/topic';
import { idOrNew } from './helpers';

export interface TopicUpdateInput {
  _id: string;
  name: string;
  description: string;
}

export const TopicUpdateInputType = new GraphQLInputObjectType({
  name: 'TopicUpdateInputType',
  fields: () => ({
    _id: { type: GraphQLID },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
  }),
});

export const updateTopic = {
  type: TopicType,
  args: {
    topic: { type: GraphQLNonNull(TopicUpdateInputType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { topic: TopicUpdateInput },
    context: { user: User }
  ): Promise<Topic> => {
    const topicUpdate: TopicUpdateInput = args.topic;
    topicUpdate._id = idOrNew(topicUpdate._id);
    return await TopicModel.findOneAndUpdate(
      {
        _id: topicUpdate._id,
      },
      {
        $set: {
          ...topicUpdate,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );
  },
};

export default updateTopic;
