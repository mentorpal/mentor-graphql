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
import {
  GoogleAuthFunc,
  GoogleResponse,
  restoreGoogleAuthFunc,
  overrideGoogleAuthFunc,
} from 'gql/mutation/login-google';

describe('login with google', () => {
  let app: Express;
  let googleAuthFunc: GoogleAuthFunc = (accessToken: string) => {
    return Promise.reject('override me');
  };

  function googleAuthFuncOverride(
    accessToken: string
  ): Promise<GoogleResponse> {
    return googleAuthFunc(accessToken);
  }

  beforeEach(async () => {
    overrideGoogleAuthFunc(googleAuthFuncOverride);
    await mongoUnit.load(require('test/fixtures/mongodb/data-default.js'));
    app = await createApp();
    await appStart();
  });

  afterEach(async () => {
    restoreGoogleAuthFunc();
    await appStop();
    await mongoUnit.drop();
  });

  it(`returns an error if no accessToken`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `mutation {
        loginGoogle {
          user {
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

  it(`creates a new user and mentor for new google login`, async () => {
    googleAuthFunc = (accessToken: string) =>
      Promise.resolve<GoogleResponse>({
        id: 'someid',
        name: 'somename',
        email: 'x@y.com',
        given_name: 'somegivenname',
      });
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `mutation {
        loginGoogle(accessToken: "anything") {
          user {
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
      'data.loginGoogle.user.name',
      'somename'
    );
    expect(response.body).to.have.deep.nested.property(
      'data.loginGoogle.user.email',
      'x@y.com'
    );
  });

  it(`creates a new user using mentor config passed in`, async () => {
    googleAuthFunc = (accessToken: string) =>
      Promise.resolve<GoogleResponse>({
        id: 'someid',
        name: 'somename',
        email: 'x@y.com',
        given_name: 'somegivenname',
      });
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `mutation LoginGoogle($accessToken: String!, $mentorConfig: String){
        loginGoogle(accessToken: $accessToken, mentorConfig: $mentorConfig) {
          user {
            name
            email
          }
          accessToken
          expirationDate
        }
      }`,
        variables: {
          accessToken: 'anything',
          mentorConfig: '2023TestConfig',
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'data.loginGoogle.user.name',
      'somename'
    );
    expect(response.body).to.have.deep.nested.property(
      'data.loginGoogle.user.email',
      'x@y.com'
    );

    const response2 = await request(app)
      .post('/graphql')
      .send({
        query: `query Mentors($filter: Object){
          mentors(filter: $filter){
            edges{
              node{
                name
                isPublicApproved
                isPrivate
                orgPermissions{
                  orgId
                  orgName
                  viewPermission
                  editPermission
                }
                subjects{
                  _id
                  name
                }
                mentorConfig {
                  configId
                  subjects
                  publiclyVisible
                  orgPermissions{
                    org
                    viewPermission
                    editPermission
                  }
                }
              }
            }
          }
        }`,
        variables: {
          filter: {
            name: 'somename',
          },
        },
      });
    expect(response2.status).to.equal(200);
    expect(response2.body).to.have.deep.nested.property(
      'data.mentors.edges[0].node.name',
      'somename'
    );
    expect(
      response2.body.data.mentors.edges[0].node.subjects
    ).to.deep.include.members([
      {
        _id: '5ffdf41a1ee2c62320b49eb2',
        name: 'Background',
      },
      {
        _id: '5ffdf41a1ee2c62320b49eb1',
        name: 'Repeat After Me',
      },
      {
        _id: '5ffdf41a1ee2c62320b49eb3',
        name: 'STEM',
      },
    ]);
    expect(response2.body.data.mentors.edges[0].node.isPrivate).to.equal(false);
    expect(
      response2.body.data.mentors.edges[0].node.mentorConfig
    ).to.deep.equal({
      configId: '2023TestConfig',
      subjects: ['5ffdf41a1ee2c62320b49eb3'],
      publiclyVisible: true,
      orgPermissions: [
        {
          org: '511111111111111111111111',
          viewPermission: 'HIDDEN',
          editPermission: 'HIDDEN',
        },
      ],
    });
  });
});
