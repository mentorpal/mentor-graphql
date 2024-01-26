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
  GraphQLBoolean,
} from 'graphql';

import {
  Subject as SubjectModel,
  Question as QuestionModel,
} from '../../../models';
import { Question } from '../../../models/Question';
import { Subject, SubjectQuestionProps } from '../../../models/Subject';
import { User } from '../../../models/User';
import SubjectType from '../../types/subject';
import {
  QuestionUpdateInput,
  QuestionUpdateInputType,
} from './question-update';
import { toUpdateProps } from './helpers';
import { canEditContent } from '../../../utils/check-permissions';

export interface CategoryUpdateInput {
  id: string;
  name: string;
  description: string;
  defaultTopic: string;
}

export const CategoryInputType = new GraphQLInputObjectType({
  name: 'CategoryInputType',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    defaultTopic: { type: GraphQLString },
  }),
});

export interface TopicUpdateInput {
  id: string;
  name: string;
  description: string;
}

export const TopicInputType = new GraphQLInputObjectType({
  name: 'TopicInputType',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
  }),
});

export interface SubjectQuestionUpdateInput {
  question: QuestionUpdateInput;
  category?: CategoryUpdateInput;
  topics?: TopicUpdateInput[];
}

export const SubjectQuestionInputType = new GraphQLInputObjectType({
  name: 'SubjectQuestionInputType',
  fields: () => ({
    question: { type: QuestionUpdateInputType },
    category: { type: CategoryInputType },
    topics: { type: GraphQLList(TopicInputType) },
  }),
});

export interface SubjectUpdateInput {
  _id: string;
  name: string;
  type: string;
  description: string;
  isRequired: boolean;
  isArchived: boolean;
  deleted: boolean;
  categories: CategoryUpdateInput[];
  topics: TopicUpdateInput[];
  questions: SubjectQuestionUpdateInput[];
}

export const SubjectUpdateInputType = new GraphQLInputObjectType({
  name: 'SubjectUpdateInputType',
  fields: () => ({
    _id: { type: GraphQLID },
    name: { type: GraphQLString },
    type: { type: GraphQLString },
    description: { type: GraphQLString },
    isRequired: { type: GraphQLBoolean },
    isArchived: { type: GraphQLBoolean },
    deleted: { type: GraphQLBoolean },
    categories: { type: GraphQLList(CategoryInputType) },
    topics: { type: GraphQLList(TopicInputType) },
    questions: { type: GraphQLList(SubjectQuestionInputType) },
  }),
});

export async function questionInputToUpdate(
  input: SubjectQuestionUpdateInput,
  subjectTopics: string[]
): Promise<SubjectQuestionProps> {
  const { _id, props } = toUpdateProps<Question>(input.question);
  const q = await QuestionModel.findOneAndUpdate(
    { _id: _id },
    { $set: props },
    {
      new: true,
      upsert: true,
    }
  );
  return {
    question: q._id,
    category: input.category?.id,
    // don't include topics that are not in the subject
    topics:
      input.topics
        ?.filter((t) => subjectTopics.includes(t.id))
        .map((t) => t.id) || [],
  };
}

export const subjectUpdate = {
  type: SubjectType,
  args: { subject: { type: GraphQLNonNull(SubjectUpdateInputType) } },
  resolve: async (
    _root: GraphQLObjectType,
    args: { subject: SubjectUpdateInput },
    context: { user: User }
  ): Promise<Subject> => {
    if (context.user?.isDisabled) {
      throw new Error('Your account has been disabled');
    }
    const userCanManageArchival = canEditContent(context.user);
    if (
      (args.subject.isArchived || args.subject.deleted) &&
      !userCanManageArchival
    ) {
      throw new Error('User is not authorized to archive this subject.');
    }
    return await SubjectModel.updateOrCreate(args.subject);
  },
};

export default subjectUpdate;
