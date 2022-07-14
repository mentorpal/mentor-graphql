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

describe('addOrUpdateMentorPanel', () => {
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
        query: `mutation AddOrUpdateMentorPanel($id: ID, $mentorPanel: AddOrUpdateMentorPanelInputType!) {
          me {
            addOrUpdateMentorPanel(id: $id, mentorPanel: $mentorPanel) {
              _id
              subject
              mentors
              title
              subtitle
            }
          }
        }`,
        variables: {
          id: '',
          mentorPanel: {
            subject: '5ffdf41a1ee2c62320b49eb1',
            title: 'New Panel',
            subtitle: 'New Panel',
            mentors: ['5ffdf41a1ee2c62111111119'],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Only authenticated users'
    );
  });

  it(`throws an error if no mentorPanel`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `mutation AddOrUpdateMentorPanel($id: ID, $mentorPanel: AddOrUpdateMentorPanelInputType) {
          me {
            addOrUpdateMentorPanel(id: $id, mentorPanel: $mentorPanel) {
              _id
              subject
              mentors
              title
              subtitle
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
        query: `mutation AddOrUpdateMentorPanel($id: ID, $mentorPanel: AddOrUpdateMentorPanelInputType!) {
          me {
            addOrUpdateMentorPanel(id: $id, mentorPanel: $mentorPanel) {
              _id
              subject
              mentors
              title
              subtitle
            }
          }
        }`,
        variables: {
          id: '',
          mentorPanel: {
            subject: '5ffdf41a1ee2c62320b49eb1',
            title: 'New Panel',
            subtitle: 'New Panel',
            mentors: ['5ffdf41a1ee2c62111111119'],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'you do not have permission to add or edit mentorpanel'
    );
  });

  it('does not accept USER', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2'); //mentor with role "User"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateMentorPanel($id: ID, $mentorPanel: AddOrUpdateMentorPanelInputType!) {
          me {
            addOrUpdateMentorPanel(id: $id, mentorPanel: $mentorPanel) {
              _id
              subject
              mentors
              title
              subtitle
            }
          }
        }`,
        variables: {
          id: '',
          mentorPanel: {
            subject: '5ffdf41a1ee2c62320b49eb1',
            title: 'New Panel',
            subtitle: 'New Panel',
            mentors: ['5ffdf41a1ee2c62111111119'],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'you do not have permission to add or edit mentorpanel'
    );
  });

  it('CONTENT_MANAGER can create mentorpanel', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea5'); //mentor with role "Content Manager"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateMentorPanel($id: ID, $mentorPanel: AddOrUpdateMentorPanelInputType!) {
          me {
            addOrUpdateMentorPanel(id: $id, mentorPanel: $mentorPanel) {
              _id
              subject
              mentors
              title
              subtitle
            }
          }
        }`,
        variables: {
          mentorPanel: {
            subject: '5ffdf41a1ee2c62320b49eb1',
            title: 'New Panel',
            subtitle: 'New Panel',
            mentors: ['5ffdf41a1ee2c62111111119'],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.addOrUpdateMentorPanel.subject).to.eql(
      '5ffdf41a1ee2c62320b49eb1'
    );
    expect(response.body.data.me.addOrUpdateMentorPanel.title).to.eql(
      'New Panel'
    );
    expect(response.body.data.me.addOrUpdateMentorPanel.subtitle).to.eql(
      'New Panel'
    );
    expect(response.body.data.me.addOrUpdateMentorPanel.mentors).to.eql([
      '5ffdf41a1ee2c62111111119',
    ]);
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
    expect(mentorpanels.body.data.mentorPanels).to.eql({
      edges: [
        {
          node: {
            title: 'fake panel title',
          },
        },
        {
          node: {
            title: 'New Panel',
          },
        },
      ],
    });
  });

  it('ADMIN can create mentorpanel', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1'); //mentor with role "Admin"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateMentorPanel($id: ID, $mentorPanel: AddOrUpdateMentorPanelInputType!) {
          me {
            addOrUpdateMentorPanel(id: $id, mentorPanel: $mentorPanel) {
              _id
              subject
              mentors
              title
              subtitle
            }
          }
        }`,
        variables: {
          mentorPanel: {
            subject: '5ffdf41a1ee2c62320b49eb1',
            title: 'New Panel',
            subtitle: 'New Panel',
            mentors: ['5ffdf41a1ee2c62111111119'],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.addOrUpdateMentorPanel.subject).to.eql(
      '5ffdf41a1ee2c62320b49eb1'
    );
    expect(response.body.data.me.addOrUpdateMentorPanel.title).to.eql(
      'New Panel'
    );
    expect(response.body.data.me.addOrUpdateMentorPanel.subtitle).to.eql(
      'New Panel'
    );
    expect(response.body.data.me.addOrUpdateMentorPanel.mentors).to.eql([
      '5ffdf41a1ee2c62111111119',
    ]);
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
    expect(mentorpanels.body.data.mentorPanels).to.eql({
      edges: [
        {
          node: {
            title: 'fake panel title',
          },
        },
        {
          node: {
            title: 'New Panel',
          },
        },
      ],
    });
  });

  it('CONTENT_MANAGER can update mentorpanel', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea5'); //mentor with role "Content Manager"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateMentorPanel($id: ID, $mentorPanel: AddOrUpdateMentorPanelInputType!) {
          me {
            addOrUpdateMentorPanel(id: $id, mentorPanel: $mentorPanel) {
              _id
              subject
              mentors
              title
              subtitle
            }
          }
        }`,
        variables: {
          id: '5ffdf41a1ee2c62111111111',
          mentorPanel: {
            title: 'Updated',
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.addOrUpdateMentorPanel).to.eql({
      _id: '5ffdf41a1ee2c62111111111',
      subject: '5ffdf41a1ee2c62320b49eb3',
      mentors: ['5ffdf41a1ee2c62111111112'],
      title: 'Updated',
      subtitle: 'fake panel subtitle',
    });
  });

  it('ADMIN can update mentorpanel', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1'); //mentor with role "Admin"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateMentorPanel($id: ID, $mentorPanel: AddOrUpdateMentorPanelInputType!) {
          me {
            addOrUpdateMentorPanel(id: $id, mentorPanel: $mentorPanel) {
              _id
              subject
              mentors
              title
              subtitle
            }
          }
        }`,
        variables: {
          id: '5ffdf41a1ee2c62111111111',
          mentorPanel: {
            title: 'Updated',
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.addOrUpdateMentorPanel).to.eql({
      _id: '5ffdf41a1ee2c62111111111',
      subject: '5ffdf41a1ee2c62320b49eb3',
      mentors: ['5ffdf41a1ee2c62111111112'],
      title: 'Updated',
      subtitle: 'fake panel subtitle',
    });
  });
});
