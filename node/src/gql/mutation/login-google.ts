/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import axios from 'axios';
import { GraphQLString, GraphQLObjectType, GraphQLNonNull } from 'graphql';
import { User as UserSchema, Mentor as MentorSchema } from 'models';
import {
  UserAccessTokenType,
  UserAccessToken,
  generateJwtToken,
  setTokenCookie,
  generateRefreshToken,
} from 'gql/types/user-access-token';

export interface GoogleResponse {
  id: string;
  name: string;
  email: string;
  given_name: string;
}

export interface GoogleAuthFunc {
  (accessToken: string): Promise<GoogleResponse>;
}

let _googleAuthFuncOverride: GoogleAuthFunc;

export function overrideGoogleAuthFunc(f: GoogleAuthFunc): void {
  _googleAuthFuncOverride = f;
}

export function restoreGoogleAuthFunc(): void {
  _googleAuthFuncOverride = undefined;
}

export async function authGoogle(accessToken: string): Promise<GoogleResponse> {
  if (_googleAuthFuncOverride) {
    return _googleAuthFuncOverride(accessToken);
  }
  const res = await axios.get<GoogleResponse>(
    `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${accessToken}`
  );
  return res.data;
}

export const loginGoogle = {
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
      const googleResponse = await authGoogle(args.accessToken);
      const user = await UserSchema.findOneAndUpdate(
        {
          googleId: googleResponse.id,
        },
        {
          $set: {
            googleId: googleResponse.id,
            name: googleResponse.name,
            email: googleResponse.email,
            lastLoginAt: new Date(),
          },
        },
        {
          new: true,
          upsert: true,
        }
      );
      if (!user) {
        throw new Error('failed to create user');
      }
      // Create a new mentor if creating a new user account
      await MentorSchema.findOneAndUpdate(
        {
          user: user._id,
        },
        {
          $setOnInsert: {
            user: user._id,
            name: googleResponse.name,
            firstName: googleResponse.given_name,
            email: googleResponse.email,
          },
        },
        {
          upsert: true,
        }
      );
      // authentication successful so generate jwt and refresh tokens
      const jwtToken = await generateJwtToken(user);
      const refreshToken = await generateRefreshToken(user);
      setTokenCookie(context.res, refreshToken.token);
      return jwtToken;
    } catch (error) {
      throw new Error(error);
    }
  },
};

export default loginGoogle;
