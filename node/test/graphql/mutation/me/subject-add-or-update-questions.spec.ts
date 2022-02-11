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
import { getToken } from '../../../helpers';

describe('subjectAddOrUpdateQuestions', () => {
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

  it(`throws an error if not logged in`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `mutation SubjectAddOrUpdateQuestions($subject: ID!, $questions: [SubjectQuestionInputType]!) {
          me {
            subjectAddOrUpdateQuestions(subject: $subject, questions: $questions) {
              question
            }
          }
        }`,
        variables: {
          subject: '5ffdf41a1ee2c62320b49eb2',
          questions: [],
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Only authenticated users'
    );
  });

  it(`throws an error if no subject passed`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation SubjectAddOrUpdateQuestions($questions: [SubjectQuestionInputType]!) {
          me {
            subjectAddOrUpdateQuestions(questions: $questions) {
              question
            }
          }
        }`,
        variables: {
          questions: [],
        },
      });
    expect(response.status).to.equal(400);
  });

  it(`throws an error if no questions passed`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation SubjectAddOrUpdateQuestions($subject: ID!) {
          me {
            subjectAddOrUpdateQuestions(subject: $subject) {
              question
            }
          }
        }`,
        variables: {
          subject: '',
        },
      });
    expect(response.status).to.equal(400);
  });

  it(`throws an error if invalid subject passed`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation SubjectAddOrUpdateQuestions($subject: ID!, $questions: [SubjectQuestionInputType]!) {
          me {
            subjectAddOrUpdateQuestions(subject: $subject, questions: $questions) {
              question
            }
          }
        }`,
        variables: {
          subject: '5ffdf41a1ee2c62320b49eb6',
          questions: [],
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'subject 5ffdf41a1ee2c62320b49eb6 not found'
    );
  });

  it('adds and updates questions', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation SubjectAddOrUpdateQuestions($subject: ID!, $questions: [SubjectQuestionInputType]!) {
          me {
            subjectAddOrUpdateQuestions(subject: $subject, questions: $questions) {
              question
              category
              topics
            }
          }
        }`,
        variables: {
          subject: '5ffdf41a1ee2c62320b49eb2',
          questions: [
            {
              question: {
                _id: '511111111111111111111116',
                question: 'Updated?',
                clientId: '12346',
              },
              category: { id: 'category' },
              topics: [
                {
                  id: '5ffdf41a1ee2c62320b49ec2',
                },
              ],
            },
            {
              question: {
                _id: '511111111111111111111110',
                question: 'New?',
                clientId: '12346',
              },
              category: { id: 'invalid' },
              topics: [
                {
                  id: '5ffdf41a1ee2c62320b49ec2',
                },
                {
                  id: 'invalid',
                },
              ],
            },
          ],
        },
      });
    console.log(response.body);
    expect(response.status).to.equal(200);
    expect(response.body.data.me.subjectAddOrUpdateQuestions).to.eql([
      {
        question: '511111111111111111111116',
        category: 'category',
        topics: ['5ffdf41a1ee2c62320b49ec2'],
      },
      {
        question: '511111111111111111111110',
        category: 'invalid',
        topics: ['5ffdf41a1ee2c62320b49ec2'],
      },
    ]);
  });
});
