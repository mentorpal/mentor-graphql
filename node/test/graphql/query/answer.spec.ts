/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/

import createApp, { appStart, appStop } from 'app';
import { expect } from 'chai';
import { Express } from 'express';
import { describe } from 'mocha';
import mongoUnit from 'mongo-unit';
import request from 'supertest';

describe('answer', () => {
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

  it(`throws an error if invalid mentor id`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query Answer($mentor: ID!, $question: ID!) {
          answer(mentor: $mentor, question: $question) {
            _id
          }
        }`,
        variables: {
          mentor: 'asdf',
          question: '511111111111111111111111',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property('errors[0].message');
  });

  it(`throws an error if invalid question id`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query Answer($mentor: ID!, $question: ID!) {
          answer(mentor: $mentor, question: $question) {
            _id
          }
        }`,
        variables: {
          mentor: '5ffdf41a1ee2c62111111111',
          question: 'asdf',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property('errors[0].message');
  });

  it(`gets answer`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query Answer($mentor: ID!, $question: ID!) {
          answer(mentor: $mentor, question: $question) {
            _id
          }
        }`,
        variables: {
          mentor: '5ffdf41a1ee2c62111111111',
          question: '511111111111111111111111',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.answer).to.eql({
      _id: '511111111111111111111112',
    });
  });

  it(`gets markdown version and regular version of transcript`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query Answer($mentor: ID!, $question: ID!) {
          answer(mentor: $mentor, question: $question) {
            _id
            transcript
            markdownTranscript
          }
        }`,
        variables: {
          mentor: '5ffdf41a1ee2c62111111122',
          question: '511111111111111111111112',
        },
      });
    expect(response.status).to.equal(200);
    console.log(JSON.stringify(response.body));
  });
});
