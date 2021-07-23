/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { MentorType } from 'gql/types/mentor';
import { Mentor as MentorModel } from 'models';
import { Mentor } from 'models/Mentor';
import { AnswerMedia, Status } from 'models/Answer';
import { AnswerMediaInputType } from '../api/upload-answer';

export interface MentorImportJson {
  subjects: SubjectImportJson[];
  questions: QuestionImportJson[];
  answers: AnswerImportJson[];
}

export const MentorImportJsonType = new GraphQLInputObjectType({
  name: 'MentorImportJsonType',
  fields: () => ({
    subjects: { type: GraphQLList(SubjectImportJsonType) },
    questions: { type: GraphQLList(QuestionImportJsonType) },
    answers: { type: GraphQLList(AnswerImportJsonType) },
  }),
});

export interface SubjectImportJson {
  _id: string;
  name: string;
  description: string;
  isRequired: boolean;
  categories: CategoryImportJson[];
  topics: TopicImportJson[];
  questions: SubjectQuestionImportJson[];
}

export const SubjectImportJsonType = new GraphQLInputObjectType({
  name: 'SubjectImportJsonType',
  fields: () => ({
    _id: { type: GraphQLID },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    isRequired: { type: GraphQLBoolean },
    categories: { type: GraphQLList(CategoryImportJsonType) },
    topics: { type: GraphQLList(TopicImportJsonType) },
    questions: { type: GraphQLList(SubjectQuestionImportJsonType) },
  }),
});

export interface CategoryImportJson {
  id: string;
  name: string;
  description: string;
}

export const CategoryImportJsonType = new GraphQLInputObjectType({
  name: 'CategoryImportJsonType',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
  }),
});

export interface TopicImportJson {
  id: string;
  name: string;
  description: string;
}

export const TopicImportJsonType = new GraphQLInputObjectType({
  name: 'TopicImportJsonType',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
  }),
});

export interface SubjectQuestionImportJson {
  question: QuestionImportJson;
  category?: CategoryImportJson;
  topics?: TopicImportJson[];
}

export const SubjectQuestionImportJsonType = new GraphQLInputObjectType({
  name: 'SubjectQuestionImportJsonType',
  fields: () => ({
    question: { type: QuestionImportJsonType },
    category: { type: CategoryImportJsonType },
    topics: { type: GraphQLList(TopicImportJsonType) },
  }),
});

export interface QuestionImportJson {
  _id: string;
  question: string;
  type: string;
  name: string;
  paraphrases: string[];
  mentor: string;
  mentorType: string;
  minVideoLength: number;
}

export const QuestionImportJsonType = new GraphQLInputObjectType({
  name: 'QuestionImportJsonType',
  fields: () => ({
    _id: { type: GraphQLID },
    question: { type: GraphQLString },
    type: { type: GraphQLString },
    name: { type: GraphQLString },
    paraphrases: { type: GraphQLList(GraphQLString) },
    mentor: { type: GraphQLID },
    mentorType: { type: GraphQLString },
    minVideoLength: { type: GraphQLInt },
  }),
});

export interface AnswerImportJson {
  question: QuestionImportJson;
  transcript: string;
  status: Status;
  media: AnswerMedia[];
}

export const AnswerImportJsonType = new GraphQLInputObjectType({
  name: 'AnswerImportJsonType',
  fields: () => ({
    question: { type: GraphQLNonNull(QuestionImportJsonType) },
    transcript: { type: GraphQLString },
    status: { type: GraphQLString },
    media: { type: GraphQLList(AnswerMediaInputType) },
  }),
});

export const importMentor = {
  type: MentorType,
  args: {
    mentor: { type: GraphQLNonNull(GraphQLID) },
    json: { type: GraphQLNonNull(MentorImportJsonType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { mentor: string; json: MentorImportJson }
  ): Promise<Mentor> => {
    try {
      return await MentorModel.import(args.mentor, args.json);
    } catch (err) {
      throw err;
    }
  },
};

export default importMentor;
