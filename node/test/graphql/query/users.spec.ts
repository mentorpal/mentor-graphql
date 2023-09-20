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

describe('query users', () => {
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

  it(`returns all users`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `
        query Users($filter: Object!, $limit: Int!, $cursor: String!, $sortBy: String!, $sortAscending: Boolean!){
          users (filter: $filter, limit: $limit,cursor: $cursor,sortBy: $sortBy,sortAscending: $sortAscending){
            edges {
              node {
                _id
                name
                email
                userRole
                defaultMentor{
                  _id
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
        }`,
        variables: {
          filter: '',
          limit: 1000,
          cursor: '',
          sortBy: '',
          sortAscending: false,
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.users.edges).to.deep.include.members([
      {
        node: {
          _id: '5ffdf41a1ee2c62320b49ea7',
          name: 'Private Mentor',
          email: 'private@mentor.com',
          userRole: 'USER',
          defaultMentor: { _id: '5ffdf41a1ee2c62111111114' },
        },
      },
      {
        node: {
          _id: '5ffdf41a1ee2c62320b49ea6',
          name: 'Aaron Klunder',
          email: 'aaron@klunder.com',
          userRole: 'ADMIN',
          defaultMentor: { _id: '5ffdf41a1ee2c62111111119' },
        },
      },
      {
        node: {
          _id: '5ffdf41a1ee2c62320b49ea5',
          name: 'Jacob Ferguson',
          email: 'jacob@ferguson.com',
          userRole: 'SUPER_CONTENT_MANAGER',
          defaultMentor: { _id: '5ffdf41a1ee2c62111111110' },
        },
      },
      {
        node: {
          _id: '5ffdf41a1ee2c62320b49ea4',
          name: 'No Mentor',
          email: 'no@mentor.com',
          userRole: 'CONTENT_MANAGER',
          defaultMentor: null,
        },
      },
      {
        node: {
          _id: '5ffdf41a1ee2c62320b49ea3',
          name: 'Julianne Nordhagen',
          email: 'julianne@nordhagen.com',
          userRole: 'USER',
          defaultMentor: { _id: '5ffdf41a1ee2c62111111112' },
        },
      },
      {
        node: {
          _id: '5ffdf41a1ee2c62320b49ea2',
          name: 'Dan Davis',
          email: 'dan@davis.com',
          userRole: 'USER',
          defaultMentor: { _id: '5ffdf41a1ee2c62111111113' },
        },
      },
      {
        node: {
          _id: '5ffdf41a1ee2c62320b49ea1',
          name: 'Clinton Anderson',
          email: 'clint@anderson.com',
          userRole: 'SUPER_ADMIN',
          defaultMentor: { _id: '5ffdf41a1ee2c62111111111' },
        },
      },
    ]);
  });
});
