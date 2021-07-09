/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLString, GraphQLObjectType, GraphQLNonNull } from 'graphql';
import {
  User as UserSchema,
  Mentor as MentorSchema,
  Subject as SubjectSchema,
} from 'models';
import {
  UserAccessTokenType,
  UserAccessToken,
  generateAccessToken,
} from 'gql/types/user-access-token';

export const login = {
  type: UserAccessTokenType,
  args: {
    accessToken: { type: GraphQLNonNull(GraphQLString) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { accessToken: string },
    context: any // eslint-disable-line  @typescript-eslint/no-explicit-any
  ): Promise<UserAccessToken> => {
    try {
      if (!context.user) {
        throw new Error('invalid user');
      }
      const userId = context.user._id;
      const user = await UserSchema.findByIdAndUpdate(
        userId,
        {
          lastLoginAt: new Date(),
        },
        {
          new: true,
          upsert: false,
        }
      );
      if (!user) {
        throw new Error('invalid token');
      }

      // add any missing required subjects to mentor
      const requiredSubjects = await SubjectSchema.find({ isRequired: true });
      await MentorSchema.findOneAndUpdate(
        {
          user: user._id,
        },
        {
          $addToSet: {
            subjects: { $each: requiredSubjects.map((s) => s._id) },
          },
        }
      );

      return generateAccessToken(user);
    } catch (error) {
      throw new Error(error);
    }
  },
};

export default login;
