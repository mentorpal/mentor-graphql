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

describe('Remove questions from record queue', () => {
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

  it('removes question from record queue', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    // First confirm question ids are in queue
    const response1 = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
            me {
              fetchMentorRecordQueue
            }
          }`,
      });
    expect(response1.body.data.me.fetchMentorRecordQueue).to.eql([
      '511111111111111111111112',
      '511111111111111111111111',
    ]);
    // Then remove and confirm that the specified one was removed
    const response2 = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation RemoveQuestionFromRecordQueue($questionId: ID!) {
          me {
            removeQuestionFromRecordQueue(questionId: $questionId)
          }
        }`,
        variables: {
          questionId: '511111111111111111111112',
        },
      });
    expect(response2.body.data.me.removeQuestionFromRecordQueue).to.not.contain(
      '511111111111111111111112'
    );
  });
});
