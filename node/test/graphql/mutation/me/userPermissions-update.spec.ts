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
import { getToken } from 'test/helpers';

describe('updateUserPermissions', () => {
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

  it(`returns an error if no userId`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateUserPermissions($permissionLevel: String!){
          me {
            updateUserPermissions(permissionLevel: $permissionLevel) {
              name
            }  
          }
        }`,
        variables: {
          permissionLevel: '',
        },
      });
    expect(response.status).to.equal(400);
  });

  it(`returns an error if no permissionLevel`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateUserPermissions($userId: String!) {
          me {
            updateUserPermissions(userId: $userId) {
              name
            }  
          }
        }`,
        variables: {
          userId: '5ffdf41a1ee2c62320b49ea3',
        },
      });
    expect(response.status).to.equal(400);
  });

  it(`returns an error if not logged in`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `mutation updateUserPermissions($userId: String!, $permissionLevel: String!){
          me {
            updateUserPermissions(userId:$userId, permissionLevel: $permissionLevel) {
              name
            }  
          }
        }`,
        variables: {
          userId: '5ffdf41a1ee2c62320b49ea3',
          permissionLevel: 'USER',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Only authenticated users'
    );
  });

  it(`returns an error if not admin`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation updateUserPermissions($userId: String!, $permissionLevel: String!){
          me {
            updateUserPermissions(userId: $userId, permissionLevel: $permissionLevel) {
              name
            }  
          }
        }`,
        variables: {
          userId: '5ffdf41a1ee2c62320b49ea3',
          permissionLevel: 'USER',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'must be an admin or super admin to edit user permissions'
    );
  });

  it(`returns an error if permissionLevel = super admin and not a super admin`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea6');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateUserPermissions($userId: String!, $permissionLevel: String!){
          me {
            updateUserPermissions(userId: $userId, permissionLevel: $permissionLevel) {
              name
            }  
          }
        }`,
        variables: {
          userId: '5ffdf41a1ee2c62320b49ea3',
          permissionLevel: 'SUPER_ADMIN',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'only super admins can give super admin permissions'
    );
  });

  it(`returns an error if editing a super admin and not a super admin`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea6');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateUserPermissions($userId: String!, $permissionLevel: String!){
          me {
            updateUserPermissions(userId: $userId, permissionLevel: $permissionLevel) {
              name
            }  
          }
        }`,
        variables: {
          userId: '5ffdf41a1ee2c62320b49ea1',
          permissionLevel: 'USER',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'only super admins can edit a super admins permissions'
    );
  });

  it(`returns an error if invalid user`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateUserPermissions($userId: String!, $permissionLevel: String!){
          me {
            updateUserPermissions(userId: $userId, permissionLevel: $permissionLevel) {
              name
            }  
          }
        }`,
        variables: {
          userId: '5f0cfea3395d762ca65405d4',
          permissionLevel: 'USER',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'could not find user for id 5f0cfea3395d762ca65405d4'
    );
  });

  function getUser(role: string) {
    switch (role) {
      case 'USER':
        return '5ffdf41a1ee2c62320b49ea2';
      case 'CONTENT_MANAGER':
        return '5ffdf41a1ee2c62320b49ea4';
      case 'ADMIN':
        return '5ffdf41a1ee2c62320b49ea6';
      case 'SUPER_ADMIN':
        return '5ffdf41a1ee2c62320b49ea1';
    }
  }
  function testCase(
    userRole: string,
    userToEditRole: string,
    permissionLevel: string
  ) {
    return {
      user: getUser(userRole),
      userToEdit: getUser(userToEditRole),
      userRole,
      userToEditRole,
      permissionLevel,
    };
  }

  [
    // X wants to change Y into a Z
    testCase('USER', 'USER', 'USER'),
    testCase('USER', 'USER', 'CONTENT_MANAGER'),
    testCase('USER', 'USER', 'ADMIN'),
    testCase('USER', 'USER', 'SUPER_ADMIN'),
    testCase('USER', 'CONTENT_MANAGER', 'USER'),
    testCase('USER', 'CONTENT_MANAGER', 'CONTENT_MANAGER'),
    testCase('USER', 'CONTENT_MANAGER', 'ADMIN'),
    testCase('USER', 'CONTENT_MANAGER', 'SUPER_ADMIN'),
    testCase('USER', 'ADMIN', 'USER'),
    testCase('USER', 'ADMIN', 'CONTENT_MANAGER'),
    testCase('USER', 'ADMIN', 'ADMIN'),
    testCase('USER', 'ADMIN', 'SUPER_ADMIN'),
    testCase('USER', 'SUPER_ADMIN', 'USER'),
    testCase('USER', 'SUPER_ADMIN', 'CONTENT_MANAGER'),
    testCase('USER', 'SUPER_ADMIN', 'ADMIN'),
    testCase('USER', 'SUPER_ADMIN', 'SUPER_ADMIN'),

    testCase('CONTENT_MANAGER', 'USER', 'USER'),
    testCase('CONTENT_MANAGER', 'USER', 'CONTENT_MANAGER'),
    testCase('CONTENT_MANAGER', 'USER', 'ADMIN'),
    testCase('CONTENT_MANAGER', 'USER', 'SUPER_ADMIN'),
    testCase('CONTENT_MANAGER', 'CONTENT_MANAGER', 'USER'),
    testCase('CONTENT_MANAGER', 'CONTENT_MANAGER', 'CONTENT_MANAGER'),
    testCase('CONTENT_MANAGER', 'CONTENT_MANAGER', 'ADMIN'),
    testCase('CONTENT_MANAGER', 'CONTENT_MANAGER', 'SUPER_ADMIN'),
    testCase('CONTENT_MANAGER', 'ADMIN', 'USER'),
    testCase('CONTENT_MANAGER', 'ADMIN', 'CONTENT_MANAGER'),
    testCase('CONTENT_MANAGER', 'ADMIN', 'ADMIN'),
    testCase('CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'),
    testCase('CONTENT_MANAGER', 'SUPER_ADMIN', 'USER'),
    testCase('CONTENT_MANAGER', 'SUPER_ADMIN', 'CONTENT_MANAGER'),
    testCase('CONTENT_MANAGER', 'SUPER_ADMIN', 'ADMIN'),
    testCase('CONTENT_MANAGER', 'SUPER_ADMIN', 'SUPER_ADMIN'),

    testCase('ADMIN', 'USER', 'SUPER_ADMIN'),
    testCase('ADMIN', 'CONTENT_MANAGER', 'SUPER_ADMIN'),
    testCase('ADMIN', 'ADMIN', 'SUPER_ADMIN'),
    testCase('ADMIN', 'SUPER_ADMIN', 'USER'),
    testCase('ADMIN', 'SUPER_ADMIN', 'CONTENT_MANAGER'),
    testCase('ADMIN', 'SUPER_ADMIN', 'ADMIN'),
    testCase('ADMIN', 'SUPER_ADMIN', 'SUPER_ADMIN'),
  ].forEach((item: any) => {
    it(`${item.userRole} user cannot change ${item.userToEditRole} user's role to ${item.permissionLevel}`, async () => {
      const token = getToken(item.user);
      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `bearer ${token}`)
        .send({
          query: `mutation UpdateUserPermissions($userId: String!, $permissionLevel: String!){
          me {
            updateUserPermissions(userId: $userId, permissionLevel: $permissionLevel) {
              userRole
            }
          }
        }`,
          variables: {
            userId: item.userToEdit,
            permissionLevel: item.permissionLevel,
          },
        });
      expect(response.status).to.equal(200);
      expect(response.body).to.have.deep.nested.property('errors[0].message');
    });
  });

  [
    // X wants to change Y into a Z
    testCase('ADMIN', 'USER', 'USER'),
    testCase('ADMIN', 'USER', 'CONTENT_MANAGER'),
    testCase('ADMIN', 'USER', 'ADMIN'),
    testCase('ADMIN', 'CONTENT_MANAGER', 'USER'),
    testCase('ADMIN', 'CONTENT_MANAGER', 'CONTENT_MANAGER'),
    testCase('ADMIN', 'CONTENT_MANAGER', 'ADMIN'),
    testCase('ADMIN', 'ADMIN', 'USER'),
    testCase('ADMIN', 'ADMIN', 'CONTENT_MANAGER'),
    testCase('ADMIN', 'ADMIN', 'ADMIN'),

    testCase('SUPER_ADMIN', 'USER', 'USER'),
    testCase('SUPER_ADMIN', 'USER', 'CONTENT_MANAGER'),
    testCase('SUPER_ADMIN', 'USER', 'ADMIN'),
    testCase('SUPER_ADMIN', 'USER', 'SUPER_ADMIN'),
    testCase('SUPER_ADMIN', 'CONTENT_MANAGER', 'USER'),
    testCase('SUPER_ADMIN', 'CONTENT_MANAGER', 'CONTENT_MANAGER'),
    testCase('SUPER_ADMIN', 'CONTENT_MANAGER', 'ADMIN'),
    testCase('SUPER_ADMIN', 'CONTENT_MANAGER', 'SUPER_ADMIN'),
    testCase('SUPER_ADMIN', 'ADMIN', 'USER'),
    testCase('SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'),
    testCase('SUPER_ADMIN', 'ADMIN', 'ADMIN'),
    testCase('SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN'),
    testCase('SUPER_ADMIN', 'SUPER_ADMIN', 'USER'),
    testCase('SUPER_ADMIN', 'SUPER_ADMIN', 'CONTENT_MANAGER'),
    testCase('SUPER_ADMIN', 'SUPER_ADMIN', 'ADMIN'),
    testCase('SUPER_ADMIN', 'SUPER_ADMIN', 'SUPER_ADMIN'),
  ].forEach((item: any) => {
    it(`${item.userRole} user can change ${item.userToEditRole} user's role to ${item.permissionLevel}`, async () => {
      const token = getToken(item.user);
      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `bearer ${token}`)
        .send({
          query: `mutation UpdateUserPermissions($userId: String!, $permissionLevel: String!){
            me {
              updateUserPermissions(userId: $userId, permissionLevel: $permissionLevel) {
                userRole
              }
            }
          }`,
          variables: {
            userId: item.userToEdit,
            permissionLevel: item.permissionLevel,
          },
        });
      expect(response.status).to.equal(200);
      expect(response.body.data.me.updateUserPermissions).to.eql({
        userRole: item.permissionLevel,
      });
    });
  });
});
