/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLObjectType } from 'graphql';
import {
  revokeToken,UserAccessTokenType
} from 'gql/types/user-access-token';

export const logout = {
  type: UserAccessTokenType,
  args: {},
  resolve: async (
    _root: GraphQLObjectType,
    context: any // eslint-disable-line  @typescript-eslint/no-explicit-any
  ) : Promise<void> => {
    try {
      const token = context.req.cookies.refreshToken;
      await revokeToken(token);
      const cookieOptions = {
        httpOnly: true,
        expires: new Date(Date.now())
    };
    context.res.cookie('refreshToken', Date.now(), cookieOptions);
    } catch (error) {
      throw new Error(error);
    }
  },
};

export default logout;
