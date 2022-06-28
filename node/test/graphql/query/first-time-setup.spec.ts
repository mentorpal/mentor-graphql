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
import { getToken } from '../../helpers';

describe('First Time Setup', () => {
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

  it(`can query firstTimeTracking through user`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `
        query Users($filter: Object!){
          users (filter: $filter){
            edges {
              node {
                firstTimeTracking{
                  myMentorSplash,
                  tooltips,
                }
              }
            }
          }
        }`,
        variables: {
          filter: { _id: '5ffdf41a1ee2c62320b49ea1' },
        },
      });
    expect(response.body.data.users.edges[0].node).to.eql({
      firstTimeTracking: { myMentorSplash: false, tooltips: true },
    });
  });

  it(`can update myMentorSplash`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `
        mutation FirstTimeTrackingUpdate($updates: FirstTimeTrackingUpdateInputType!) {
          me{
            firstTimeTrackingUpdate(updates: $updates){
              myMentorSplash,
              tooltips
            }
          }
        }
      `,
        variables: {
          updates: {
            myMentorSplash: true,
            tooltips: true,
          },
        },
      });
    expect(response.body.data.me.firstTimeTrackingUpdate).to.eql({
      myMentorSplash: true,
      tooltips: true,
    });
  });
});
