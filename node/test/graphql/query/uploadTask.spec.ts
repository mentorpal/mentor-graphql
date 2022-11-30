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
import { getToken } from '../../helpers';

describe('query uploadTask', () => {
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

  it(`throws an error if not an authenticated user`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          uploadTask (mentorId: "5ffdf41a1ee2c62111111111", questionId: "511111111111111111111112") {
            _id
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Only authenticated users'
    );
  });

  it(`throws an error if not authorized to view`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          uploadTask (mentorId: "5ffdf41a1ee2c62111111111", questionId: "511111111111111111111112") {
            _id
          }
        }`,
      });
    console.log(response.body);
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'you are not authorized to view this mentors information'
    );
  });

  it(`provides the upload task for USER who owns the target mentor`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query UploadTask($mentorId: ID!, $questionId: ID!) {
          uploadTask (mentorId: $mentorId, questionId: $questionId) {
            mentor {
              _id
            }
            question {
              _id
              question
            }
            transcript
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111113',
          questionId: '511111111111111111111112',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.uploadTask).to.eql({
      mentor: {
        _id: '5ffdf41a1ee2c62111111113',
      },
      question: {
        _id: '511111111111111111111112',
        question: 'Who are you and what do you do?',
      },
      transcript: 'fake_transcript',
    });
  });

  it(`provides the upload task to authenticated services`, async () => {
    const response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: `query {
          uploadTask (mentorId: "5ffdf41a1ee2c62111111111", questionId: "511111111111111111111112") {
            mentor {
              _id
            }
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.uploadTask).to.eql({
      mentor: {
        _id: '5ffdf41a1ee2c62111111111',
      },
    });
  });
});
