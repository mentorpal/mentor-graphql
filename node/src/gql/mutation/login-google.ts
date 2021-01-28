/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import axios from 'axios';
import { GraphQLString, GraphQLObjectType } from 'graphql';
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

export const loginGoogle = {
  type: UserAccessTokenType,
  args: {
    accessToken: { type: GraphQLString },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { accessToken: string }
  ): Promise<UserAccessToken> => {
    if (!args.accessToken) {
      throw new Error('missing required param accessToken');
    }
    try {
      const googleEndpoint = `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${args.accessToken}`;
      const googleResponse = await axios.get(googleEndpoint);
      const user = await UserSchema.findOneAndUpdate(
        {
          googleId: googleResponse.data.id,
        },
        {
          $set: {
            googleId: googleResponse.data.id,
            name: googleResponse.data.name,
            email: googleResponse.data.email,
            lastLoginAt: new Date(),
          },
        },
        {
          new: true,
          upsert: true,
        }
      );
      // Create a new mentor if creating a new user account
      const mentor = await MentorSchema.findOne({ user: user._id });
      if (!mentor) {
        // TODO: default subjects should *not* be hard-coded!
        const bgSubject = await SubjectSchema.findOne({ name: 'Background' });
        const utterances = await SubjectSchema.findOne({
          name: 'Repeat After Me',
        });
        await MentorSchema.findOneAndUpdate(
          {
            user: user._id,
          },
          {
            $set: {
              user: user._id,
              name: googleResponse.data.name,
              firstName: googleResponse.data.given_name,
              subjects: [bgSubject._id, utterances._id],
              questions: [...bgSubject.questions, ...utterances.questions],
            },
          },
          {
            new: true,
            upsert: true,
          }
        );
      }
      return generateAccessToken(user);
    } catch (error) {
      throw new Error(error);
    }
  },
};

export default loginGoogle;
