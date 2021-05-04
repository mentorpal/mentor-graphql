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

describe('updateAnswer', () => {
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
    const response = await request(app).post('/graphql').send({
      query: `mutation {
        api {
          updateAnswer(mentorId: "5ffdf41a1ee2c62111111111", questionId: "511111111111111111111112", answer: {})
        }
      }`,
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
      .set('Authorization', `bearer asdfdsadf`)
      .send({
        query: `mutation {
          api {
            updateAnswer(mentorId: "5ffdf41a1ee2c62111111111", questionId: "511111111111111111111112" answer: {})
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Only authenticated users'
    );
  });

  it('updates for api key user', async () => {
    const questionId = '511111111111111111111112';
    const date = new Date();
    const answer: string = JSON.stringify({
      transcript:
        "My name is Clint Anderson and I'm a Nuclear Electrician's Mate",
      recordedAt: date,
    }).replace(/"([^"]+)":/g, '$1:');
    const response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: `mutation {
          api {
            updateAnswer(mentorId: "5ffdf41a1ee2c62111111111", questionId: "${questionId}", answer: ${answer})
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.api.updateAnswer).to.eql(true);

    const r2 = await request(app).post('/graphql').send({
      query: `query {
          mentor(id: "5ffdf41a1ee2c62111111111") {
            answers {
              transcript
              recordedAt
              question {
                _id
              }
            }
          }
      }`,
    });
    expect(r2.status).to.equal(200);
    const updatedAnswer = r2.body.data.mentor.answers.find(
      (a: any) => a.question._id === questionId
    );
    expect(updatedAnswer).to.have.property(
      'transcript',
      "My name is Clint Anderson and I'm a Nuclear Electrician's Mate"
    );
    expect(updatedAnswer).to.have.property('recordedAt', date.toLocaleString());
  });
});
