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

import { Question as QuestionModel } from 'models';
import { Subject } from 'models/Subject';
import QuestionType, { QuestionGQL } from './question';

export interface SubjectGQL {
  _id: string;
  name: string;
  description: string;
  isRequired: boolean;
  questions: QuestionGQL[];
}

export const SubjectType = new GraphQLObjectType({
  name: 'Subject',
  fields: () => ({
    _id: { type: GraphQLID },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    isRequired: {
      type: GraphQLBoolean!,
      resolve: async (subject: Subject) => {
        return Promise.resolve(Boolean(subject.isRequired));
      },
    },
    questions: {
      type: GraphQLList(QuestionType),
      resolve: async function (subject: Subject) {
        return QuestionModel.find({ _id: { $in: subject.questions } });
      },
    },
  }),
});

export default SubjectType;
