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

describe('query categoryAnswers', () => {
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

  it(`provides answer and question text`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `
        query CategoryAnswers($mentor: ID!, $category: String!){
          categoryAnswers(mentor: $mentor, category: $category) {
            answerText
            questionText
          }
        }`,
        variables: {
          category: 'category',
          mentor: '5ffdf41a1ee2c62111111111',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.categoryAnswers).to.eql([
      {
        answerText: 'Test Transcript',
        questionText: 'What is Aaron like?',
      },
    ]);
  });

  it(`throws an error if mentor is private and user is not logged in`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `
          query CategoryAnswers($mentor: ID!, $category: String!){
            categoryAnswers(mentor: $mentor, category: $category) {
              answerText
              questionText
            }
          }`,
        variables: {
          category: 'category',
          mentor: '5ffdf41a1ee2c62111111114',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'mentor is private and you do not have permission to access'
    );
  });

  it(`throws an error if mentor is private and user is not owner or super user`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `
          query CategoryAnswers($mentor: ID!, $category: String!){
            categoryAnswers(mentor: $mentor, category: $category) {
              answerText
              questionText
            }
          }`,
        variables: {
          category: 'category',
          mentor: '5ffdf41a1ee2c62111111114',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'mentor is private and you do not have permission to access'
    );
  });

  it(`gets answer for private mentor if content manager`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea4');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `
          query CategoryAnswers($mentor: ID!, $category: String!){
            categoryAnswers(mentor: $mentor, category: $category) {
              answerText
              questionText
            }
          }`,
        variables: {
          category: 'category',
          mentor: '5ffdf41a1ee2c62111111114',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.not.have.deep.nested.property('errors[0].message');
  });

  it(`gets answer for private mentor if admin`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `
          query CategoryAnswers($mentor: ID!, $category: String!){
            categoryAnswers(mentor: $mentor, category: $category) {
              answerText
              questionText
            }
          }`,
        variables: {
          category: 'category',
          mentor: '5ffdf41a1ee2c62111111114',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.not.have.deep.nested.property('errors[0].message');
  });

  it(`gets answer for private mentor if owner`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea6');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `
          query CategoryAnswers($mentor: ID!, $category: String!){
            categoryAnswers(mentor: $mentor, category: $category) {
              answerText
              questionText
            }
          }`,
        variables: {
          category: 'category',
          mentor: '5ffdf41a1ee2c62111111114',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.not.have.deep.nested.property('errors[0].message');
  });
});
