/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';

import { Subject as SubjectModel, Topic as TopicModel } from 'models';
import { Subject } from 'models/Subject';
import QuestionType from './question';
import TopicType from './topic';

export const SubjectType = new GraphQLObjectType({
  name: 'Subject',
  fields: () => ({
    _id: { type: GraphQLID },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    isRequired: {
      type: GraphQLBoolean!,
      resolve: async (subject: Subject) => {
        return Boolean(subject.isRequired);
      },
    },
    topicsOrder: {
      type: GraphQLList(TopicType),
      resolve: async function (subject: Subject) {
        const topics = await TopicModel.find({
          _id: { $in: subject.topicsOrder },
        });
        topics.sort((a, b) => {
          return (
            subject.topicsOrder.indexOf(a._id) -
            subject.topicsOrder.indexOf(b._id)
          );
        });
        return topics;
      },
    },
    topics: {
      type: GraphQLList(TopicType),
      resolve: async function (subject: Subject) {
        return await SubjectModel.getTopics(subject);
      },
    },
    questions: {
      type: GraphQLList(QuestionType),
      args: {
        topic: { type: GraphQLID },
      },
      resolve: async function (subject: Subject, args: { topic: string }) {
        return await SubjectModel.getQuestions(subject, args.topic);
      },
    },
  }),
});

export default SubjectType;
