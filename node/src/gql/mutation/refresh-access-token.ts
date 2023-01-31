/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLString, GraphQLObjectType, GraphQLBoolean } from 'graphql';
import { User } from 'models/User';
import { User as UserSchema } from '../../models';
import { generateAccessToken } from '../types/user-access-token';

export interface RefreshAccessTokenData {
  accessToken: string;
  authenticated: boolean;
  errorMessage: string;
}

export const RefreshAccessTokenDataType = new GraphQLObjectType({
  name: 'RefreshAccessTokenData',
  fields: {
    accessToken: { type: GraphQLString },
    authenticated: { type: GraphQLBoolean },
    errorMessage: { type: GraphQLString },
  },
});

export const refreshAccessToken = {
  type: RefreshAccessTokenDataType,
  resolve: async (
    _root: GraphQLObjectType,
    _: unknown, //empty args param
    context: { user: User }
  ): Promise<RefreshAccessTokenData> => {
    try {
      if (!context.user) {
        return {
          accessToken: '',
          authenticated: false,
          errorMessage: 'No user in context',
        };
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
        return {
          accessToken: '',
          authenticated: false,
          errorMessage: 'No user found',
        };
      }
      const token = generateAccessToken(user);
      return {
        accessToken: token.accessToken,
        authenticated: true,
        errorMessage: '',
      };
    } catch (error) {
      return {
        accessToken: '',
        authenticated: false,
        errorMessage: JSON.stringify(error),
      };
    }
  },
};

export default refreshAccessToken;
