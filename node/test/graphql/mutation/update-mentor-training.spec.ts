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
import { MentorDirtyReason } from '../../constants';

describe('updateMentorTraining', () => {
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

  it(`returns an error if no mentor id`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `mutation {
        updateMentorTraining {
          lastTrainedAt
        }
      }`,
      });
    expect(response.status).to.equal(400);
  });

  it(`updates lastTrainedAt and isDirty`, async () => {
    const date = new Date(Date.now() - 1000);
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `mutation {
          updateMentorTraining(id: "5ffdf41a1ee2c62111111111") {
            lastTrainedAt
            isDirty
            dirtyReason
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(
      new Date(response.body.data.updateMentorTraining.lastTrainedAt)
    ).to.be.greaterThan(date);
    expect(
      new Date(response.body.data.updateMentorTraining.lastTrainedAt)
    ).to.be.lessThan(new Date(Date.now() + 1000));
    expect(response.body.data.updateMentorTraining.isDirty).to.equal(false);
    expect(response.body.data.updateMentorTraining.dirtyReason).to.equal(
      MentorDirtyReason.NONE
    );
  });
});
