/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { APIGatewayProxyEvent } from 'aws-lambda';
import { ReqCookies, CookieHandler } from './cookie-handler';

export class AWSCookieHandler extends CookieHandler<APIGatewayProxyEvent> {
  extractReqCookies(req: APIGatewayProxyEvent): ReqCookies {
    const headers = req.headers;
    if (
      headers === null ||
      headers === undefined ||
      headers.Cookie === undefined
    ) {
      return {};
    }
    const list: Record<string, string> = {};
    const rc = headers.Cookie;
    rc &&
      rc.split(';').forEach(function (cookie) {
        const parts = cookie.split('=');
        const key = parts.shift().trim();
        const value = decodeURI(parts.join('='));
        if (key != '') {
          list[key] = value;
        }
      });

    return list;
  }
}
