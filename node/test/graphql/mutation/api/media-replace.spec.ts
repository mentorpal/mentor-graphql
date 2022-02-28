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
import { getToken } from 'test/helpers';

describe('mediaReplace', () => {
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

  it(`replaces all media with new media`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const questionId = '511111111111111111111111';
    const mentorId = '5ffdf41a1ee2c62111111111';
    const query = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: `mutation MediaReplace($mentorId: ID!, $questionId: ID!, $media: [AnswerMediaInputType]!){
          api{
              mediaReplace(mentorId: $mentorId, questionId: $questionId, media: $media)
          }
      }`,
        variables: {
          mentorId: mentorId,
          questionId: questionId,
          media: [
            {
              type: 'video',
              tag: 'web',
              url: 'videos/5ffdf41a1ee2c62111111111/511111111111111111111111/NEW_MEDIA.mp4',
            },
          ],
        },
      });
    expect(query.status).to.equal(200);

    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query{
        mentor(id:"5ffdf41a1ee2c62111111111"){
          answers{
            media{
              type
              tag
              url
            }
          }
        }
      }`,
      });
  });
});
