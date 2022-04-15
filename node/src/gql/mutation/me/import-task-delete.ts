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
import { Mentor as MentorModel, ImportTask as ImportTaskModel } from 'models';
import { Mentor } from 'models/Mentor';
import { User, UserRole } from 'models/User';

export const importTaskDelete = {
  type: GraphQLBoolean,
  args: {
    mentorId: { type: GraphQLNonNull(GraphQLID) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      mentorId: string;
    },
    context: { user: User }
  ): Promise<boolean> => {
    let mentor: Mentor = await MentorModel.findOne({
      user: context.user._id,
    });
    if (!mentor) {
      throw new Error('you do not have a mentor');
    }
    if (args.mentorId && `${mentor._id}` !== `${args.mentorId}`) {
      if (
        context.user.userRole !== UserRole.ADMIN &&
        context.user.userRole !== UserRole.CONTENT_MANAGER
      ) {
        throw new Error('you do not have permission to edit this mentor');
      }
      mentor = await MentorModel.findById(args.mentorId);
    }
    const taskDelete = await ImportTaskModel.deleteOne({
      mentor: mentor._id,
    });
    return Boolean(taskDelete);
  },
};

export default importTaskDelete;
