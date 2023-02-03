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

describe('deleteMentorPanel', () => {
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
        query: `mutation DeleteMentorPanel($id: ID!) {
          me {
            deleteMentorPanel(id: $id) {
              _id
            }
          }
        }`,
        variables: {
          id: '5ffdf41a1ee2c62111111111',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Only authenticated users'
    );
  });

  it(`throws an error if no id`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1'); //mentor with role "Admin"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation DeleteMentorPanel($id: ID) {
          me {
            deleteMentorPanel(id: $id) {
              _id
            }
          }
        }`,
      });
    expect(response.status).to.equal(400);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Variable "$id" of type "ID" used in position expecting type "ID!".'
    );
  });

  it(`throws an error if invalid id`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1'); //mentor with role "Admin"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation DeleteMentorPanel($id: ID!) {
          me {
            deleteMentorPanel(id: $id) {
              _id
            }
          }
        }`,
        variables: {
          id: '5ffdf41a1ee2c62111111112',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'invalid mentor panel'
    );
  });

  it('does not accept api key user', async () => {
    const response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: `mutation DeleteMentorPanel($id: ID!) {
          me {
            deleteMentorPanel(id: $id) {
              _id
            }
          }
        }`,
        variables: {
          id: '5ffdf41a1ee2c62111111111',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'you do not have permission to edit mentorpanel'
    );
  });

  it('does not accept USER', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation DeleteMentorPanel($id: ID!) {
          me {
            deleteMentorPanel(id: $id) {
              _id
            }
          }
        }`,
        variables: {
          id: '5ffdf41a1ee2c62111111111',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'you do not have permission to edit mentorpanel'
    );
  });

  it('CONTENT_MANAGER can delete mentorpanel', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea4'); //mentor with role "Content Manager"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation DeleteMentorPanel($id: ID!) {
          me {
            deleteMentorPanel(id: $id) {
              _id
            }
          }
        }`,
        variables: {
          id: '5ffdf41a1ee2c62111111111',
        },
      });
    expect(response.status).to.equal(200);
    const mentorpanels = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          mentorPanels {
            edges {
              node {
                title
              }
            }
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(mentorpanels.body.data.mentorPanels).to.eql({ edges: [] });
  });

  it('ADMIN can delete mentorpanel', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea6'); //mentor with role "Admin"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation DeleteMentorPanel($id: ID!) {
          me {
            deleteMentorPanel(id: $id) {
              _id
            }
          }
        }`,
        variables: {
          id: '5ffdf41a1ee2c62111111111',
        },
      });
    expect(response.status).to.equal(200);
    const mentorpanels = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          mentorPanels {
            edges {
              node {
                title
              }
            }
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(mentorpanels.body.data.mentorPanels).to.eql({ edges: [] });
  });

  it('SUPER_CONTENT_MANAGER can delete mentorpanel', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea5'); //mentor with role "Content Manager"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation DeleteMentorPanel($id: ID!) {
          me {
            deleteMentorPanel(id: $id) {
              _id
            }
          }
        }`,
        variables: {
          id: '5ffdf41a1ee2c62111111111',
        },
      });
    expect(response.status).to.equal(200);
    const mentorpanels = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          mentorPanels {
            edges {
              node {
                title
              }
            }
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(mentorpanels.body.data.mentorPanels).to.eql({ edges: [] });
  });

  it('SUPER_ADMIN can delete mentorpanel', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1'); //mentor with role "Admin"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation DeleteMentorPanel($id: ID!) {
          me {
            deleteMentorPanel(id: $id) {
              _id
            }
          }
        }`,
        variables: {
          id: '5ffdf41a1ee2c62111111111',
        },
      });
    expect(response.status).to.equal(200);
    const mentorpanels = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          mentorPanels {
            edges {
              node {
                title
              }
            }
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(mentorpanels.body.data.mentorPanels).to.eql({ edges: [] });
  });
});
