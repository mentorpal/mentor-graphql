/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose from 'mongoose';
import createApp, { appStart, appStop } from 'app';
import { expect } from 'chai';
import { Express } from 'express';
import mongoUnit from 'mongo-unit';
import request from 'supertest';

describe('userQuestions', () => {
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

  it('gets a list of userQuestions', async () => {
    const response = await request(app)
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
    expect(response.body.data.userQuestions).to.eql({
      edges: [
        {
          node: {
            _id: '5ffdf41a1ee2c62320b49ee3',
          },
        },
        {
          node: {
            _id: '5ffdf41a1ee2c62320b49ee2',
          },
        },
        {
          node: {
            _id: '5ffdf41a1ee2c62320b49ee1',
          },
        },
        {
          node: {
            _id: '5ffdf41a1ee2c62320b49e33',
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
    });
  });

  it('filters userQuestions by feedback type', async () => {
    const response = await request(app)
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
    expect(response.body.data.userQuestions).to.eql({
      edges: [
        {
          node: {
            _id: '5ffdf41a1ee2c62320b49ee3',
            feedback: 'NEUTRAL',
          },
        },
        {
          node: {
            _id: '5ffdf41a1ee2c62320b49ee1',
            feedback: 'NEUTRAL',
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
    });
  });

  it('filters userQuestions by mentor', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        userQuestions(filter: { mentor: "${mongoose.Types.ObjectId(
          '5ffdf41a1ee2c62111111111'
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
    expect(response.body.data.userQuestions).to.eql({
      edges: [
        {
          node: {
            _id: '5ffdf41a1ee2c62320b49ee3',
            mentor: {
              _id: '5ffdf41a1ee2c62111111111',
            },
          },
        },
        {
          node: {
            _id: '5ffdf41a1ee2c62320b49ee1',
            mentor: {
              _id: '5ffdf41a1ee2c62111111111',
            },
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
    });
  });

  it('can filter userQuestions using operators', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `
        query UserQuestions($filter: Object!, $limit: Int!, $cursor: String!, $sortBy: String!, $sortAscending: Boolean!){
          userQuestions(filter: $filter, limit: $limit,cursor: $cursor,sortBy: $sortBy,sortAscending: $sortAscending){
             edges {
                    cursor
                    node {
                      classifierAnswer {
                        _id
                        transcript
                        question {
                          _id
                          question
                        }
                      }
                      graderAnswer {
                        _id
                        transcript
                        question {
                          _id
                          question
                        }
                      }
                    }
                  }
                  pageInfo {
                    startCursor
                    endCursor
                    hasPreviousPage
                    hasNextPage
                  }
          }
        }
      `,
        variables: {
          filter: {
            classifierAnswer: {
              $nin: ['511111111111111111111174'],
            },
          },
          limit: 20,
          cursor: '',
          sortBy: 'createdAt',
          sortAscending: false,
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.userQuestions.edges).to.eql([
      {
        cursor: 'W251bGwsIjVmZmRmNDFhMWVlMmM2MjMyMGI0OWVlMiJd',
        node: { classifierAnswer: null, graderAnswer: null },
      },
      {
        cursor: 'W251bGwsIjVmZmRmNDFhMWVlMmM2MjMyMGI0OWVlMSJd',
        node: {
          classifierAnswer: {
            _id: '511111111111111111111112',
            transcript: '[being still]',
            question: {
              _id: '511111111111111111111111',
              question: "Don't talk and stay still.",
            },
          },
          graderAnswer: null,
        },
      },
      {
        cursor: 'W251bGwsIjVmZmRmNDFhMWVlMmM2MjMyMGI0OWUzMyJd',
        node: {
          classifierAnswer: null,
          graderAnswer: null,
        },
      },
    ]);
  });
});
