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

describe('updateMentorDetails', () => {
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
        query: `mutation UpdateMentorDetails($mentor: UpdateMentorDetailsType!) {
          me {
            updateMentorDetails(mentor: $mentor)
          }
        }`,
        variables: { mentor: {} },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Only authenticated users'
    );
  });

  it(`throws an error if user does not have a mentor`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea4');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateMentorDetails($mentor: UpdateMentorDetailsType!) {
          me {
            updateMentorDetails(mentor: $mentor)
          }
        }`,
        variables: { mentor: {} },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'you do not have a mentor'
    );
  });

  it(`throws an error if no mentor update passed`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateMentorDetails($mentor: UpdateMentorDetailsType!) {
          me {
            updateMentorDetails
          }
        }`,
        variables: {},
      });
    expect(response.status).to.equal(400);
  });

  it('updates mentor details', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateMentorDetails($mentor: UpdateMentorDetailsType!) {
          me {
            updateMentorDetails(mentor: $mentor)
          }
        }`,
        variables: {
          mentor: {
            name: 'Updated name',
            firstName: 'Updated firstName',
            title: 'Updated title',
            email: 'Updated email',
            mentorType: 'Updated mentorType',
            hasVirtualBackground: true,
            virtualBackgroundUrl: 'https://www.fakeurl.com/',
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'data.me.updateMentorDetails',
      true
    );
    const mentor = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
            me {
              mentor {
                _id
                name
                firstName
                title
                email
                mentorType
                hasVirtualBackground
                virtualBackgroundUrl
              }
            }
          }`,
      });
    expect(mentor.status).to.equal(200);
    expect(mentor.body.data.me.mentor).to.eql({
      _id: '5ffdf41a1ee2c62111111111',
      name: 'Updated name',
      firstName: 'Updated firstName',
      title: 'Updated title',
      email: 'Updated email',
      mentorType: 'Updated mentorType',
      hasVirtualBackground: true,
      virtualBackgroundUrl: 'https://www.fakeurl.com/',
    });
  });

  it('updates a single field', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateMentorDetails($mentor: UpdateMentorDetailsType!) {
          me {
            updateMentorDetails(mentor: $mentor)
          }
        }`,
        variables: { mentor: { name: 'Updated Name' } },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'data.me.updateMentorDetails',
      true
    );
    const mentor = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
            me {
              mentor {
                _id
                name
                title
              }
            }
          }`,
      });
    expect(mentor.status).to.equal(200);
    expect(mentor.body.data.me.mentor).to.eql({
      _id: '5ffdf41a1ee2c62111111111',
      name: 'Updated Name',
      title: "Nuclear Electrician's Mate",
    });
  });

  it("doesn't accept unaccepted fields", async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateMentorDetails($mentor: UpdateMentorDetailsType!) {
          me {
            updateMentorDetails(mentor: $mentor)
          }
        }`,
        variables: { mentor: { lastTrainedAt: 'asdf' } },
      });
    expect(response.status).to.equal(500);
  });

  it("doesn't accept invalid fields", async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateMentorDetails($mentor: UpdateMentorDetailsType!) {
          me {
            updateMentorDetails(mentor: $mentor)
          }
        }`,
        variables: { mentor: { name: {} } },
      });
    expect(response.status).to.equal(500);
  });

  it('"USER"\'s cannot update other mentors details', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2'); //mentor with role "User"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateMentorDetails($mentor: UpdateMentorDetailsType!, $mentorId: ID!) {
          me {
            updateMentorDetails(mentor: $mentor, mentorId: $mentorId)
          }
        }`,
        variables: { mentor: {}, mentorId: '5ffdf41a1ee2c62111111112' },
      });
    expect(response.status).to.equal(200);
    expect(response.body.errors[0].message).to.equal(
      'you do not have permission to edit this mentor'
    );
  });

  it('"CONTENT_MANAGER"\'s can update other mentors details', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea5'); //mentor with role "Content Manager"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateMentorDetails($mentor: UpdateMentorDetailsType!, $mentorId: ID!) {
          me {
            updateMentorDetails(mentor: $mentor, mentorId: $mentorId)
          }
        }`,
        variables: { mentor: {}, mentorId: '5ffdf41a1ee2c62111111112' },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.updateMentorDetails).to.eql(true);
  });

  it('"ADMIN"\'s can update other mentors details', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1'); //mentor with role "Content Manager"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateMentorDetails($mentor: UpdateMentorDetailsType!, $mentorId: ID!) {
          me {
            updateMentorDetails(mentor: $mentor, mentorId: $mentorId)
          }
        }`,
        variables: { mentor: {}, mentorId: '5ffdf41a1ee2c62111111112' },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.updateMentorDetails).to.eql(true);
  });
});
