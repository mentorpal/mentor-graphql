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

describe('userQuestionSetDismissed', () => {
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

  it(`returns an error if no id`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1'); //mentor with role "Content Manager"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation {
          me{
            userQuestionSetDismissed(dismissed: true) {
              _id
            }
          }
      }`,
      });
    expect(response.status).to.equal(400);
  });

  it(`returns an error if no dismissed`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1'); //mentor with role "Content Manager"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation {
          me{
            userQuestionSetDismissed(id: "5ffdf41a1ee2c62320b49ee1") {
              _id
            }
          }
      }`,
      });
    expect(response.status).to.equal(400);
  });

  it(`returns an error if invalid id`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1'); //mentor with role "Content Manager"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation {
          me{
            userQuestionSetDismissed(id: "111111111111111111111111", dismissed: true) {
              _id
            }
          }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'No user question found'
    );
  });

  it(`users can edit their own user questions`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1'); //mentor with role "Content Manager"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation {
          me{
            userQuestionSetDismissed(id: "5ffdf41a1ee2c62320b49ee1", dismissed: true) {
              dismissed
          }
          }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.userQuestionSetDismissed).to.eql({
      dismissed: true,
    });
  });

  it(`user cannot edit an admins user question`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2'); //mentor with role "Content Manager"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation {
          me{
            userQuestionSetDismissed(id: "5ffdf41a1ee2c62320b49ee1", dismissed: true) {
              dismissed
          }
          }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'you do not have permission to edit this mentor'
    );
  });

  it(`content managers can update \'user\'s user questions`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1'); //mentor with role "Content Manager"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation {
          me{
            userQuestionSetDismissed(id: "5ffdf41a1ee2c62320b49e33", dismissed: true) {
              dismissed
          }
          }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.userQuestionSetDismissed).to.eql({
      dismissed: true,
    });
  });

  it(`users can update their own user questions`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2'); //mentor with role "Content Manager"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation {
          me{
            userQuestionSetDismissed(id: "5ffdf41a1ee2c62320b49e33", dismissed: true) {
              dismissed
          }
          }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.userQuestionSetDismissed).to.eql({
      dismissed: true,
    });
  });
});
