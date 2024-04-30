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

describe('addOrUpdateOrganization', () => {
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
        query: `mutation AddOrUpdateOrganization($id: ID, $organization: AddOrUpdateOrganizationInputType!) {
          me {
            addOrUpdateOrganization(id: $id, organization: $organization) {
              _id
              name
              subdomain
              isPrivate
              config {
                styleHeaderLogo
                styleHeaderColor
                styleHeaderTextColor  
              }
              members {
                user {
                  _id
                  name
                }
                role
              }
            }
          }
        }`,
        variables: {
          id: '',
          organization: {
            name: 'new org',
            subdomain: 'new',
            isPrivate: false,
            members: [],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Only authenticated users'
    );
  });

  it(`throws an error if no organization`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `mutation AddOrUpdateOrganization($id: ID, $organization: AddOrUpdateOrganizationInputType) {
          me {
            addOrUpdateOrganization(id: $id, organization: $organization) {
              _id
              name
              subdomain
              isPrivate
              config {
                styleHeaderLogo
                styleHeaderColor
                styleHeaderTextColor  
              }
              members {
                user {
                  _id
                  name
                }
                role
              }
            }
          }
        }`,
        variables: {
          id: '',
        },
      });
    expect(response.status).to.equal(400);
  });

  it('does not accept api key user', async () => {
    const response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: `mutation AddOrUpdateOrganization($id: ID, $organization: AddOrUpdateOrganizationInputType!) {
          me {
            addOrUpdateOrganization(id: $id, organization: $organization) {
              _id
              name
              subdomain
              isPrivate
              config {
                styleHeaderLogo
                styleHeaderColor
                styleHeaderTextColor  
              }
              members {
                user {
                  _id
                  name
                }
                role
              }
            }
          }
        }`,
        variables: {
          id: '',
          organization: {
            name: 'new org',
            subdomain: 'new',
            isPrivate: false,
            members: [],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'you do not have permission to create an organization'
    );
  });

  it('USER cannot create organization', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2'); //mentor with role "User"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateOrganization($id: ID, $organization: AddOrUpdateOrganizationInputType!) {
          me {
            addOrUpdateOrganization(id: $id, organization: $organization) {
              _id
              name
              subdomain
              isPrivate
              config {
                styleHeaderLogo
                styleHeaderColor
                styleHeaderTextColor  
              }
              members {
                user {
                  _id
                  name
                }
                role
              }
            }
          }
        }`,
        variables: {
          id: '',
          organization: {
            name: 'new org',
            subdomain: 'new',
            isPrivate: false,
            members: [],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'you do not have permission to create an organization'
    );
  });

  it('CONTENT_MANAGER cannot create organization', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea4'); //mentor with role "Content Manager"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateOrganization($id: ID, $organization: AddOrUpdateOrganizationInputType!) {
          me {
            addOrUpdateOrganization(id: $id, organization: $organization) {
              _id
              name
              subdomain
              isPrivate
              config {
                styleHeaderLogo
                styleHeaderColor
                styleHeaderTextColor  
              }
              members {
                user {
                  _id
                  name
                }
                role
              }
            }
          }
        }`,
        variables: {
          id: '',
          organization: {
            name: 'new org',
            subdomain: 'new',
            isPrivate: false,
            members: [],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'you do not have permission to create an organization'
    );
  });

  it('ADMIN cannot create organization', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea6'); //mentor with role "Admin"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateOrganization($id: ID, $organization: AddOrUpdateOrganizationInputType!) {
          me {
            addOrUpdateOrganization(id: $id, organization: $organization) {
              _id
              name
              subdomain
              isPrivate
              config {
                styleHeaderLogo
                styleHeaderColor
                styleHeaderTextColor  
              }
              members {
                user {
                  _id
                  name
                }
                role
              }
            }
          }
        }`,
        variables: {
          id: '',
          organization: {
            name: 'new org',
            subdomain: 'new',
            isPrivate: false,
            members: [],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'you do not have permission to create an organization'
    );
  });

  it('SUPER_CONTENT_MANAGER can create organization', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea5');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateOrganization($id: ID, $organization: AddOrUpdateOrganizationInputType!) {
          me {
            addOrUpdateOrganization(id: $id, organization: $organization) {
              name
              subdomain
              isPrivate
              config {
                mentorsDefault
                urlGraphql
              }
              members {
                user {
                  _id
                  name
                }
                role
              }
            }
          }
        }`,
        variables: {
          id: '',
          organization: {
            name: 'new org',
            subdomain: 'new',
            isPrivate: false,
            members: [],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.addOrUpdateOrganization).to.eql({
      name: 'new org',
      subdomain: 'new',
      isPrivate: false,
      config: {
        mentorsDefault: [],
        urlGraphql: '/graphql',
      },
      members: [],
    });
    const organizations = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          organizations {
            edges {
              node {
                name
              }
            }
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(organizations.body.data.organizations).to.eql({
      edges: [
        {
          node: {
            name: 'new org',
          },
        },
        {
          node: {
            name: 'CSUF',
          },
        },
        {
          node: {
            name: 'USC',
          },
        },
      ],
    });
  });

  it('SUPER_ADMIN can create organization', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateOrganization($id: ID, $organization: AddOrUpdateOrganizationInputType!) {
          me {
            addOrUpdateOrganization(id: $id, organization: $organization) {
              name
              subdomain
              isPrivate
              config {
                mentorsDefault
                urlGraphql
              }
              members {
                user {
                  _id
                  name
                }
                role
              }
            }
          }
        }`,
        variables: {
          id: '',
          organization: {
            name: 'new org',
            subdomain: 'new',
            isPrivate: false,
            members: [],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.addOrUpdateOrganization).to.eql({
      name: 'new org',
      subdomain: 'new',
      isPrivate: false,
      config: {
        mentorsDefault: [],
        urlGraphql: '/graphql',
      },
      members: [],
    });
    const organizations = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          organizations {
            edges {
              node {
                name
              }
            }
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(organizations.body.data.organizations).to.eql({
      edges: [
        {
          node: {
            name: 'new org',
          },
        },
        {
          node: {
            name: 'CSUF',
          },
        },
        {
          node: {
            name: 'USC',
          },
        },
      ],
    });
  });

  it('USER cannot edit organization', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea3'); //mentor with role "User"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateOrganization($id: ID, $organization: AddOrUpdateOrganizationInputType!) {
          me {
            addOrUpdateOrganization(id: $id, organization: $organization) {
              _id
              name
              subdomain
              isPrivate
              config {
                styleHeaderLogo
                styleHeaderColor
                styleHeaderTextColor  
              }
              members {
                user {
                  _id
                  name
                }
                role
              }
            }
          }
        }`,
        variables: {
          id: '511111111111111111111111',
          organization: {
            members: [],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'you do not have permission to edit organization'
    );
  });

  it('CONTENT_MANAGER cannot edit organization', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea4');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateOrganization($id: ID, $organization: AddOrUpdateOrganizationInputType!) {
          me {
            addOrUpdateOrganization(id: $id, organization: $organization) {
              _id
              name
              subdomain
              isPrivate
              config {
                styleHeaderLogo
                styleHeaderColor
                styleHeaderTextColor  
              }
              members {
                user {
                  _id
                  name
                }
                role
              }
            }
          }
        }`,
        variables: {
          id: '511111111111111111111112',
          organization: {
            members: [],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'you do not have permission to edit organization'
    );
  });

  it('ADMIN cannot edit organization', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea6');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateOrganization($id: ID, $organization: AddOrUpdateOrganizationInputType!) {
          me {
            addOrUpdateOrganization(id: $id, organization: $organization) {
              _id
              name
              subdomain
              isPrivate
              config {
                styleHeaderLogo
                styleHeaderColor
                styleHeaderTextColor  
              }
              members {
                user {
                  _id
                  name
                }
                role
              }
            }
          }
        }`,
        variables: {
          id: '511111111111111111111111',
          organization: {
            members: [],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'you do not have permission to edit organization'
    );
  });

  it('SUPER_CONTENT_MANAGER can update organization', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea5');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateOrganization($id: ID, $organization: AddOrUpdateOrganizationInputType!) {
          me {
            addOrUpdateOrganization(id: $id, organization: $organization) {
              name
              subdomain
              isPrivate
              config {
                mentorsDefault
                urlGraphql
              }
              members {
                user {
                  _id
                  name
                }
                role
              }
            }
          }
        }`,
        variables: {
          id: '511111111111111111111111',
          organization: {
            subdomain: 'updated',
            isPrivate: false,
            members: [{ user: '5ffdf41a1ee2c62320b49ea5', role: 'ADMIN' }],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.addOrUpdateOrganization).to.eql({
      name: 'USC',
      subdomain: 'updated',
      isPrivate: false,
      config: {
        mentorsDefault: [],
        urlGraphql: '/graphql',
      },
      members: [
        {
          user: {
            _id: '5ffdf41a1ee2c62320b49ea5',
            name: 'Jacob Ferguson',
          },
          role: 'ADMIN',
        },
      ],
    });
    const organizations = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          organizations {
            edges {
              node {
                name
                subdomain
              }
            }
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(organizations.body.data.organizations).to.eql({
      edges: [
        {
          node: {
            name: 'CSUF',
            subdomain: 'careerfair',
          },
        },
        {
          node: {
            name: 'USC',
            subdomain: 'updated',
          },
        },
      ],
    });
  });

  it('SUPER_ADMIN can update organization', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateOrganization($id: ID, $organization: AddOrUpdateOrganizationInputType!) {
          me {
            addOrUpdateOrganization(id: $id, organization: $organization) {
              name
              subdomain
              isPrivate
              config {
                mentorsDefault
                urlGraphql
              }
              members {
                user {
                  _id
                  name
                }
                role
              }
            }
          }
        }`,
        variables: {
          id: '511111111111111111111111',
          organization: {
            subdomain: 'updated',
            isPrivate: false,
            members: [{ user: '5ffdf41a1ee2c62320b49ea5', role: 'ADMIN' }],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.addOrUpdateOrganization).to.eql({
      name: 'USC',
      subdomain: 'updated',
      isPrivate: false,
      config: {
        mentorsDefault: [],
        urlGraphql: '/graphql',
      },
      members: [
        {
          user: {
            _id: '5ffdf41a1ee2c62320b49ea5',
            name: 'Jacob Ferguson',
          },
          role: 'ADMIN',
        },
      ],
    });
    const organizations = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          organizations {
            edges {
              node {
                name
                subdomain
              }
            }
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(organizations.body.data.organizations).to.eql({
      edges: [
        {
          node: {
            name: 'CSUF',
            subdomain: 'careerfair',
          },
        },
        {
          node: {
            name: 'USC',
            subdomain: 'updated',
          },
        },
      ],
    });
  });

  it('org USER cannot edit organization', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea3'); //mentor with role "User"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateOrganization($id: ID, $organization: AddOrUpdateOrganizationInputType!) {
          me {
            addOrUpdateOrganization(id: $id, organization: $organization) {
              _id
              name
              subdomain
              isPrivate
              config {
                styleHeaderLogo
                styleHeaderColor
                styleHeaderTextColor  
              }
              members {
                user {
                  _id
                  name
                }
                role
              }
            }
          }
        }`,
        variables: {
          id: '511111111111111111111111',
          organization: {
            members: [],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'you do not have permission to edit organization'
    );
  });

  it('org ADMIN can update organization', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateOrganization($id: ID, $organization: AddOrUpdateOrganizationInputType!) {
          me {
            addOrUpdateOrganization(id: $id, organization: $organization) {
              name
              subdomain
              isPrivate
              config {
                mentorsDefault
                urlGraphql
              }
              members {
                user {
                  _id
                  name
                }
                role
              }
            }
          }
        }`,
        variables: {
          id: '511111111111111111111111',
          organization: {
            subdomain: 'updated',
            isPrivate: false,
            members: [{ user: '5ffdf41a1ee2c62320b49ea5', role: 'ADMIN' }],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.addOrUpdateOrganization).to.eql({
      name: 'USC',
      subdomain: 'updated',
      isPrivate: false,
      config: {
        mentorsDefault: [],
        urlGraphql: '/graphql',
      },
      members: [
        {
          user: {
            _id: '5ffdf41a1ee2c62320b49ea5',
            name: 'Jacob Ferguson',
          },
          role: 'ADMIN',
        },
      ],
    });
    const organizations = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          organizations {
            edges {
              node {
                name
                subdomain
              }
            }
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(organizations.body.data.organizations).to.eql({
      edges: [
        {
          node: {
            name: 'CSUF',
            subdomain: 'careerfair',
          },
        },
        {
          node: {
            name: 'USC',
            subdomain: 'updated',
          },
        },
      ],
    });
  });

  it('org CONTENT_MANAGER can update organization', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea4');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateOrganization($id: ID, $organization: AddOrUpdateOrganizationInputType!) {
          me {
            addOrUpdateOrganization(id: $id, organization: $organization) {
              name
              subdomain
              isPrivate
              config {
                mentorsDefault
                urlGraphql
              }
              members {
                user {
                  _id
                  name
                }
                role
              }
            }
          }
        }`,
        variables: {
          id: '511111111111111111111111',
          organization: {
            name: 'Updated name',
            subdomain: 'usc',
            members: [{ user: '5ffdf41a1ee2c62320b49ea5', role: 'ADMIN' }],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.addOrUpdateOrganization).to.eql({
      name: 'Updated name',
      subdomain: 'usc',
      isPrivate: true,
      config: {
        mentorsDefault: [],
        urlGraphql: '/graphql',
      },
      members: [
        {
          user: {
            _id: '5ffdf41a1ee2c62320b49ea5',
            name: 'Jacob Ferguson',
          },
          role: 'ADMIN',
        },
      ],
    });
    const token2 = getToken('5ffdf41a1ee2c62320b49ea5');
    const organizations = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token2}`)
      .send({
        query: `query {
          organizations {
            edges {
              node {
                name
                subdomain
              }
            }
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(organizations.body.data.organizations).to.eql({
      edges: [
        {
          node: {
            name: 'CSUF',
            subdomain: 'careerfair',
          },
        },
        {
          node: {
            name: 'Updated name',
            subdomain: 'usc',
          },
        },
      ],
    });
  });

  it('when creating an organization, must have a name', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateOrganization($id: ID, $organization: AddOrUpdateOrganizationInputType!) {
          me {
            addOrUpdateOrganization(id: $id, organization: $organization) {
              _id
            }
          }
        }`,
        variables: {
          id: '',
          organization: {
            subdomain: 'newdev',
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'you must have an organization name'
    );
  });

  it('when creating an organization, must have a subdomain', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateOrganization($id: ID, $organization: AddOrUpdateOrganizationInputType!) {
          me {
            addOrUpdateOrganization(id: $id, organization: $organization) {
              _id
            }
          }
        }`,
        variables: {
          id: '',
          organization: {
            name: 'new',
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'you must have an organization subdomain'
    );
  });

  it('cannot use reserved subdomain name', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateOrganization($id: ID, $organization: AddOrUpdateOrganizationInputType!) {
          me {
            addOrUpdateOrganization(id: $id, organization: $organization) {
              _id
            }
          }
        }`,
        variables: {
          id: '',
          organization: {
            name: 'new',
            subdomain: 'newdev',
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'subdomain is reserved, please pick a different subdomain'
    );
  });

  it('cannot use taken subdomain name', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateOrganization($id: ID, $organization: AddOrUpdateOrganizationInputType!) {
          me {
            addOrUpdateOrganization(id: $id, organization: $organization) {
              _id
            }
          }
        }`,
        variables: {
          id: '',
          organization: {
            name: 'new',
            subdomain: 'usc',
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'subdomain is already in use, please pick a different subdomain'
    );
  });

  it('subdomain cannot be less than 3 characters', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateOrganization($id: ID, $organization: AddOrUpdateOrganizationInputType!) {
          me {
            addOrUpdateOrganization(id: $id, organization: $organization) {
              _id
            }
          }
        }`,
        variables: {
          id: '',
          organization: {
            name: 'a',
            subdomain: 'abcdefghijklmnopqrstuvwxyz',
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'subdomain must be lower-case, alpha-numerical, and 3-20 characters'
    );
  });

  it('subdomain cannot be more than 20 characters', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateOrganization($id: ID, $organization: AddOrUpdateOrganizationInputType!) {
          me {
            addOrUpdateOrganization(id: $id, organization: $organization) {
              _id
            }
          }
        }`,
        variables: {
          id: '',
          organization: {
            name: 'new',
            subdomain: 'abcdefghijklmnopqrstuvwxyz',
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'subdomain must be lower-case, alpha-numerical, and 3-20 characters'
    );
  });

  it('subdomain must be lowercase', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateOrganization($id: ID, $organization: AddOrUpdateOrganizationInputType!) {
          me {
            addOrUpdateOrganization(id: $id, organization: $organization) {
              _id
            }
          }
        }`,
        variables: {
          id: '',
          organization: {
            name: 'new',
            subdomain: 'Test',
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'subdomain must be lower-case, alpha-numerical, and 3-20 characters'
    );
  });

  it('subdomain cannot contain special characters', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateOrganization($id: ID, $organization: AddOrUpdateOrganizationInputType!) {
          me {
            addOrUpdateOrganization(id: $id, organization: $organization) {
              _id
            }
          }
        }`,
        variables: {
          id: '',
          organization: {
            name: 'new',
            subdomain: 'usc.',
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'subdomain must be lower-case, alpha-numerical, and 3-20 characters'
    );
  });

  it('can update accessCodes', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateOrganization($id: ID, $organization: AddOrUpdateOrganizationInputType!) {
          me {
            addOrUpdateOrganization(id: $id, organization: $organization) {
              isPrivate
              accessCodes
            }
          }
        }`,
        variables: {
          id: '511111111111111111111111',
          organization: {
            accessCodes: ['new'],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.addOrUpdateOrganization).to.eql({
      isPrivate: true,
      accessCodes: ['new'],
    });
    const organizations = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          organizations {
            edges {
              node {
                name
                accessCodes
              }
            }
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(organizations.body.data.organizations).to.eql({
      edges: [
        {
          node: {
            name: 'CSUF',
            accessCodes: [],
          },
        },
        {
          node: {
            name: 'USC',
            accessCodes: ['new'],
          },
        },
      ],
    });
  });
});
