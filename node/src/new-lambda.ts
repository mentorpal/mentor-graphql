/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { APIGatewayProxyEvent } from 'aws-lambda';
import * as Sentry from '@sentry/serverless';
import schema from './gql/schema';
import { graphql } from 'graphql';
import passport from 'passport';
import { Strategy as BearerStrategy } from 'passport-http-bearer';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { User as UserSchema } from './models';
import requireEnv from './utils/require-env';
import { User } from './models/User';
import middleware from './new-middleware';
import { Organization } from './models/Organization';
import { AWSCookieHandler } from './utils/cookie-handler/aws-cookie-handler';

function setupPassport() {
  passport.use(
    new BearerStrategy(function (token, done) {
      const API_SECRET = requireEnv('API_SECRET');
      if (token !== API_SECRET) {
        return done('invalid api key');
      } else {
        return done(null, {});
      }
    })
  );

  passport.use(
    new JwtStrategy(
      {
        secretOrKey: requireEnv('JWT_SECRET'),
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      },
      async (token, done) => {
        try {
          if (token.expirationDate < new Date()) {
            return done('token expired', null);
          } else {
            const user = await UserSchema.findById(token.id);
            if (user) {
              return done(null, user);
            } else {
              return done('token invalid', null);
            }
          }
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

async function appStart(): Promise<void> {
  const mongooseConnect = (await import('./utils/mongoose-connect')).default;
  await mongooseConnect(process.env.MONGO_URI);
}

/**
 * Sets up env vars and makes mongoose connection
 */
async function configureApp() {
  setupPassport();
  const configureEnv = (await import('./utils/configure-env')).default;
  configureEnv();
  if (process.env.APP_DISABLE_AUTO_START !== 'true') {
    await appStart();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extensions = ({ context }: any) => {
  return {
    newToken: context?.newToken ? context.newToken : '',
  };
};

async function execute(
  user: User,
  org: Organization,
  refreshToken: string,
  newToken: string,
  query: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  variables: any,
  cookieHandler: AWSCookieHandler
) {
  // // make request to mongoose schema
  const result = await graphql({
    schema,
    source: query,
    variableValues: variables,
    contextValue: {
      user: user || null,
      org: org || null,
      newToken: newToken || '',
      refreshToken: refreshToken || '',
      cookieHandler: cookieHandler,
    },
  });

  return result;
}
const handler = async (event: APIGatewayProxyEvent) => {
  const body = event.body ? JSON.parse(event.body) : {};
  const query = body.query;
  const variables = body.variables;
  const cookieHandler = new AWSCookieHandler(event);
  const requestCookies = cookieHandler.getReqCookies();
  const headers = event.headers;
  if (!query) {
    throw new Error('Query is required');
  }

  await configureApp();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authResult: any = await middleware(
    headers,
    requestCookies,
    async (user, org, newToken) => {
      return await execute(
        user,
        org,
        requestCookies[process.env.REFRESH_TOKEN_NAME] || '',
        newToken,
        query,
        variables,
        cookieHandler
      );
    }
  );
  const cookiesHeader = cookieHandler.getResCookieHeader();
  return {
    statusCode: 200,
    headers: {
      ...(cookiesHeader ? { 'Set-Cookie': cookiesHeader } : {}),
    },
    body: JSON.stringify({
      ...authResult,
      extensions: extensions(authResult.extensions || {}),
    }),
  };
};

module.exports.handler =
  process.env.IS_SENTRY_ENABLED === 'true'
    ? Sentry.AWSLambda.wrapHandler(handler, {
        captureTimeoutWarning: true,
      })
    : handler;
