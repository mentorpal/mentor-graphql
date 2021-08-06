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

async function expectMentorThumbnail(
  mentor: string,
  thumbnail: string,
  app: Express
): Promise<void> {
  const response = await request(app)
    .post('/graphql')
    .send({
      query: `query MentorThumbnail($id: ID!) {
          mentor(id: $id) {
            _id
            thumbnail
          }
      }`,
      variables: { id: mentor },
    });
  expect(response.status).to.equal(200);
  expect(response.body.data.mentor).to.eql({
    _id: '5ffdf41a1ee2c62111111111',
    thumbnail,
  });
}

describe('uploadAnswer', () => {
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
        query: `mutation MentorThumbnailUpdate($mentorId: ID!, $thumbnail: String!) {
        api {
          mentorThumbnailUpdate(mentorId: $mentorId, thumbnail: $thumbnail)
        }
      }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          thumbnail: 'mentor/thumbnails/updated.png',
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
        query: `mutation MentorThumbnailUpdate($mentorId: ID!, $thumbnail: String!) {
        api {
          mentorThumbnailUpdate(mentorId: $mentorId, thumbnail: $thumbnail)
        }
      }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          thumbnail: 'mentor/thumbnails/updated.png',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Only authenticated users'
    );
  });

  it(`updates the mentor's thumbnail`, async () => {
    const mentor = '5ffdf41a1ee2c62111111111';
    await expectMentorThumbnail(
      mentor,
      'https://static.mentorpal.org/mentor/thumbnails/5ffdf41a1ee2c62111111111-20210621T000000.png',
      app
    );
    const response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: `mutation MentorThumbnailUpdate($mentorId: ID!, $thumbnail: String!) {
        api {
          mentorThumbnailUpdate(mentorId: $mentorId, thumbnail: $thumbnail)
        }
      }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          thumbnail: 'mentor/thumbnails/updated.png',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'data.api.mentorThumbnailUpdate',
      'mentor/thumbnails/updated.png'
    );
    await expectMentorThumbnail(
      mentor,
      'https://static.mentorpal.org/mentor/thumbnails/updated.png',
      app
    );
  });
});
