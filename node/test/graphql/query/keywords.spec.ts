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

describe('keywords', () => {
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

  it('gets a list of keywords', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        keywords {
          edges {
            node {
              _id
              type
              keywords
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
    expect(response.body.data.keywords).to.eql({
      edges: [
        {
          node: {
            _id: '511111111111111111111112',
            type: 'Career',
            keywords: ['STEM'],
          },
        },
        {
          node: {
            _id: '511111111111111111111111',
            type: 'Gender',
            keywords: ['Male', 'Female', 'Nonbinary'],
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
    });
  });

  describe('can order list of keywords', () => {
    it('by type in ascending order', async () => {
      const response = await request(app)
        .post('/graphql')
        .send({
          query: `query {
          keywords(sortBy: "type", sortAscending: true) {
            edges {
              node {
                _id
                type
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
      expect(response.body.data.keywords).to.eql({
        edges: [
          {
            node: {
              _id: '511111111111111111111112',
              type: 'Career',
            },
          },
          {
            node: {
              _id: '511111111111111111111111',
              type: 'Gender',
            },
          },
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
      });
    });

    it('by type in descending order', async () => {
      const response = await request(app)
        .post('/graphql')
        .send({
          query: `query {
          keywords(sortBy: "type", sortAscending: false) {
            edges {
              node {
                _id
                type
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
      expect(response.body.data.keywords).to.eql({
        edges: [
          {
            node: {
              _id: '511111111111111111111111',
              type: 'Gender',
            },
          },
          {
            node: {
              _id: '511111111111111111111112',
              type: 'Career',
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

  describe('can paginate list of keywords', () => {
    it('gets first 1 keywords', async () => {
      const response = await request(app)
        .post('/graphql')
        .send({
          query: `query {
          keywords(limit: 1) {
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
      expect(response.body.data.keywords).to.eql({
        edges: [
          {
            node: {
              _id: '511111111111111111111112',
            },
          },
        ],
        pageInfo: {
          hasPreviousPage: false,
          hasNextPage: true,
          startCursor: null,
          endCursor: 'eyIkb2lkIjoiNTExMTExMTExMTExMTExMTExMTExMTEyIn0',
        },
      });
    });

    it('gets next page', async () => {
      const response = await request(app)
        .post('/graphql')
        .send({
          query: `query {
          keywords(limit: 1, cursor: "next__eyIkb2lkIjoiNTExMTExMTExMTExMTExMTExMTExMTEyIn0") {
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
      expect(response.body.data.keywords).to.eql({
        edges: [
          {
            node: {
              _id: '511111111111111111111111',
            },
          },
        ],
        pageInfo: {
          hasPreviousPage: true,
          hasNextPage: false,
          startCursor: 'eyIkb2lkIjoiNTExMTExMTExMTExMTExMTExMTExMTExIn0',
          endCursor: null,
        },
      });
    });

    it('gets first 1 keywords', async () => {
      const response = await request(app)
        .post('/graphql')
        .send({
          query: `query {
          keywords(limit: 2, cursor: "prev__eyIkb2lkIjoiNTExMTExMTExMTExMTExMTExMTExMTExIn0") {
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
      expect(response.body.data.keywords).to.eql({
        edges: [
          {
            node: {
              _id: '511111111111111111111112',
            },
          },
        ],
        pageInfo: {
          hasPreviousPage: false,
          hasNextPage: true,
          startCursor: null,
          endCursor: 'eyIkb2lkIjoiNTExMTExMTExMTExMTExMTExMTExMTEyIn0',
        },
      });
    });
  });
});
