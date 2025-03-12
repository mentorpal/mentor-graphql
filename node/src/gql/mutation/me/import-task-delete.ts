/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLID,
} from 'graphql';
import {
  Mentor as MentorModel,
  ImportTask as ImportTaskModel,
} from '../../../models';
import { User } from '../../../models/User';
import { canEditMentor } from '../../../utils/check-permissions';

export const importTaskDelete = {
  type: GraphQLBoolean,
  args: {
    mentorId: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      mentorId: string;
    },
    context: { user: User }
  ): Promise<boolean> => {
    if (context.user?.isDisabled) {
      throw new Error('Your account has been disabled');
    }
    const mentor = await MentorModel.findById(args.mentorId);
    if (!mentor) {
      throw new Error('invalid mentor');
    }
    if (!(await canEditMentor(mentor, context.user))) {
      throw new Error('you do not have permission to edit this mentor');
    }
    const taskDelete = await ImportTaskModel.deleteOne({
      mentor: mentor._id,
    });
    return Boolean(taskDelete);
  },
};

export default importTaskDelete;
