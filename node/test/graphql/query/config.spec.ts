/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import createApp, { appStart, appStop } from 'app';
import { expect } from 'chai';
import { Express } from 'express';
import { describe } from 'mocha';
import mongoUnit from 'mongo-unit';
import request from 'supertest';

describe('config', () => {
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

  it.only(`serves default config when no settings`, async () => {
    const response = await request(app).post('/graphql').send({
      query: `query {
          config {
            cmi5Enabled
            cmi5Endpoint
            cmi5Fetch
            mentorsDefault
            urlClassifier
            urlGraphql
            urlVideo
            styleHeaderLogo
          }
        }`,
    });
    expect(response.status).to.equal(200);
    expect(response.body).to.eql({
      data: {
        config: {
          cmi5Enabled: false,
          cmi5Endpoint: '',
          cmi5Fetch: '',
          mentorsDefault: [],
          urlClassifier: '/classifier',
          urlGraphql: '/graphql',
          urlVideo: '/video',
          styleHeaderLogo: '',
        },
      },
    });
  });
});
