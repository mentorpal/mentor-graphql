/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { expect } from 'chai';
import request from 'supertest';

const API_URL = process.env.API_URL || 'localhost:3001/graphql/graphql';

describe('query users', () => {
  it('query all users', async () => {
    const response = await request(API_URL)
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
          limit: 10,
          cursor: '',
          sortBy: '',
          sortAscending: false,
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.users.edges.length).to.be.equal(10);
  });
});
