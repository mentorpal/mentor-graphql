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

describe('updateOrgConfig', () => {
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
        query: `mutation UpdateOrganizationConfig($id: ID!, $config: ConfigUpdateInputType!) {
          me {
            updateOrgConfig(id: $id, config: $config) {
              urlGraphql
              mentorsDefault
            }
          }
        }`,
        variables: {
          id: '511111111111111111111112',
          config: {
            mentorsDefault: ['test'],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Only authenticated users'
    );
  });

  it('does not accept api key user', async () => {
    const response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: `mutation UpdateOrganizationConfig($id: ID!, $config: ConfigUpdateInputType!) {
          me {
            updateOrgConfig(id: $id, config: $config) {
              urlGraphql
              mentorsDefault
            }
          }
        }`,
        variables: {
          id: '511111111111111111111112',
          config: {
            mentorsDefault: ['test'],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'you do not have permission to edit organization'
    );
  });

  it(`throws an error if invalid id`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateOrganizationConfig($id: ID!, $config: ConfigUpdateInputType!) {
          me {
            updateOrgConfig(id: $id, config: $config) {
              urlGraphql
              mentorsDefault
            }
          }
        }`,
        variables: {
          id: '511111111111111111111113',
          config: {
            mentorsDefault: ['test'],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'invalid organization id'
    );
  });

  it('USER cannot edit config', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea3');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateOrganizationConfig($id: ID!, $config: ConfigUpdateInputType!) {
          me {
            updateOrgConfig(id: $id, config: $config) {
              urlGraphql
              mentorsDefault
            }
          }
        }`,
        variables: {
          id: '511111111111111111111112',
          config: {
            mentorsDefault: ['test'],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'you do not have permission to edit organization'
    );
  });

  it('CONTENT_MANAGER cannot edit config', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea4');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateOrganizationConfig($id: ID!, $config: ConfigUpdateInputType!) {
          me {
            updateOrgConfig(id: $id, config: $config) {
              urlGraphql
              mentorsDefault
            }
          }
        }`,
        variables: {
          id: '511111111111111111111112',
          config: {
            mentorsDefault: ['test'],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'you do not have permission to edit organization'
    );
  });

  it('ADMIN cannot edit config', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea6');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateOrganizationConfig($id: ID!, $config: ConfigUpdateInputType!) {
          me {
            updateOrgConfig(id: $id, config: $config) {
              urlGraphql
              mentorsDefault
            }
          }
        }`,
        variables: {
          id: '511111111111111111111112',
          config: {
            mentorsDefault: ['test'],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'you do not have permission to edit organization'
    );
  });

  it('SUPER_CONTENT_MANAGER can update config', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea5');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateOrganizationConfig($id: ID!, $config: ConfigUpdateInputType!) {
          me {
            updateOrgConfig(id: $id, config: $config) {
              urlGraphql
              mentorsDefault
            }
          }
        }`,
        variables: {
          id: '511111111111111111111111',
          config: {
            mentorsDefault: ['test'],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.updateOrgConfig).to.eql({
      urlGraphql: '/graphql',
      mentorsDefault: ['test'],
    });
    const org = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          organization(id: "511111111111111111111111") {
            config {
              urlGraphql
              mentorsDefault
            }
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(org.body.data.organization).to.eql({
      config: {
        urlGraphql: '/graphql',
        mentorsDefault: ['test'],
      },
    });
  });

  it('SUPER_ADMIN can update config', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateOrganizationConfig($id: ID!, $config: ConfigUpdateInputType!) {
          me {
            updateOrgConfig(id: $id, config: $config) {
              urlGraphql
              mentorsDefault
            }
          }
        }`,
        variables: {
          id: '511111111111111111111111',
          config: {
            mentorsDefault: ['test'],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.updateOrgConfig).to.eql({
      urlGraphql: '/graphql',
      mentorsDefault: ['test'],
    });
    const org = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          organization(id: "511111111111111111111111") {
            config {
              urlGraphql
              mentorsDefault
            }
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(org.body.data.organization).to.eql({
      config: {
        urlGraphql: '/graphql',
        mentorsDefault: ['test'],
      },
    });
  });

  it('org USER cannot edit config', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea3');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateOrganizationConfig($id: ID!, $config: ConfigUpdateInputType!) {
          me {
            updateOrgConfig(id: $id, config: $config) {
              urlGraphql
              mentorsDefault
            }
          }
        }`,
        variables: {
          id: '511111111111111111111111',
          config: {
            mentorsDefault: ['test'],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'you do not have permission to edit organization'
    );
  });

  it('org CONTENT_MANAGER can update config', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea4');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateOrganizationConfig($id: ID!, $config: ConfigUpdateInputType!) {
          me {
            updateOrgConfig(id: $id, config: $config) {
              urlGraphql
              mentorsDefault
            }
          }
        }`,
        variables: {
          id: '511111111111111111111111',
          config: {
            mentorsDefault: ['test'],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.updateOrgConfig).to.eql({
      urlGraphql: '/graphql',
      mentorsDefault: ['test'],
    });
    const org = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          organization(id: "511111111111111111111111") {
            config {
              urlGraphql
              mentorsDefault
            }
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(org.body.data.organization).to.eql({
      config: {
        urlGraphql: '/graphql',
        mentorsDefault: ['test'],
      },
    });
  });

  it('org ADMIN can update config', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateOrganizationConfig($id: ID!, $config: ConfigUpdateInputType!) {
          me {
            updateOrgConfig(id: $id, config: $config) {
              urlGraphql
              mentorsDefault
            }
          }
        }`,
        variables: {
          id: '511111111111111111111111',
          config: {
            mentorsDefault: ['test'],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.updateOrgConfig).to.eql({
      urlGraphql: '/graphql',
      mentorsDefault: ['test'],
    });
    const org = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          organization(id: "511111111111111111111111") {
            config {
              urlGraphql
              mentorsDefault
            }
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(org.body.data.organization).to.eql({
      config: {
        urlGraphql: '/graphql',
        mentorsDefault: ['test'],
      },
    });
  });
});
