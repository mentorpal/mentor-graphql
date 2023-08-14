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
import { User as UserModel } from '../../../models';
import { User, UserRole } from '../../../models/User';
import UserType from '../../types/user';

export const updateUserPublicApproval = {
  type: UserType,
  args: {
    userId: { type: GraphQLNonNull(GraphQLID) },
    isPublicApproved: { type: GraphQLBoolean },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      userId: string;
      isPublicApproved: boolean;
    },
    context: { user: User }
  ): Promise<User> => {
    if (context.user?.isDisabled) {
      throw new Error('Your account has been disabled');
    }
    if (
      context.user.userRole !== UserRole.ADMIN &&
      context.user.userRole !== UserRole.SUPER_ADMIN
    ) {
      throw new Error('only admins may disable a user');
    }
    const updated = await UserModel.findByIdAndUpdate(
      args.userId,
      {
        $set: {
          isPublicApproved: args.isPublicApproved,
        },
      },
      {
        new: true,
      }
    ).catch((e) => {
      throw new Error(`failed to update user ${e}`);
    });
    return updated;
  },
};

export default updateUserPublicApproval;
