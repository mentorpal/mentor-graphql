/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLString, GraphQLObjectType } from 'graphql';
import { Subject as SubjectSchema } from 'models';
import QuestionSetType, { QuestionSet } from 'gql/types/question-set';

export const questionSet = {
  type: QuestionSetType,
  args: {
    subjectId: { type: GraphQLString },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { subjectId: string }
  ): Promise<QuestionSet> => {
    if (!args.subjectId) {
      throw new Error('missing required param subjectId');
    }
    const subject = await SubjectSchema.findOne({ _id: args.subjectId });
    if (!subject) {
      throw new Error(`could not find subject with id ${args.subjectId}`);
    }
    return {
      subject: subject,
      questions: subject.questions,
    };
  },
};

export default questionSet;
