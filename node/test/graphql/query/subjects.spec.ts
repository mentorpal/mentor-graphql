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

describe('subjects', () => {
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

  it('gets a list of subjects', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        subjects {
          edges {
            node {
              _id
              name
              isRequired
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
    expect(response.body.data.subjects.edges).to.deep.include.members([
      {
        node: {
          _id: '5ffdf41a1ee2c62320b49eb3',
          name: 'STEM',
          isRequired: false,
        },
      },
      {
        node: {
          _id: '5ffdf41a1ee2c62320b49eb2',
          name: 'Background',
          isRequired: true,
        },
      },
      {
        node: {
          _id: '5ffdf41a1ee2c62320b49eb1',
          name: 'Repeat After Me',
          isRequired: true,
        },
      },
    ]);
  });

  it('does not get deleted subjects', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        subjects {
          edges {
            node {
              _id
              name
              isRequired
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
    const nodes = response.body.data.subjects.edges.map((e: any) => e.node);
    nodes.forEach((n: any) => {
      expect(n._id).to.not.equal('5ffdf41a1ee2c62320b49ec9');
    });
  });

  describe('can order list of subjects', () => {
    it('by name in ascending order', async () => {
      const response = await request(app)
        .post('/graphql')
        .send({
          query: `query {
          subjects(sortBy: "name", sortAscending: true) {
            edges {
              node {
                _id
                name
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
      expect(response.body.data.subjects).to.eql({
        edges: [
          {
            node: {
              _id: '5ffdf41a1ee2c62320b49eb2',
              name: 'Background',
            },
          },
          {
            node: {
              _id: '5ffdf41a1ee2c62320b49eb1',
              name: 'Repeat After Me',
            },
          },
          {
            node: {
              _id: '5ffdf41a1ee2c62320b49eb3',
              name: 'STEM',
            },
          },
          {
            node: {
              _id: '5ffdf41a1ee2c62119991236',
              name: 'Subject Topic Question Test',
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
      const response = await request(app)
        .post('/graphql')
        .send({
          query: `query {
          subjects(sortBy: "name", sortAscending: false) {
            edges {
              node {
                _id
                name
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
      expect(response.body.data.subjects).to.eql({
        edges: [
          {
            node: {
              _id: '5ffdf41a1ee2c62119991236',
              name: 'Subject Topic Question Test',
            },
          },
          {
            node: {
              _id: '5ffdf41a1ee2c62320b49eb3',
              name: 'STEM',
            },
          },
          {
            node: {
              _id: '5ffdf41a1ee2c62320b49eb1',
              name: 'Repeat After Me',
            },
          },
          {
            node: {
              _id: '5ffdf41a1ee2c62320b49eb2',
              name: 'Background',
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

  describe('can paginate list of subjects', () => {
    it('gets first 2 subjects', async () => {
      const response = await request(app)
        .post('/graphql')
        .send({
          query: `query {
          subjects(limit: 2) {
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
      expect(response.body.data.subjects).to.eql({
        edges: [
          {
            node: {
              _id: '5ffdf41a1ee2c62320b49eb3',
            },
          },
          {
            node: {
              _id: '5ffdf41a1ee2c62320b49eb2',
            },
          },
        ],
        pageInfo: {
          hasPreviousPage: false,
          hasNextPage: true,
          startCursor: null,
          endCursor: 'eyIkb2lkIjoiNWZmZGY0MWExZWUyYzYyMzIwYjQ5ZWIyIn0',
        },
      });
    });

    it('gets next page', async () => {
      const response = await request(app)
        .post('/graphql')
        .send({
          query: `query {
          subjects(limit: 2, cursor: "next__eyIkb2lkIjoiNWZmZGY0MWExZWUyYzYyMzIwYjQ5ZWIyIn0") {
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
      expect(response.body.data.subjects).to.eql({
        edges: [
          {
            node: {
              _id: '5ffdf41a1ee2c62320b49eb1',
            },
          },
          {
            node: {
              _id: '5ffdf41a1ee2c62119991236',
            },
          },
        ],
        pageInfo: {
          hasPreviousPage: true,
          hasNextPage: false,
          startCursor: 'eyIkb2lkIjoiNWZmZGY0MWExZWUyYzYyMzIwYjQ5ZWIxIn0',
          endCursor: null,
        },
      });
    });

    it('gets first 2 subjects', async () => {
      const response = await request(app)
        .post('/graphql')
        .send({
          query: `query {
          subjects(limit: 2, cursor: "prev__eyIkb2lkIjoiNWZmZGY0MWExZWUyYzYyMzIwYjQ5ZWIxIn0") {
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
      expect(response.body.data.subjects).to.eql({
        edges: [
          {
            node: {
              _id: '5ffdf41a1ee2c62320b49eb3',
            },
          },
          {
            node: {
              _id: '5ffdf41a1ee2c62320b49eb2',
            },
          },
        ],
        pageInfo: {
          hasPreviousPage: false,
          hasNextPage: true,
          startCursor: null,
          endCursor: 'eyIkb2lkIjoiNWZmZGY0MWExZWUyYzYyMzIwYjQ5ZWIyIn0',
        },
      });
    });
  });
});
