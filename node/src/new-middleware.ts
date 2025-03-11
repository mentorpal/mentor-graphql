/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { Organization } from './models/Organization';
import UserModel, { User } from './models/User';
import { logger } from './utils/logging';
import OrganizationModel from './models/Organization';
import { getRefreshedToken } from './gql/types/user-access-token';
import requireEnv from './utils/require-env';
import jwt from 'jsonwebtoken';

function isApiReq(headers: Record<string, string>): boolean {
  return Boolean(headers['mentor-graphql-req']);
}

async function getOrg(
  origin: string,
  next: (user: User, org: Organization, newToken?: string) => void,
  user: User,
  jwtToken = ''
) {
  try {
    if (origin) {
      const subdomain = /:\/\/([^\/]+)/.exec(origin)[1].split('.')[0];
      const org = await OrganizationModel.findOne({ subdomain });
      return next(user, org, jwtToken);
    } else {
      return next(user, null, jwtToken);
    }
  } catch (err) {
    return next(user, null, jwtToken);
  }
}

async function refreshToken(
  origin: string,
  cookies: Record<string, string>,
  next: (user: User, org: Organization, newToken?: string) => void
) {
  try {
    logger.debug('refreshing token');
    const token = cookies[process.env.REFRESH_TOKEN_NAME];
    if (!token) {
      logger.debug('refresh token not found');
      return getOrg(origin, next, null);
    }
    const { jwtToken, user } = await getRefreshedToken(token);
    if (user) {
      return getOrg(origin, next, user, jwtToken);
    } else {
      logger.warn("couldn't get user");
      return getOrg(origin, next, null);
    }
  } catch (err) {
    console.log("couldn't refresh token");
    logger.warn(
      `couldn't refresh token ${cookies[process.env.REFRESH_TOKEN_NAME]}`
    );
    logger.error(err);
    return getOrg(origin, next, null);
  }
}

async function authenticateUser(
  strategy: 'bearer' | 'jwt',
  authHeader: string
) {
  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new Error('no token');
  }
  if (strategy === 'bearer') {
    const API_SECRET = requireEnv('API_SECRET');
    if (token !== API_SECRET) {
      throw new Error('invalid api key');
    } else {
      return null;
    }
  } else if (strategy === 'jwt') {
    const jwtSecret = requireEnv('JWT_SECRET');
    const jwtToken = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
    try {
      if (jwtToken.exp < new Date().getTime() / 1000) {
        throw new Error('token expired');
      } else {
        const user = await UserModel.findById(jwtToken.id);
        if (user) {
          return user;
        } else {
          throw new Error('token invalid');
        }
      }
    } catch (error) {
      throw new Error('invalid token');
    }
  } else {
    throw new Error('invalid strategy');
  }
}

export default async function middleware(
  headers: Record<string, string>,
  cookies: Record<string, string>,
  next: (user: User, org: Organization, newToken?: string) => void
) {
  const origin = headers.origin;
  const authType = isApiReq(headers) ? 'bearer' : 'jwt';
  try {
    const authUser = await authenticateUser(authType, headers.authorization);
    if (authUser) {
      return next(authUser, null, '');
    } else {
      return refreshToken(origin, cookies, next);
    }
  } catch (error) {
    console.log('error from authenticateUser', error);
    return refreshToken(origin, cookies, next);
  }
}
