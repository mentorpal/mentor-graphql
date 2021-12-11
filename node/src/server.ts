/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import * as Sentry from '@sentry/node';
import { createApp, appStop } from 'app';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require('debug')('mentor-admin:server');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const http = require('http');
import process from 'process';
import logger from './utils/logging';

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val: string): string | boolean | number {
  const port = parseInt(val, 10);
  if (isNaN(port)) {
    // named pipe
    return val;
  }
  if (port >= 0) {
    // port number
    return port;
  }
  return false;
}

async function serverStart() {
  logger.info('starting server');
  logger.info(`node env: '${process.env.NODE_ENV}'`);
  const app = await createApp();
  const port = normalizePort(process.env.PORT || '3001');
  app.set('port', port);
  const server = http.createServer(app);
  server.on('error', (error: { code: string; syscall: string }) => {
    if (error.syscall !== 'listen') {
      throw error;
    }
    const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        logger.error(bind + ' requires elevated privileges');
        process.exit(1);
      case 'EADDRINUSE':
        logger.error(bind + ' is already in use');
        process.exit(1);
      default:
        throw error;
    }
  });
  server.on('listening', () => {
    const addr = server.address();
    const bind =
      typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    debug('Listening on ' + bind);
  });
  server.listen(port);
  logger.info('node version ' + process.version);

  // see https://nodejs.org/api/process.html#process_warning_using_uncaughtexception_correctly
  process.on('uncaughtException', (err: Error) => {
    logger.error('Uncaught exception!');
    logger.error(err);
    if (process.env.IS_SENTRY_ENABLED === 'true') {
      Sentry.captureException(err);
      Sentry.flush(2000).then((done) => {
        if (done) {
          logger.info('sentry flush successful');
        } else {
          logger.error('sentry flush timed out!');
        }
      });
    }
    appStop();
    setTimeout(() => process.exit(1), 3000);
  });
  process.on('unhandledRejection', (reason: Error, promise: Promise<any>) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    if (process.env.IS_SENTRY_ENABLED === 'true') {
      Sentry.captureException(reason);
    }
  });
}

serverStart();
