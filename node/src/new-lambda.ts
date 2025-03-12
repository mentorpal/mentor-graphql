/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { APIGatewayProxyEvent } from 'aws-lambda';
import * as Sentry from '@sentry/serverless';
import schema from './gql/schema';
import { graphql } from 'graphql';
import middleware from './new-middleware';
import { AWSCookieHandler } from './utils/cookie-handler/aws-cookie-handler';

async function appStart(): Promise<void> {
  const mongooseConnect = (await import('./utils/mongoose-connect')).default;
  await mongooseConnect(process.env.MONGO_URI);
}

/**
 * Sets up env vars and makes mongoose connection
 */
async function configureApp() {
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

const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : [
      'https://devmentorpal.org',
      'https://qamentorpal.org',
      'https://mentorpal.org',
      'https://newdev.mentorpal.org',
      'https://v2.mentorpal.org',
      'https://careerfair.mentorpal.org',
      'http://local.mentorpal.org:8000',
      'http://localhost:8000',
    ];

const corsHeaders = (origin: string) => {
  const allowedOrigin = CORS_ORIGIN.find((o) => origin.endsWith(o));
  if (allowedOrigin) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
    };
  }
  throw new Error(`${origin} not allowed by CORS`);
};

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
  const result: any = await middleware(
    headers,
    requestCookies,
    async (user, org, newToken) => {
      return await graphql({
        schema,
        source: query,
        variableValues: variables,
        contextValue: {
          user: user || null,
          org: org || null,
          newToken: newToken || '',
          refreshToken: requestCookies[process.env.REFRESH_TOKEN_NAME] || '',
          cookieHandler: cookieHandler,
        },
      });
    }
  );
  const cookiesHeader = cookieHandler.getResCookieHeader();
  return {
    statusCode: 200,
    headers: {
      ...(cookiesHeader ? { 'Set-Cookie': cookiesHeader } : {}),
      ...corsHeaders(headers.origin),
    },
    body: JSON.stringify({
      ...result,
      extensions: extensions(result.extensions || {}),
    }),
  };
};

module.exports.handler =
  process.env.IS_SENTRY_ENABLED === 'true'
    ? Sentry.AWSLambda.wrapHandler(handler, {
        captureTimeoutWarning: true,
      })
    : handler;
