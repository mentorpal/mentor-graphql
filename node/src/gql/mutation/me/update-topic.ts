/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose from 'mongoose';
import { GraphQLString, GraphQLObjectType } from 'graphql';
import { Topic as TopicModel } from 'models';
import { User } from 'models/User';
import TopicType, { TopicGQL } from 'gql/types/topic';
import { Topic } from 'models/Topic';

export const updateTopic = {
  type: TopicType,
  args: {
    topic: { type: GraphQLString },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { topic: string },
    context: { user: User }
  ): Promise<Topic> => {
    if (!args.topic) {
      throw new Error('missing required param topic');
    }
    const topicUpdate: TopicGQL = JSON.parse(decodeURI(args.topic));
    return await TopicModel.findOneAndUpdate(
      {
        _id: topicUpdate._id || mongoose.Types.ObjectId(),
      },
      {
        $set: {
          name: topicUpdate.name,
          description: topicUpdate.description,
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
