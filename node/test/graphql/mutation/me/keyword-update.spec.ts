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

describe('updateKeyword', () => {
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
        query: `mutation UpdateKeyword($type: String!, $keywords: [String]!) {
          me {
            updateKeyword(type: $type, keywords: $keywords)
          }
        }`,
        variables: { type: '', keywords: [] },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Only authenticated users'
    );
  });

  it('creates keyword', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateKeyword($type: String!, $keywords: [String]!) {
          me {
            updateKeyword(type: $type, keywords: $keywords)
          }
        }`,
        variables: {
          type: 'New Type',
          keywords: ['New Keyword'],
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'data.me.updateKeyword',
      true
    );
    const keywords = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          keywords {
            edges {
              node {
                type
                keywords
              }
            }
          }
        }`,
      });
    expect(keywords.status).to.equal(200);
    expect(keywords.body.data.keywords).to.eql({
      edges: [
        {
          node: {
            type: 'New Type',
            keywords: ['New Keyword'],
          },
        },
        {
          node: {
            type: 'Career',
            keywords: ['STEM'],
          },
        },
        {
          node: {
            type: 'Gender',
            keywords: ['Male', 'Female', 'Nonbinary'],
          },
        },
      ],
    });
  });

  it('updates keyword', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateKeyword($type: String!, $keywords: [String]!) {
          me {
            updateKeyword(type: $type, keywords: $keywords)
          }
        }`,
        variables: {
          type: 'Career',
          keywords: ['STEM', 'New Keyword'],
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'data.me.updateKeyword',
      true
    );
    const keywords = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          keywords {
            edges {
              node {
                type
                keywords
              }
            }
          }
        }`,
      });
    expect(keywords.status).to.equal(200);
    expect(keywords.body.data.keywords).to.eql({
      edges: [
        {
          node: {
            type: 'Career',
            keywords: ['STEM', 'New Keyword'],
          },
        },
        {
          node: {
            type: 'Gender',
            keywords: ['Male', 'Female', 'Nonbinary'],
          },
        },
      ],
    });
  });

  it('doesnt add duplicate keyword', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateKeyword($type: String!, $keywords: [String]!) {
          me {
            updateKeyword(type: $type, keywords: $keywords)
          }
        }`,
        variables: {
          type: 'Career',
          keywords: ['STEM', 'STEM', 'stem', 'StEm'],
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'data.me.updateKeyword',
      true
    );
    const keywords = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          keywords {
            edges {
              node {
                type
                keywords
              }
            }
          }
        }`,
      });
    expect(keywords.status).to.equal(200);
    expect(keywords.body.data.keywords).to.eql({
      edges: [
        {
          node: {
            type: 'Career',
            keywords: ['STEM'],
          },
        },
        {
          node: {
            type: 'Gender',
            keywords: ['Male', 'Female', 'Nonbinary'],
          },
        },
      ],
    });
  });
});
