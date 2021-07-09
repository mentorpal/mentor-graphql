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
import { getToken, mockSetCookie, mockGetCookie } from '../../helpers';

describe('login', () => {
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

  it(`returns an error if no accessToken`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `mutation {
        login {
          user {
            _id
            name
            email
          }
          accessToken
          expirationDate
        }
      }`,
      });
    expect(response.status).to.equal(400);
  });

  it(`returns an error if token expired`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1', -1);
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `mutation {
          login(accessToken: "${token}") {
            user {
              _id
              name
              email
            }
            accessToken
            expirationDate
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Error: invalid user'
    );
  });

  it(`returns user and updates token`, async () => {
    const date = new Date(Date.now() + 3000);
    const token = getToken('5ffdf41a1ee2c62320b49ea1', 300);
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation {
          login(accessToken: "${token}") {
            user {
              _id
              name
              email
            }
            accessToken
            expirationDate
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.login.user).to.eql({
      _id: '5ffdf41a1ee2c62320b49ea1',
      name: 'Clinton Anderson',
      email: 'clint@anderson.com',
    });
    expect(response.body.data.login.accessToken).to.not.eql(token);
    expect(new Date(response.body.data.login.expirationDate)).to.be.greaterThan(
      date
    );
  });

  it(`returns user and updates token (using cookies to get auth token)`, async () => {
    const date = new Date(Date.now() + 3000);
    const tokenToStoreInCookie = getToken('5ffdf41a1ee2c62320b49ea1', 300);
    const storedCookie = mockSetCookie(
      'auth_token_cookie',
      tokenToStoreInCookie,
      7
    );
    const token = mockGetCookie(storedCookie, 'auth_token_cookie');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `
          mutation Login($accessToken: String!) {
            login(accessToken: $accessToken) {
              user {
                _id
                name
                email
              }
              accessToken
              expirationDate
            }
          }
        `,
        variables: { accessToken: token },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.login.user).to.eql({
      _id: '5ffdf41a1ee2c62320b49ea1',
      name: 'Clinton Anderson',
      email: 'clint@anderson.com',
    });
    // update mock token
    mockSetCookie('auth_token_cookie', response.body.data.login.accessToken, 7);
    expect(response.body.data.login.accessToken).to.not.eql(token);
    expect(new Date(response.body.data.login.expirationDate)).to.be.greaterThan(
      date
    );
  });

  it(`updates lastLoginAt`, async () => {
    const date = new Date(Date.now() - 1000);
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation {
          login(accessToken: "${token}") {
            user {
              lastLoginAt
            }
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(
      new Date(response.body.data.login.user.lastLoginAt)
    ).to.be.greaterThan(date);
  });
  it(`updates refreshToken`, async () => {
    const date = new Date(Date.now() - 1000);
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `
          mutation Login($accessToken: String!) {
            login(accessToken: $accessToken) {
              accessToken
            }
          }
        `,
        variables: { accessToken: token },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.login.accessToken).to.be.not.empty;
    expect(response.body.data.login.accessToken).to.be.not.equal(token);
  });

  it(`adds any missing required subjects to mentor after logging in`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2');
    let mentor = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          me {
            mentor {
              name
              subjects {
                name
              }
            }
          }
        }`,
      });
    expect(mentor.status).to.equal(200);
    expect(mentor.body.data.me.mentor).to.eql({
      name: 'Dan Davis',
      subjects: [
        {
          name: 'Repeat After Me',
        },
      ],
    });

    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation {
          login(accessToken: "${token}") {
            accessToken
          }
        }`,
      });
    expect(response.status).to.equal(200);

    mentor = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${response.body.data.login.accessToken}`)
      .send({
        query: `query {
          me {
            mentor {
              name
              subjects {
                name
              }
            }
          }
        }`,
      });
    expect(mentor.status).to.equal(200);
  });
});
