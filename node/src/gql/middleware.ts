/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import passport from 'passport';
import { graphqlHTTP } from 'express-graphql';
import { Request, Response } from 'express';
import schema from './schema';
import { User } from '../models/User';
import { getRefreshedToken } from './types/user-access-token';

const extensions = ({ context }: any) => {
  // eslint-disable-line  @typescript-eslint/no-explicit-any
  return {
    newToken: context.newToken ? context.newToken : '',
  };
};

function isApiReq(req: Request): boolean {
  return Boolean(req.headers['mentor-graphql-req']);
}

async function refreshToken(req: Request, next: any) {
  // eslint-disable-line  @typescript-eslint/no-explicit-any
  try {
    const token = req.cookies.refreshToken;
    const { jwtToken, user } = await getRefreshedToken(token);
    if (user) {
      next(user, jwtToken);
    } else {
      next(null);
    }
  } catch (err) {
    next(null);
  }
}

export default graphqlHTTP((req: Request, res: Response) => {
  return new Promise((resolve) => {
    const next = (user: User, newToken = '') => {
      resolve({
        schema,
        ...(!process.env.NODE_ENV?.includes('prod') && {
          graphiql: { headerEditorEnabled: true },
        }),
        context: {
          user: user || null,
          newToken: newToken || '',
          res: res,
          req: req,
        },
        extensions,
      });
    };
    /**
     * Try to authenticate using passport,
     * but never block the call from here.
     */
    const authType = isApiReq(req) ? 'bearer' : 'jwt';
    passport.authenticate(authType, { session: false }, (err, user) => {
      if (err == 'token expired' || user === false) {
        refreshToken(req, next);
      } else {
        next(user);
      }
    })(req, res, next);
  });
});
