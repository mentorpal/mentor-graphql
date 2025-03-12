/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import axios from 'axios';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLBoolean,
} from 'graphql';
import {
  User as UserSchema,
  Mentor as MentorSchema,
  Subject as SubjectSchema,
  MentorConfig as MentorConfigModel,
} from '../../models';
import {
  UserAccessTokenType,
  UserAccessToken,
  generateJwtToken,
  setTokenCookie,
  generateRefreshToken,
} from '../types/user-access-token';
import { notifyAdminNewMentors } from '../../utils/email-admin';

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

export enum LoginType {
  SIGN_IN = 'SIGN_IN',
  SIGN_UP = 'SIGN_UP',
}

export const loginGoogle = {
  type: UserAccessTokenType,
  args: {
    accessToken: { type: GraphQLNonNull(GraphQLString) },
    mentorConfig: { type: GraphQLString },
    lockMentorToConfig: { type: GraphQLBoolean },
    loginType: { type: GraphQLString },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      accessToken: string;
      mentorConfig: string;
      lockMentorToConfig: boolean;
      loginType: LoginType;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context: any
  ): Promise<UserAccessToken> => {
    try {
      const signUp = args.loginType === LoginType.SIGN_UP;
      const googleResponse = await authGoogle(args.accessToken);
      let user = await UserSchema.findOneAndUpdate(
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
          upsert: signUp,
        }
      );
      if (!user) {
        throw new Error('No user found for provided google email');
      }
      if (user.isDisabled) {
        throw new Error('Your account has been disabled');
      }
      // Create/Migrate mentor to user model
      if (!user.mentorIds.length) {
        // add any required subjects to mentor
        const requiredSubjects = await SubjectSchema.find({ isRequired: true });

        const mentorConfig = args.mentorConfig
          ? await MentorConfigModel.findOne({ configId: args.mentorConfig })
          : undefined;
        const configUpdates = {
          ...(mentorConfig?.subjects.length
            ? {
                subjects: requiredSubjects
                  .map((s) => s._id)
                  .concat(mentorConfig.subjects),
              }
            : {}),
          ...(mentorConfig?.publiclyVisible ? { isPrivate: false } : {}),
          ...(mentorConfig?.mentorType
            ? { mentorType: mentorConfig.mentorType }
            : {}),
          ...(mentorConfig?.orgPermissions.length
            ? { orgPermissions: mentorConfig.orgPermissions }
            : {}),
          ...(mentorConfig
            ? {
                mentorConfig: mentorConfig._id,
                lockedToConfig: Boolean(args.lockMentorToConfig),
              }
            : {}),
        };
        const newMentor = await MentorSchema.findOneAndUpdate(
          {
            user: user._id,
          },
          {
            $set: {
              name: googleResponse.name,
              firstName: googleResponse.given_name,
              email: googleResponse.email,
              subjects: requiredSubjects.map((s) => s._id),
              ...configUpdates,
            },
          },
          {
            new: true,
            upsert: true,
          }
        );
        const notifyAdmin = process.env.NOTIFY_ADMIN_ON_NEW_MENTOR == 'true';
        if (notifyAdmin) {
          await notifyAdminNewMentors();
        }
        const mentorId = newMentor._id;
        user = await UserSchema.findOneAndUpdate(
          {
            googleId: googleResponse.id,
          },
          {
            $set: {
              mentorIds: [mentorId],
            },
          },
          {
            new: true,
          }
        );
      }
      // authentication successful so generate jwt and refresh tokens
      const jwtToken = await generateJwtToken(user);
      const refreshToken = await generateRefreshToken(user);
      setTokenCookie(context.cookieHandler, refreshToken.token);
      return jwtToken;
    } catch (error) {
      throw new Error(error);
    }
  },
};

export default loginGoogle;
