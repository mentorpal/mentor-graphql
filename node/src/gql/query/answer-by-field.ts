/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
} from 'graphql';
import { Answer as AnswerModel, Mentor as MentorModel } from '../../models';
import { Answer } from '../../models/Answer';
import { Organization } from '../../models/Organization';
import { User } from '../../models/User';
import { canViewMentor } from '../../utils/check-permissions';
import AnswerType from '../types/answer';

export const answerByFieldValue = {
  type: AnswerType,
  args: {
    mentor: { type: GraphQLNonNull(GraphQLID) },
    fieldKey: { type: GraphQLNonNull(GraphQLString) }, // can be a nested value like "question._id"
    fieldValue: { type: GraphQLNonNull(GraphQLString) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { mentor: string; fieldKey: string; fieldValue: string },
    context: { user: User; org: Organization }
  ): Promise<Answer> => {
    const mentor = await MentorModel.findById(args.mentor);
    if (!(await canViewMentor(mentor, context.user, context.org))) {
      throw new Error(
        `mentor is private and you do not have permission to access`
      );
    }
    return await AnswerModel.findOne({
      mentor: args.mentor,
      [args.fieldKey]: args.fieldValue,
    });
  },
};

export default answerByFieldValue;
