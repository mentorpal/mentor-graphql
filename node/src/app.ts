/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import cookieParser from 'cookie-parser';
import express, { Express } from 'express';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as BearerStrategy } from 'passport-http-bearer';
import mongoose from 'mongoose';
import { logger } from './utils/logging';
import requireEnv from './utils/require-env';
import { User as UserSchema } from './models';

export function setupPassport() {
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

export async function createApp(): Promise<Express> {
  const gqlMiddleware = (await import('./gql/middleware')).default;
  if (!process.env.NODE_ENV?.includes('prod')) {
    require('longjohn'); // full stack traces when testing
  }
  const configureEnv = (await import('./utils/configure-env')).default;
  configureEnv();
  if (process.env.APP_DISABLE_AUTO_START !== 'true') {
    await appStart();
  }
  setupPassport();
  const app = express();

  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  app.use(express.urlencoded({ limit: '2mb', extended: true }));
  app.use('/graphql', gqlMiddleware);
  return app;
}

export async function appStart(): Promise<void> {
  const mongooseConnect = (await import('./utils/mongoose-connect')).default;
  await mongooseConnect(process.env.MONGO_URI);
}

export async function appStop(): Promise<void> {
  try {
    mongoose.connection.removeAllListeners();
    await mongoose.disconnect();
  } catch (err) {
    logger.error('error on mongoose disconnect: ' + err);
  }
}

export default createApp;
