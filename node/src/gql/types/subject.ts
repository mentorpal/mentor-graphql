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
import { Subject as SubjectModel } from '../../models';
import { Subject } from '../../models/Subject';
import DateType from './date';
import QuestionType from './question';

export const CategoryType = new GraphQLObjectType({
  name: 'Category',
  fields: {
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    defaultTopics: { type: new GraphQLList(GraphQLString) },
  },
});

export const TopicType = new GraphQLObjectType({
  name: 'Topic',
  fields: {
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    categoryParent: { type: GraphQLString },
  },
});

export const SubjectQuestionType = new GraphQLObjectType({
  name: 'SubjectQuestion',
  fields: {
    category: { type: CategoryType },
    topics: { type: new GraphQLList(TopicType) },
    useDefaultTopics: { type: GraphQLString },
    question: { type: QuestionType },
  },
});

export const SubjectType = new GraphQLObjectType({
  name: 'Subject',
  fields: () => ({
    _id: { type: GraphQLID },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    type: { type: GraphQLString },
    isRequired: {
      type: GraphQLBoolean,
      resolve: async (subject: Subject) => {
        return Boolean(subject.isRequired);
      },
    },
    isArchived: {
      type: GraphQLBoolean,
      resolve: async (subject: Subject) => {
        return Boolean(subject.isArchived);
      },
    },
    deleted: {
      type: GraphQLBoolean,
      resolve: async (subject: Subject) => {
        return Boolean(subject.deleted);
      },
    },
    topics: {
      type: new GraphQLList(TopicType),
      resolve: async function (subject: Subject) {
        const topics = subject.topics;
        const categories = subject.categories;
        const updatedTopicNames = topics.map((topic) => {
          const category = categories.find(
            (c) => c.id === topic.categoryParent
          );
          if (category) {
            topic.name = category.name;
          }
          return topic;
        });
        return updatedTopicNames;
      },
    },
    categories: { type: new GraphQLList(CategoryType) },
    questions: {
      type: new GraphQLList(SubjectQuestionType),
      args: {
        topic: { type: GraphQLID },
        mentor: { type: GraphQLID },
      },
      resolve: async function (
        subject: Subject,
        args: { topic: string; mentor: string }
      ) {
        return await SubjectModel.getQuestions(
          subject,
          args.topic,
          args.mentor
        );
      },
    },
    createdAt: { type: DateType },
    updatedAt: { type: DateType },
  }),
});

export default SubjectType;
