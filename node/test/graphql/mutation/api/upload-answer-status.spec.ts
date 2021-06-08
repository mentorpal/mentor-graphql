/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
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

describe('uploadAnswerStatus', () => {
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
        query: `mutation UploadAnswer($mentorId: ID!, $questionId: ID!, $statusUrl: String!) {
        api {
          uploadAnswerStatus(mentorId: $mentorId, questionId: $questionId, statusUrl: $statusUrl)
        }
      }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          statusUrl: 'http://status',
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
        query: `mutation UploadAnswer($mentorId: ID!, $questionId: ID!, $statusUrl: String!) {
          api {
            uploadAnswerStatus(mentorId: $mentorId, questionId: $questionId, statusUrl: $statusUrl)
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          statusUrl: 'http://status',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Only authenticated users'
    );
  });

  it(`doesn't accept unaccepted fields`, async () => {
    const response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: `mutation UploadAnswer($mentorId: ID!, $questionId: ID!, $statusUrl: String!) {
          api {
            uploadAnswerStatus(mentorId: $mentorId, questionId: $questionId, statusUrl: $statusUrl, hello: "hi")
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          statusUrl: 'http://status',
        },
      });
    expect(response.status).to.equal(400);
  });

  it(`doesn't accept invalid fields`, async () => {
    const response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: `mutation UploadAnswer($mentorId: ID!, $questionId: ID!, $statusUrl: String!) {
          api {
            uploadAnswerStatus(mentorId: $mentorId, questionId: $questionId, statusUrl: $statusUrl)
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          statusUrl: {},
        },
      });
    expect(response.status).to.equal(500);
  });

  it('updates statusUrl', async () => {
    let update = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: `mutation UploadAnswer($mentorId: ID!, $questionId: ID!, $statusUrl: String!) {
          api {
            uploadAnswerStatus(mentorId: $mentorId, questionId: $questionId, statusUrl: $statusUrl)
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          statusUrl: 'http://status',
        },
      });
    expect(update.status).to.equal(200);
    expect(update.body.data.api.uploadAnswerStatus).to.eql(true);
    let answer = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          mentor(id: "5ffdf41a1ee2c62111111111") {
            answers {
              uploadStatusUrl
              question {
                _id
              }
            }
          }
      }`,
      });
    expect(answer.status).to.equal(200);
    let updatedAnswer = answer.body.data.mentor.answers.find(
      (a: any) => a.question._id === '511111111111111111111112'
    );
    expect(updatedAnswer).to.eql({
      uploadStatusUrl: 'http://status',
      question: {
        _id: '511111111111111111111112',
      },
    });

    update = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: `mutation UploadAnswer($mentorId: ID!, $questionId: ID!) {
        api {
          uploadAnswerStatus(mentorId: $mentorId, questionId: $questionId)
        }
      }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
        },
      });
    expect(update.status).to.equal(200);
    expect(update.body.data.api.uploadAnswerStatus).to.eql(true);
    answer = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        mentor(id: "5ffdf41a1ee2c62111111111") {
          answers {
            uploadStatusUrl
            question {
              _id
            }
          }
        }
      }`,
      });
    expect(answer.status).to.equal(200);
    updatedAnswer = answer.body.data.mentor.answers.find(
      (a: any) => a.question._id === '511111111111111111111112'
    );
    expect(updatedAnswer).to.eql({
      uploadStatusUrl: null,
      question: {
        _id: '511111111111111111111112',
      },
    });
  });
});
