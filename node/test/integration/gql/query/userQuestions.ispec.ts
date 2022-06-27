/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose from 'mongoose';
import { expect } from 'chai';
import request from 'supertest';

const API_URL = process.env.API_URL || 'localhost:3001/graphql';

describe('userQuestions', () => {
  it(`throws an error if invalid id`, async () => {
    const response = await request(API_URL)
      .post('/graphql')
      .send({
        query: `query {
          userQuestion(id: "111111111111111111111111") {
            _id
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'userQuestion not found for args "{"id":"111111111111111111111111"}"'
    );
  });

  it('gets a list of userQuestions', async () => {
    const response = await request(API_URL)
      .post('/graphql')
      .send({
        query: `query {
        userQuestions {
          edges {
            node {
              _id
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.userQuestions.edges.length).to.be.greaterThan(10);
    expect(response.body.data.userQuestions.edges[0].node._id.length).to.equal(
      24
    );
    response.body.data.userQuestions.edges.forEach((edge: any) => {
      expect(edge.node._id.length).to.equal(24);
    });

    const question = await request(API_URL)
      .post('/graphql')
      .send({
        query: `query {
          userQuestion(id: "${response.body.data.userQuestions.edges[0].node._id}") {
            _id
            question
          }
      }`,
      });
    expect(question.status).to.equal(200);
    expect(question.body.data.userQuestion.question.length).to.be.greaterThan(
      2
    );
  });

  it('filters userQuestions by feedback type', async () => {
    const response = await request(API_URL)
      .post('/graphql')
      .send({
        query: `query {
        userQuestions(filter: { feedback: "NEUTRAL" }) {
          edges {
            node {
              _id
              feedback
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.userQuestions.edges.length).to.be.greaterThan(10);
    response.body.data.userQuestions.edges.forEach((edge: any) => {
      expect(edge.node.feedback).to.equal('NEUTRAL');
    });
  });

  it('filters userQuestions by mentor', async () => {
    const response = await request(API_URL)
      .post('/graphql')
      .send({
        query: `query {
        userQuestions(filter: { mentor: "${mongoose.Types.ObjectId(
          '6109d2a86e6fa01e5bf3219f'
        )}" }) {
          edges {
            node {
              _id
              mentor {
                _id
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.userQuestions.edges.length).to.be.greaterThan(1);
    expect(response.body.data.userQuestions.edges[0].node.mentor._id).to.eql(
      '6109d2a86e6fa01e5bf3219f'
    );
  });
});
