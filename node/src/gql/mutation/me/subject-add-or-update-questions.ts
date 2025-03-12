/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLList,
  GraphQLString,
} from 'graphql';
import { User } from '../../../models/User';

import { Subject as SubjectModel } from '../../../models';
import {
  SubjectQuestionInputType,
  SubjectQuestionUpdateInput,
} from './subject-update';
import { UseDefaultTopics } from './helpers';
import { Types } from 'mongoose';

interface SubjectAddOrUpdateQuestionGQLType {
  question: Types.ObjectId;
  category: string;
  topics: string[];
  useDefaultTopics?: UseDefaultTopics;
}

export const SubjectAddOrUpdateQuestionGQLType = new GraphQLObjectType({
  name: 'SubjectAddQuestionGQLType',
  fields: {
    category: { type: GraphQLString },
    topics: { type: new GraphQLList(GraphQLID) },
    question: { type: GraphQLID },
    useDefaultTopics: { type: GraphQLString },
  },
});

export const subjectAddOrUpdateQuestions = {
  type: new GraphQLList(SubjectAddOrUpdateQuestionGQLType),
  args: {
    subject: { type: new GraphQLNonNull(GraphQLID) },
    questions: {
      type: new GraphQLNonNull(new GraphQLList(SubjectQuestionInputType)),
    },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { subject: string; questions: SubjectQuestionUpdateInput[] },
    context: { user: User }
  ): Promise<SubjectAddOrUpdateQuestionGQLType[]> => {
    if (context.user?.isDisabled) {
      throw new Error('Your account has been disabled');
    }
    return await SubjectModel.addOrUpdateQuestions(
      args.subject,
      args.questions
    );
  },
};

export default subjectAddOrUpdateQuestions;
