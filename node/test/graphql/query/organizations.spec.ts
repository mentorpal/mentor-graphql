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

describe('organizations', () => {
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

  it('gets a list of public organizations if not logged in', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          organizations {
          edges {
            node {
              _id
              name
              isPrivate
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
    expect(response.body.data.organizations).to.eql({
      edges: [
        {
          node: {
            _id: '511111111111111111111112',
            name: 'CSUF',
            isPrivate: false,
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
    });
  });

  it('does not get private organization if not owner or super user', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea6');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          organizations {
          edges {
            node {
              _id
              name
              isPrivate
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
    expect(response.body.data.organizations).to.eql({
      edges: [
        {
          node: {
            _id: '511111111111111111111112',
            name: 'CSUF',
            isPrivate: false,
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
    });
  });

  it('gets private organization if SUPER_ADMIN', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          organizations {
          edges {
            node {
              _id
              name
              isPrivate
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
    expect(response.body.data.organizations).to.eql({
      edges: [
        {
          node: {
            _id: '511111111111111111111112',
            name: 'CSUF',
            isPrivate: false,
          },
        },
        {
          node: {
            _id: '511111111111111111111111',
            name: 'USC',
            isPrivate: true,
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
    });
  });

  it('gets private organization if SUPER_CONTENT_MANAGER', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea5');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          organizations {
          edges {
            node {
              _id
              name
              isPrivate
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
    expect(response.body.data.organizations).to.eql({
      edges: [
        {
          node: {
            _id: '511111111111111111111112',
            name: 'CSUF',
            isPrivate: false,
          },
        },
        {
          node: {
            _id: '511111111111111111111111',
            name: 'USC',
            isPrivate: true,
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
    });
  });

  it('gets private organization if member', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          organizations {
          edges {
            node {
              _id
              name
              isPrivate
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
    expect(response.body.data.organizations).to.eql({
      edges: [
        {
          node: {
            _id: '511111111111111111111112',
            name: 'CSUF',
            isPrivate: false,
          },
        },
        {
          node: {
            _id: '511111111111111111111111',
            name: 'USC',
            isPrivate: true,
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
