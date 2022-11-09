/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLString, GraphQLObjectType, GraphQLNonNull } from 'graphql';
import UserType from '../../types/user';
import { User as UserSchema } from '../../../models';
import { User, UserRole } from '../../../models/User';

export const updateUserPermissions = {
  type: UserType,
  args: {
    userId: { type: GraphQLNonNull(GraphQLString) },
    permissionLevel: { type: GraphQLNonNull(GraphQLString) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { userId: string; permissionLevel: string },
    context: { user: User }
  ): Promise<User> => {
    if (!Object.values(UserRole).includes(args.permissionLevel)) {
      throw new Error('invalid permissionLevel');
    }
    if (
      context.user.userRole !== UserRole.ADMIN &&
      context.user.userRole !== UserRole.SUPER_ADMIN
    ) {
      throw new Error(
        'must be an admin or super admin to edit user permissions'
      );
    }
    if (
      args.permissionLevel === UserRole.SUPER_ADMIN &&
      context.user.userRole !== UserRole.SUPER_ADMIN
    ) {
      throw new Error('only super admins can give super admin permissions');
    }

    const userToEdit = await UserSchema.findOne({ _id: args.userId });
    if (!userToEdit) {
      throw new Error(`could not find user for id ${args.userId}`);
    }
    if (
      userToEdit.userRole == UserRole.SUPER_ADMIN &&
      context.user.userRole !== UserRole.SUPER_ADMIN
    ) {
      throw new Error('only super admins can edit a super admins permissions');
    }
    return await UserSchema.findOneAndUpdate(
      {
        _id: args.userId,
      },
      {
        $set: {
          userRole: args.permissionLevel,
        },
      },
      {
        new: true,
      }
    );
  },
};

export default updateUserPermissions;
