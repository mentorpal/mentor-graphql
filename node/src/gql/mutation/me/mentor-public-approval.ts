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
import { Mentor as MentorModel } from '../../../models';
import { User, UserRole } from '../../../models/User';
import { Mentor } from '../../../models/Mentor';
import MentorType from '../../types/mentor';

export const updateMentorPublicApproval = {
  type: MentorType,
  args: {
    mentorId: { type: new GraphQLNonNull(GraphQLID) },
    isPublicApproved: { type: GraphQLBoolean },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      mentorId: string;
      isPublicApproved: boolean;
    },
    context: { user: User }
  ): Promise<Mentor> => {
    if (context.user?.isDisabled) {
      throw new Error('Your account has been disabled');
    }
    if (
      context.user.userRole !== UserRole.ADMIN &&
      context.user.userRole !== UserRole.SUPER_ADMIN
    ) {
      throw new Error('only admins may approve a mentor');
    }
    const updated = await MentorModel.findByIdAndUpdate(
      args.mentorId,
      {
        $set: {
          isPublicApproved: args.isPublicApproved,
        },
      },
      {
        new: true,
      }
    ).catch((e) => {
      throw new Error(`failed to update mentor ${e}`);
    });
    return updated;
  },
};

export default updateMentorPublicApproval;
