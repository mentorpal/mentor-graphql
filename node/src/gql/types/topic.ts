/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLList,
} from 'graphql';

export interface Topic {
  _id: string;
  name: string;
  description: string;
}

// TODO: replace TopicGQL with Topic interface everywhere
export interface TopicGQL {
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

export const TopicType = new GraphQLObjectType({
  name: 'Topic',
  fields: () => ({
    _id: { type: GraphQLID },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
  }),
});

export interface TopicsPayload {
  topics: Topic[];
}

export const TopicsPayloadType = new GraphQLObjectType({
  name: 'TopicsPayload',
  fields: () => ({
    topics: { type: new GraphQLList(TopicType) },
  }),
});

export default TopicType;
