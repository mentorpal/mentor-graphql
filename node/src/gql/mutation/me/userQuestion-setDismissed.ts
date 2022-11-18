/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
} from 'graphql';
import { UserQuestion as UserQuestionModel } from '../../../models';
import { Mentor as MentorModel } from '../../../models';
import { UserQuestion } from '../../../models/UserQuestion';
import { UserQuestionType } from '../../types/user-question';
import { User } from '../../../models/User';
import { canEditMentor } from '../../../utils/check-permissions';

export const userQuestionSetDismissed = {
  type: UserQuestionType,
  args: {
    id: { type: GraphQLNonNull(GraphQLID) },
    dismissed: { type: GraphQLNonNull(GraphQLBoolean) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { id: string; dismissed: boolean },
    context: { user: User }
  ): Promise<UserQuestion> => {
    const targetUserQuestion = await UserQuestionModel.findById(args.id);
    if (!targetUserQuestion) {
      throw new Error('No user question found');
    }
    const mentor = await MentorModel.findById(targetUserQuestion.mentor);
    if (!canEditMentor(mentor, context.user)) {
      throw new Error('you do not have permission to edit this mentor');
    }
    const update = await UserQuestionModel.findByIdAndUpdate(
      args.id,
      {
        dismissed: args.dismissed,
      },
      {
        new: true,
      }
    );
    if (!update) {
      throw new Error('invalid id');
    }
    return update;
  },
};

export default userQuestionSetDismissed;
