/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { expect } from 'chai';
import request from 'supertest';

const API_URL = process.env.API_URL || 'localhost:3001/graphql';

const SECRET_HEADER_NAME = process.env.SECRET_HEADER_NAME || '';
const SECRET_HEADER_VALUE = process.env.SECRET_HEADER_VALUE || '';

describe('subjects', () => {
  it('gets a list of subjects', async () => {
    const response = await request(API_URL)
      .post('/graphql')
      .set('User-Agent', 'SuperAgent 6.1.4') // required for api firewall
      .set(SECRET_HEADER_NAME, SECRET_HEADER_VALUE)
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
        }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.subjects.edges.length).to.be.greaterThan(10);
  });

  describe('can order list of subjects', () => {
    it('by name in ascending order', async () => {
      const response = await request(API_URL)
        .post('/graphql')
        .set('User-Agent', 'SuperAgent 6.1.4') // required for api firewall
        .set(SECRET_HEADER_NAME, SECRET_HEADER_VALUE)
        .send({
          query: `query {
          subjects(sortBy: "name", sortAscending: true) {
            edges {
              node {
                _id
                name
              }
            }
          }
        }`,
        });
      expect(response.status).to.equal(200);
      expect(response.body.data.subjects.edges.length).to.be.greaterThan(10);
    });

    it('by name in descending order', async () => {
      const response = await request(API_URL)
        .post('/graphql')
        .set('User-Agent', 'SuperAgent 6.1.4') // required for api firewall
        .set(SECRET_HEADER_NAME, SECRET_HEADER_VALUE)
        .send({
          query: `query {
          subjects(sortBy: "name", sortAscending: false) {
            edges {
              node {
                _id
                name
              }
            }
          }
        }`,
        });
      expect(response.status).to.equal(200);
      expect(response.body.data.subjects.edges.length).to.be.greaterThan(10);
    });
  });

  it('can paginate list of subjects', async () => {
    const first = await request(API_URL)
      .post('/graphql')
      .set('User-Agent', 'SuperAgent 6.1.4') // required for api firewall
      .set(SECRET_HEADER_NAME, SECRET_HEADER_VALUE)
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
    expect(first.status).to.equal(200);
    expect(first.body.data.subjects.edges.length).to.eql(2);
    const second = await request(API_URL)
      .post('/graphql')
      .set('User-Agent', 'SuperAgent 6.1.4') // required for api firewall
      .set(SECRET_HEADER_NAME, SECRET_HEADER_VALUE)
      .send({
        query: `query {
        subjects(limit: 2, cursor: "next__${first.body.data.subjects.pageInfo.endCursor}") {
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
    expect(second.status).to.equal(200);
    expect(second.body.data.subjects.edges.length).to.eql(2);
    const backToFirst = await request(API_URL)
      .post('/graphql')
      .set('User-Agent', 'SuperAgent 6.1.4') // required for api firewall
      .set(SECRET_HEADER_NAME, SECRET_HEADER_VALUE)
      .send({
        query: `query {
        subjects(limit: 2, cursor: "prev__${second.body.data.subjects.pageInfo.startCursor}") {
          edges {
            node {
              _id
            }
          }
        }
      }`,
      });
    expect(backToFirst.status).to.equal(200);
    expect(backToFirst.body.data.subjects.edges).to.eql(
      first.body.data.subjects.edges
    );
  });
});
