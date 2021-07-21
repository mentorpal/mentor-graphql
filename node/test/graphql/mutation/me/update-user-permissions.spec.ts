/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
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
        query: `mutation {
          me {
            updateUserPermissions(permissionLevel: "") {
              name
            }  
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'missing required param userId'
    );
  });

  it(`returns an error if no permissionLevel`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation {
          me {
            updateUserPermissions(userId: "5ffdf41a1ee2c62320b49ea3") {
              name
            }  
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'missing required param permissionLevel'
    );
  });

  it(`returns an error if not logged in`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `mutation {
          me {
            updateUserPermissions(userId: "5ffdf41a1ee2c62320b49ea3", permissionLevel: "USER") {
              name
            }  
          }
        }`,
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
        query: `mutation {
          me {
            updateUserPermissions(userId: "5ffdf41a1ee2c62320b49ea3", permissionLevel: "USER") {
              name
            }  
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'must be an admin to edit user permissions'
    );
  });

  it(`returns an error if permissionLevel = admin and not an admin`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation {
          me {
            updateUserPermissions(userId: "5ffdf41a1ee2c62320b49ea3", permissionLevel: "ADMIN") {
              name
            }  
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'must be an admin to edit user permissions'
    );
  });

  it(`returns an error if editing an admin and not an admin`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation {
          me {
            updateUserPermissions(userId: "5ffdf41a1ee2c62320b49ea1", permissionLevel: "USER") {
              name
            }  
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'must be an admin to edit user permissions'
    );
  });

  it(`returns an error if invalid user`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation {
          me {
            updateUserPermissions(userId: "5f0cfea3395d762ca65405d4", permissionLevel: "USER") {
              name
            }  
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'could not find user for id 5f0cfea3395d762ca65405d4'
    );
  });

  [
    {
      user: '5f0cfea3395d762ca65405d2',
      userToEdit: '5ffdf41a1ee2c62320b49ea1',
      userRole: 'CONTENT_MANAGER',
      userToEditRole: 'ADMIN',
      permissionLevel: 'CONTENT_MANAGER',
    },
    {
      user: '5f0cfea3395d762ca65405d2',
      userToEdit: '5ffdf41a1ee2c62320b49ea1',
      userRole: 'CONTENT_MANAGER',
      userToEditRole: 'ADMIN',
      permissionLevel: 'USER',
    },
    {
      user: '5f0cfea3395d762ca65405d2',
      userToEdit: '5f0cfea3395d762ca65405d2',
      userRole: 'CONTENT_MANAGER',
      userToEditRole: 'CONTENT_MANAGER',
      permissionLevel: 'ADMIN',
    },
    {
      user: '5f0cfea3395d762ca65405d2',
      userToEdit: '5ffdf41a1ee2c62320b49ea3',
      userRole: 'CONTENT_MANAGER',
      userToEditRole: 'USER',
      permissionLevel: 'ADMIN',
    },
    {
      user: '5ffdf41a1ee2c62320b49ea3',
      userToEdit: '5ffdf41a1ee2c62320b49ea3',
      userRole: 'USER',
      userToEditRole: 'USER',
      permissionLevel: 'ADMIN',
    },
    {
      user: '5ffdf41a1ee2c62320b49ea3',
      userToEdit: '5ffdf41a1ee2c62320b49ea3',
      userRole: 'USER',
      userToEditRole: 'USER',
      permissionLevel: 'CONTENT_MANAGER',
    },
    {
      user: '5ffdf41a1ee2c62320b49ea3',
      userToEdit: '5f0cfea3395d762ca65405d2',
      userRole: 'USER',
      userToEditRole: 'CONTENT_MANAGER',
      permissionLevel: 'ADMIN',
    },
    {
      user: '5ffdf41a1ee2c62320b49ea3',
      userToEdit: '5f0cfea3395d762ca65405d2',
      userRole: 'USER',
      userToEditRole: 'CONTENT_MANAGER',
      permissionLevel: 'USER',
    },
    {
      user: '5ffdf41a1ee2c62320b49ea3',
      userToEdit: '5ffdf41a1ee2c62320b49ea1',
      userRole: 'USER',
      userToEditRole: 'ADMIN',
      permissionLevel: 'USER',
    },
    {
      user: '5ffdf41a1ee2c62320b49ea3',
      userToEdit: '5ffdf41a1ee2c62320b49ea1',
      userRole: 'USER',
      userToEditRole: 'ADMIN',
      permissionLevel: 'CONTENT_MANAGER',
    },
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
    {
      user: '5ffdf41a1ee2c62320b49ea1',
      userToEdit: '5ffdf41a1ee2c62320b49ea1',
      userRole: 'ADMIN',
      userToEditRole: 'ADMIN',
      permissionLevel: 'CONTENT_MANAGER',
    },
    {
      user: '5ffdf41a1ee2c62320b49ea1',
      userToEdit: '5ffdf41a1ee2c62320b49ea1',
      userRole: 'ADMIN',
      userToEditRole: 'ADMIN',
      permissionLevel: 'USER',
    },
    {
      user: '5ffdf41a1ee2c62320b49ea1',
      userToEdit: '5ffdf41a1ee2c62320b49ea4',
      userRole: 'ADMIN',
      userToEditRole: 'CONTENT_MANAGER',
      permissionLevel: 'ADMIN',
    },
    {
      user: '5ffdf41a1ee2c62320b49ea1',
      userToEdit: '5ffdf41a1ee2c62320b49ea4',
      userRole: 'ADMIN',
      userToEditRole: 'CONTENT_MANAGER',
      permissionLevel: 'USER',
    },
    {
      user: '5ffdf41a1ee2c62320b49ea1',
      userToEdit: '5ffdf41a1ee2c62320b49ea3',
      userRole: 'ADMIN',
      userToEditRole: 'USER',
      permissionLevel: 'ADMIN',
    },
    {
      user: '5ffdf41a1ee2c62320b49ea1',
      userToEdit: '5ffdf41a1ee2c62320b49ea3',
      userRole: 'ADMIN',
      userToEditRole: 'USER',
      permissionLevel: 'CONTENT_MANAGER',
    },
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
