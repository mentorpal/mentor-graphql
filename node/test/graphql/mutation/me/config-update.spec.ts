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

describe('updateConfig', () => {
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
        query: `mutation UpdateConfigFeatured($config: ConfigUpdateInputType!) {
          me {
            updateConfig(config: $config) {
              mentorsDefault
              featuredMentors
              featuredMentorPanels
              activeMentors
            }
          }
        }`,
        variables: { config: {} },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Only authenticated users'
    );
  });

  it(`throws an error if no config`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `mutation UpdateConfigFeatured($config: ConfigUpdateInputType) {
          me {
            updateConfig(config: $config) {
              mentorsDefault
              featuredMentors
              featuredMentorPanels
              activeMentors
            }
          }
        }`,
        variables: {},
      });
    expect(response.status).to.equal(400);
  });

  it('does not accept api key user', async () => {
    const response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: `mutation UpdateConfigFeatured($config: ConfigUpdateInputType!) {
          me {
            updateConfig(config: $config) {
              mentorsDefault
              featuredMentors
              featuredMentorPanels
              activeMentors
            }
          }
        }`,
        variables: { config: {} },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'you do not have permission to edit config'
    );
  });

  it('does not accept USER', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2'); //mentor with role "User"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateConfigFeatured($config: ConfigUpdateInputType!) {
          me {
            updateConfig(config: $config) {
              mentorsDefault
              featuredMentors
              featuredMentorPanels
              activeMentors
            }
          }
        }`,
        variables: { config: {} },
      });
    expect(response.status).to.equal(200);
    expect(response.body.errors[0].message).to.equal(
      'you do not have permission to edit config'
    );
  });

  it('CONTENT_MANAGER can update config featured mentors', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea5'); //mentor with role "Content Manager"
    let response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateConfigFeatured($config: ConfigUpdateInputType!) {
          me {
            updateConfig(config: $config) {
              mentorsDefault
              featuredMentors
              featuredMentorPanels
              activeMentors
              filterEmailMentorAddress
            }
          }
        }`,
        variables: {
          config: {
            featuredMentors: ['5ffdf41a1ee2c62111111119'],
            featuredMentorPanels: ['5ffdf41a1ee2c62111111111'],
            filterEmailMentorAddress: 'hello@gmail.com',
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.updateConfig).to.eql({
      activeMentors: ['5ffdf41a1ee2c62111111119'],
      featuredMentorPanels: ['5ffdf41a1ee2c62111111111'],
      featuredMentors: ['5ffdf41a1ee2c62111111119'],
      mentorsDefault: [],
      filterEmailMentorAddress: 'hello@gmail.com',
    });
    response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateConfigFeatured($config: ConfigUpdateInputType!) {
        me {
          updateConfig(config: $config) {
            mentorsDefault
            featuredMentors
            featuredMentorPanels
            activeMentors
            filterEmailMentorAddress
          }
        }
      }`,
        variables: {
          config: {
            activeMentors: ['5ffdf41a1ee2c62111111119'],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.updateConfig).to.eql({
      activeMentors: ['5ffdf41a1ee2c62111111119'],
      featuredMentorPanels: ['5ffdf41a1ee2c62111111111'],
      featuredMentors: ['5ffdf41a1ee2c62111111119'],
      mentorsDefault: [],
      filterEmailMentorAddress: 'hello@gmail.com',
    });
  });

  it('ADMIN can update config featured mentors', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1'); //mentor with role "Admin"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateConfigFeatured($config: ConfigUpdateInputType!) {
          me {
            updateConfig(config: $config) {
              mentorsDefault
              featuredMentors
              featuredMentorPanels
              activeMentors
            }
          }
        }`,
        variables: {
          config: {
            featuredMentors: ['5ffdf41a1ee2c62111111119'],
            featuredMentorPanels: ['5ffdf41a1ee2c62111111111'],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.updateConfig).to.eql({
      activeMentors: ['5ffdf41a1ee2c62111111119'],
      featuredMentorPanels: ['5ffdf41a1ee2c62111111111'],
      featuredMentors: ['5ffdf41a1ee2c62111111119'],
      mentorsDefault: [],
    });
  });

  it('CONTENT_MANAGER can update config styles', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea5'); //mentor with role "Content Manager"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateConfigFeatured($config: ConfigUpdateInputType!) {
          me {
            updateConfig(config: $config) {
              mentorsDefault
              featuredMentors
              featuredMentorPanels
              activeMentors
              styleHeaderLogo
              styleHeaderColor
              styleHeaderText
              styleHeaderTextColor
            }
          }
        }`,
        variables: {
          config: {
            styleHeaderLogo: 'test',
            styleHeaderColor: 'test',
            styleHeaderText: 'test',
            styleHeaderTextColor: 'test',
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.updateConfig).to.eql({
      activeMentors: ['5ffdf41a1ee2c62111111119'],
      featuredMentorPanels: [],
      featuredMentors: [],
      mentorsDefault: [],
      styleHeaderLogo: 'test',
      styleHeaderColor: 'test',
      styleHeaderText: 'test',
      styleHeaderTextColor: 'test',
    });
  });

  it('CONTENT_MANAGER can update config disclaimer', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea5'); //mentor with role "Content Manager"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateConfigFeatured($config: ConfigUpdateInputType!) {
          me {
            updateConfig(config: $config) {
              mentorsDefault
              featuredMentors
              featuredMentorPanels
              activeMentors
              activeMentorPanels
              styleHeaderLogo
              styleHeaderColor
              styleHeaderTextColor
              disclaimerTitle
              disclaimerText
              disclaimerDisabled
            }
          }
        }`,
        variables: {
          config: {
            disclaimerTitle: 'test',
            disclaimerText: 'test',
            disclaimerDisabled: false,
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.updateConfig).to.eql({
      activeMentors: ['5ffdf41a1ee2c62111111119'],
      activeMentorPanels: ['5ffdf41a1ee2c62111111111'],
      featuredMentorPanels: [],
      featuredMentors: [],
      mentorsDefault: [],
      styleHeaderLogo: '',
      styleHeaderColor: '#025a87',
      styleHeaderTextColor: '#ffffff',
      disclaimerTitle: 'test',
      disclaimerText: 'test',
      disclaimerDisabled: false,
    });
  });
});
