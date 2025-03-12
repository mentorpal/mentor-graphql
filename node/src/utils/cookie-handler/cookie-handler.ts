/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { AWSCookieHandler } from './aws-cookie-handler';

export type CookieHandlers = AWSCookieHandler;

export type ReqCookies = Record<string, string>;

export interface ResCookie {
  name: string;
  value: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: Record<string, any>;
}

export abstract class CookieHandler<RequestType> {
  private resCookies: ResCookie[];
  private reqCookies: ReqCookies;

  constructor(req: RequestType) {
    this.reqCookies = this.extractReqCookies(req);
    this.resCookies = [];
  }

  getResCookies(): ResCookie[] {
    return this.resCookies;
  }

  addResCookie(cookie: ResCookie): void {
    this.resCookies.push(cookie);
  }

  getReqCookies(): ReqCookies {
    return this.reqCookies;
  }

  abstract extractReqCookies(req: RequestType): ReqCookies;

  getResCookieHeader(): string {
    if (this.resCookies.length === 0) {
      return '';
    }
    return this.resCookies
      .map(
        (cookie) =>
          `${cookie.name}=${cookie.value}; ${
            cookie.options
              ? Object.entries(cookie.options)
                  .map(([key, value]) => `${key}=${value}`)
                  .join('; ')
              : ''
          }`
      )
      .join('; ');
  }
}
