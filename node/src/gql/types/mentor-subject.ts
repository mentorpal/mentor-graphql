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
import {
  MentorSubject as MentorSubjectSchema,
  Subject as SubjectSchema,
  Topic as TopicSchema,
} from 'models';
import { MentorSubject } from 'models/MentorSubject';
import QuestionType from './question';
import SubjectType, { SubjectCategoryType } from './subject';
import TopicType from './topic';

export const MentorSubjectType = new GraphQLObjectType({
  name: 'MentorSubject',
  fields: () => ({
    _id: { type: GraphQLID },
    subject: { type: SubjectType },
    name: {
      type: GraphQLString,
      resolve: async (ms: MentorSubject) => {
        const subject = await SubjectSchema.findOne({ _id: ms.subject });
        return subject.name;
      },
    },
    description: {
      type: GraphQLString,
      resolve: async (ms: MentorSubject) => {
        const subject = await SubjectSchema.findOne({ _id: ms.subject });
        return subject.description;
      },
    },
    isRequired: {
      type: GraphQLBoolean,
      resolve: async (ms: MentorSubject) => {
        const subject = await SubjectSchema.findOne({ _id: ms.subject });
        return subject.isRequired;
      },
    },
    categories: {
      type: GraphQLList(SubjectCategoryType),
      resolve: async (ms: MentorSubject) => {
        const subject = await SubjectSchema.findOne({ _id: ms.subject });
        return subject.categories;
      },
    },
    topicsOrder: {
      type: GraphQLList(TopicType),
      resolve: async (ms: MentorSubject) => {
        const subject = await SubjectSchema.findOne({ _id: ms.subject });
        const topics = await TopicSchema.find({
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
      resolve: async function (mentorSubject: MentorSubject) {
        return await MentorSubjectSchema.getTopics(mentorSubject);
      },
    },
    questions: {
      type: GraphQLList(QuestionType),
      args: {
        topic: { type: GraphQLID },
      },
      resolve: async function (
        mentorSubject: MentorSubject,
        args: { topic: string }
      ) {
        return await MentorSubjectSchema.getQuestions(
          mentorSubject,
          args.topic
        );
      },
    },
  }),
});

export default MentorSubjectType;
