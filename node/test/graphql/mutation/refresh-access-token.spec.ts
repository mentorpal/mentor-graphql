/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import createApp, { appStart, appStop } from 'app';
import { expect } from 'chai';
import { Express } from 'express';
import mongoUnit from 'mongo-unit';
import request from 'supertest';
import { getToken, mockSetCookie, mockGetCookie } from '../../helpers';

describe('refresh access token', () => {
  let app: Express;

  beforeEach(async () => {
    await mongoUnit.load(require('test/fixtures/mongodb/data-default.js'));
    app = await createApp();
    await appStart();
  });

  afterEach(async () => {
    await appStop();
    await mongoUnit.drop();
  });

  it(`user does not get authenticated without refresh token`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `
        mutation {
          refreshAccessToken {
            accessToken
            errorMessage
            authenticated
          }
        }
        `,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.refreshAccessToken.authenticated).to.eql(false);
  });

  it(`get new access token via refresh token`, async () => {
    const date = new Date(Date.now() - 1000);
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      // .set('Authorization', `bearer ${token}`)
      .set('Cookie', [
        'mockRefreshToken=6c3c54a0eab05e133b2425137a11111ce0b5f0053e62140bf7086477d1111191cd2fc2679724b111',
      ])
      .send({
        query: `
        mutation {
          refreshAccessToken {
            accessToken
            errorMessage
            authenticated
            userRole
            mentorIds
          }
        }
        `,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.refreshAccessToken.authenticated).to.eql(true);
    expect(response.body.data.refreshAccessToken.userRole).to.eql(
      'SUPER_ADMIN'
    );
    expect(response.body.data.refreshAccessToken.mentorIds).to.eql([]);
  });
});
