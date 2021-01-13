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

describe('topics', () => {
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

  it('gets a list of topics', async () => {
    const response = await request(app).post('/graphql').send({
      query: `query {
        topics {
          edges {
            node {
              _id
              name
              description
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
    expect(response.body.data.topics).to.eql({
      edges: [
        {
          node: {
            _id: '5ffdf41a1ee2c62320b49ec3',
            name: 'Advice',
            description:
              'These questions will ask you to give advice to someone who is interested in your career',
          },
        },
        {
          node: {
            _id: '5ffdf41a1ee2c62320b49ec2',
            name: 'Background',
            description:
              'These questions will ask general questions about your background, that might be relevant to how people understand your career',
          },
        },
        {
          node: {
            _id: '5ffdf41a1ee2c62320b49ec1',
            name: 'Idle',
            description: '30-second idle clip',
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
    });
  });

  describe('can order list of topics', () => {
    it('by name in ascending order', async () => {
      const response = await request(app).post('/graphql').send({
        query: `query {
          topics(sortBy: "name", sortAscending: true) {
            edges {
              node {
                _id
                name
                description
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
      expect(response.body.data.topics).to.eql({
        edges: [
          {
            node: {
              _id: '5ffdf41a1ee2c62320b49ec3',
              name: 'Advice',
              description:
                'These questions will ask you to give advice to someone who is interested in your career',
            },
          },
          {
            node: {
              _id: '5ffdf41a1ee2c62320b49ec2',
              name: 'Background',
              description:
                'These questions will ask general questions about your background, that might be relevant to how people understand your career',
            },
          },
          {
            node: {
              _id: '5ffdf41a1ee2c62320b49ec1',
              name: 'Idle',
              description: '30-second idle clip',
            },
          },
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
      });
    });

    it('by name in descending order', async () => {
      const response = await request(app).post('/graphql').send({
        query: `query {
          topics(sortBy: "name", sortAscending: false) {
            edges {
              node {
                _id
                name
                description
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
      expect(response.body.data.topics).to.eql({
        edges: [
          {
            node: {
              _id: '5ffdf41a1ee2c62320b49ec1',
              name: 'Idle',
              description: '30-second idle clip',
            },
          },
          {
            node: {
              _id: '5ffdf41a1ee2c62320b49ec2',
              name: 'Background',
              description:
                'These questions will ask general questions about your background, that might be relevant to how people understand your career',
            },
          },
          {
            node: {
              _id: '5ffdf41a1ee2c62320b49ec3',
              name: 'Advice',
              description:
                'These questions will ask you to give advice to someone who is interested in your career',
            },
          },
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
      });
    });
  });

  describe('can paginate list of topics', () => {
    it('gets first 2 topics', async () => {
      const response = await request(app).post('/graphql').send({
        query: `query {
          topics(limit: 2) {
            edges {
              node {
                _id
              }
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }`,
      });
      expect(response.status).to.equal(200);
      expect(response.body.data.topics).to.eql({
        edges: [
          {
            node: {
              _id: '5ffdf41a1ee2c62320b49ec3',
            },
          },
          {
            node: {
              _id: '5ffdf41a1ee2c62320b49ec2',
            },
          },
        ],
        pageInfo: {
          hasPreviousPage: false,
          hasNextPage: true,
          startCursor: null,
          endCursor: 'eyIkb2lkIjoiNWZmZGY0MWExZWUyYzYyMzIwYjQ5ZWMyIn0',
        },
      });
    });

    it('gets next page', async () => {
      const response = await request(app).post('/graphql').send({
        query: `query {
          topics(limit: 2, cursor: "next__eyIkb2lkIjoiNWZmZGY0MWExZWUyYzYyMzIwYjQ5ZWMyIn0") {
            edges {
              node {
                _id
              }
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }`,
      });
      expect(response.status).to.equal(200);
      expect(response.body.data.topics).to.eql({
        edges: [
          {
            node: {
              _id: '5ffdf41a1ee2c62320b49ec1',
            },
          },
        ],
        pageInfo: {
          hasPreviousPage: true,
          hasNextPage: false,
          startCursor: 'eyIkb2lkIjoiNWZmZGY0MWExZWUyYzYyMzIwYjQ5ZWMxIn0',
          endCursor: null,
        },
      });
    });

    it('gets first 2 topics', async () => {
      const response = await request(app).post('/graphql').send({
        query: `query {
          topics(limit: 2, cursor: "prev__eyIkb2lkIjoiNWZmZGY0MWExZWUyYzYyMzIwYjQ5ZWMxIn0") {
            edges {
              node {
                _id
              }
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }`,
      });
      expect(response.status).to.equal(200);
      expect(response.body.data.topics).to.eql({
        edges: [
          {
            node: {
              _id: '5ffdf41a1ee2c62320b49ec3',
            },
          },
          {
            node: {
              _id: '5ffdf41a1ee2c62320b49ec2',
            },
          },
        ],
        pageInfo: {
          hasPreviousPage: false,
          hasNextPage: true,
          startCursor: null,
          endCursor: 'eyIkb2lkIjoiNWZmZGY0MWExZWUyYzYyMzIwYjQ5ZWMyIn0',
        },
      });
    });
  });
});
