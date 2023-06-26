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

describe('mentor vtt update', () => {
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

  it(`throws an error if no api key`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `mutation MentorVttUpdate($mentorId: ID!, $questionId: String!, $vttUrl: String!) {
        api {
          mentorVttUpdate(mentorId: $mentorId, questionId: $questionId, vttUrl: $vttUrl)
        }
      }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111111',
          vttUrl: 'https://test-vtt.url',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Only authenticated users'
    );
  });

  it(`throws an error if invalid api key`, async () => {
    const response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer asdfdsadf`)
      .send({
        query: `mutation MentorVttUpdate($mentorId: ID!, $questionId: String!, $vttUrl: String!) {
        api {
          mentorVttUpdate(mentorId: $mentorId, questionId: $questionId, vttUrl: $vttUrl)
        }
      }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111111',
          vttUrl: 'https://test-vtt.url',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Only authenticated users'
    );
  });

  it(`updates the mentor's vtt url without clobbering other media`, async () => {
    const response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: `mutation MentorVttUpdate($mentorId: ID!, $questionId: String!, $vttUrl: String!) {
        api {
          mentorVttUpdate(mentorId: $mentorId, questionId: $questionId, vttUrl: $vttUrl)
        }
      }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111111',
          vttUrl: 'https://test-vtt.url',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'data.api.mentorVttUpdate',
      true
    );

    // TODO: query answer and check media
    const answerResponse = await request(app)
      .post('/graphql')
      .send({
        query: `query Answer($mentor: ID!, $question: ID!) {
          answer(mentor: $mentor, question: $question) {
            _id
            webMedia{
              url
            }
            vttMedia{
              type
              tag
              url
            }
          }
        }`,
        variables: {
          mentor: '5ffdf41a1ee2c62111111111',
          question: '511111111111111111111111',
        },
      });
    expect(answerResponse.status).to.equal(200);
    expect(answerResponse.body.data.answer).to.eql({
      _id: '511111111111111111111112',
      webMedia: {
        url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/web.mp4',
      },
      vttMedia: {
        tag: 'en',
        type: 'subtitles',
        url: 'https://test-vtt.url/',
      },
    });
  });
});
