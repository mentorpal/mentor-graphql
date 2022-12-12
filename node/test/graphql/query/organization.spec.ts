/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/

import createApp, { appStart, appStop } from 'app';
import { expect } from 'chai';
import { Express } from 'express';
import { describe } from 'mocha';
import mongoUnit from 'mongo-unit';
import request from 'supertest';
import { getToken } from '../../helpers';

describe('organization', () => {
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

  it(`throws an error if invalid id`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          organization(id: "111111111111111111111113") {
            _id
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'organization not found for args "{"id":"111111111111111111111113"}"'
    );
  });

  it('gets a organization by id', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          organization(id: "511111111111111111111112") {
            _id
            uuid
            name
            subdomain
            isPrivate
            members {
              user {
                _id
                name
                userRole
              }
              role
            }
          }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.organization).to.eql({
      _id: '511111111111111111111112',
      uuid: 'csuf',
      name: 'CSUF',
      subdomain: 'careerfair',
      isPrivate: false,
      members: [
        {
          user: {
            _id: '5ffdf41a1ee2c62320b49ea1',
            name: 'Clinton Anderson',
            userRole: 'SUPER_ADMIN',
          },
          role: 'ADMIN',
        },
        {
          user: {
            _id: '5ffdf41a1ee2c62320b49ea5',
            name: 'Jacob Ferguson',
            userRole: 'SUPER_CONTENT_MANAGER',
          },
          role: 'CONTENT_MANAGER',
        },
        {
          user: {
            _id: '5ffdf41a1ee2c62320b49ea3',
            name: 'Julianne Nordhagen',
            userRole: 'USER',
          },
          role: 'USER',
        },
      ],
    });
  });

  it('cannot view private organization if not logged in', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          organization(id: "511111111111111111111111") {
            _id
            uuid
            name
            subdomain
            isPrivate
          }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'organization is private and you do not have permission to access'
    );
  });

  it('cannot view private organization if not super admin, super content manager, or member', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea6');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          organization(id: "511111111111111111111111") {
            _id
            uuid
            name
            subdomain
            isPrivate
          }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'organization is private and you do not have permission to access'
    );
  });

  it('can view private organization if SUPER_ADMIN', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          organization(id: "511111111111111111111111") {
            _id
            uuid
            name
            subdomain
            isPrivate
          }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.not.have.deep.nested.property('errors[0].message');
  });

  it('can view private organization if SUPER_CONTENT_MANAGER', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea5');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          organization(id: "511111111111111111111111") {
            _id
            uuid
            name
            subdomain
            isPrivate
          }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.not.have.deep.nested.property('errors[0].message');
  });

  it('can view private organization if member', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          organization(id: "511111111111111111111111") {
            _id
            uuid
            name
            subdomain
            isPrivate
          }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.not.have.deep.nested.property('errors[0].message');
  });
});
