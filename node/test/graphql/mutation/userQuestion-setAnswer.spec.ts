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

describe('userQuestionSetAnswer', () => {
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

  it(`returns an error if no id`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `mutation {
        userQuestionSetAnswer(answer: "511111111111111111111112") {
          _id
        }
      }`,
      });
    expect(response.status).to.equal(400);
  });

  it(`returns an error if invalid id`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `mutation {
        userQuestionSetAnswer(id: "111111111111111111111111", answer: "511111111111111111111112") {
          _id
        }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'invalid id'
    );
  });

  it(`if question and mentorId provided, finds/creates new answer doc`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `mutation {
        userQuestionSetAnswer(id: "5ffdf41a1ee2c62320b49ee3", question: "511111111111111111111114", mentorId: "5ffdf41a1ee2c62111111119") {
          graderAnswer {
            question{
              _id
            }
          }
        }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.userQuestionSetAnswer.graderAnswer).to.eql({
      question: { _id: '511111111111111111111114' },
    });
    const queryAnswer = await request(app)
      .post('/graphql')
      .send({
        query: `query{
          answer(question:"511111111111111111111114", mentor:"5ffdf41a1ee2c62111111119"){
            question{
              _id
              question
            }
          }
        }`,
      });
    expect(queryAnswer.status).to.equal(200);
    expect(queryAnswer.body.data.answer).to.eql({
      question: {
        _id: '511111111111111111111114',
        question: 'Do you like your job?',
      },
    });
  });

  it(`adds graderAnswer to userQuestion`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `mutation {
        userQuestionSetAnswer(id: "5ffdf41a1ee2c62320b49ee1", answer: "511111111111111111111112") {
          graderAnswer {
            _id
          }
        }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.userQuestionSetAnswer).to.eql({
      graderAnswer: {
        _id: '511111111111111111111112',
      },
    });
  });

  it(`if no answer provided, removes graderAnswer from userQuestion`, async () => {
    await request(app)
      .post('/graphql')
      .send({
        query: `mutation {
        userQuestionSetAnswer(id: "5ffdf41a1ee2c62320b49ee1", answer: "511111111111111111111112") {
          graderAnswer {
            _id
          }
        }
      }`,
      });
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `mutation {
        userQuestionSetAnswer(id: "5ffdf41a1ee2c62320b49ee1") {
          graderAnswer {
            _id
          }
        }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.userQuestionSetAnswer).to.eql({
      graderAnswer: null,
    });
  });
});
