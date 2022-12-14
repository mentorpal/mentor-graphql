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

describe('userQuestionCreate', () => {
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

  it(`returns an error if no userQuestion`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `mutation {
        userQuestionCreate {
          _id
        }
      }`,
      });
    expect(response.status).to.equal(400);
  });

  it(`returns an error if no question`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `mutation {
        userQuestionCreate(userQuestion: {
          mentor: "5ffdf41a1ee2c62111111111",
          classifierAnswer: "511111111111111111111112",
          confidence: 1,
        }) {
          _id
        }
      }`,
      });
    expect(response.status).to.equal(400);
  });

  it(`returns an error if no mentor`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `mutation {
        userQuestionCreate(userQuestion: {
          question: "new",
          classifierAnswer: "511111111111111111111112",
          confidence: 1,
        }) {
          _id
        }
      }`,
      });
    expect(response.status).to.equal(400);
  });

  it(`returns an error if no classifierAnswer`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `mutation {
        userQuestionCreate(userQuestion: {
          question: "new",
          mentor: "5ffdf41a1ee2c62111111111",
          confidence: 1,
        }) {
          _id
        }
      }`,
      });
    expect(response.status).to.equal(400);
  });

  it(`returns an error if no confidence`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `mutation {
        userQuestionCreate(userQuestion: {
          question: "new",
          mentor: "5ffdf41a1ee2c62111111111",
          classifierAnswer: "511111111111111111111112",
        }) {
          _id
        }
      }`,
      });
    expect(response.status).to.equal(400);
  });

  it(`creates userQuestion`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `mutation {
          userQuestionCreate(userQuestion: {
            question: "new",
            mentor: "5ffdf41a1ee2c62111111111",
            classifierAnswer: "511111111111111111111112",
            confidence: 1,      
            chatSessionId: "1234"
          }) {
            question
            mentor {
              _id
            }
            classifierAnswer {
              _id
            }
            classifierAnswerType
            confidence
            dismissed
            chatSessionId
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.userQuestionCreate).to.eql({
      question: 'new',
      mentor: {
        _id: '5ffdf41a1ee2c62111111111',
      },
      classifierAnswer: {
        _id: '511111111111111111111112',
      },
      classifierAnswerType: 'CLASSIFIER',
      confidence: 1,
      dismissed: false,
      chatSessionId: '1234',
    });
  });
});
