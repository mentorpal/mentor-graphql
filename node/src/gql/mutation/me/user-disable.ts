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
import { Types } from 'mongoose';
import { User as UserModel, Mentor as MentorModel } from '../../../models';
import { User, UserRole } from '../../../models/User';
import UserType from '../../types/user';

export const updateUserDisable = {
  type: UserType,
  args: {
    userId: { type: new GraphQLNonNull(GraphQLID) },
    isDisabled: { type: GraphQLBoolean },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      userId: string;
      isDisabled: boolean;
    },
    context: { user: User }
  ): Promise<User> => {
    if (context.user?.isDisabled) {
      throw new Error('Your account has been disabled');
    }
    const user = await UserModel.findById(args.userId);
    if (!user) {
      throw new Error('invalid user id given');
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
          isDisabled: args.isDisabled,
        },
      },
      {
        new: true,
      }
    );
    if (args.isDisabled) {
      await MentorModel.findOneAndUpdate(
        { user: new Types.ObjectId(`${args.userId}`) },
        {
          $set: {
            isArchived: true,
          },
        }
      );
    }
    return updated;
  },
};

export default updateUserDisable;
