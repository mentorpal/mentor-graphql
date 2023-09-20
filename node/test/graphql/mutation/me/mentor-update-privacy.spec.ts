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

describe('updateMentorPrivacy', () => {
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
        query: `mutation UpdateMentorPrivacy($mentorId: ID!, $isPrivate: Boolean!) {
          me {
            updateMentorPrivacy(mentorId: $mentorId, isPrivate: $isPrivate)
          }
        }`,
        variables: { mentorId: '5ffdf41a1ee2c62111111111', isPrivate: false },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Only authenticated users'
    );
  });

  it(`throws an error if no mentorId passed`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateMentorPrivacy($mentorId: ID!, $isPrivate: Boolean!) {
          me {
            updateMentorPrivacy(mentorId: $mentorId, isPrivate: $isPrivate)
          }
        }`,
        variables: { isPrivate: false },
      });
    expect(response.status).to.equal(500);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Variable "$mentorId" of required type "ID!" was not provided.'
    );
  });

  it(`throws an error if no isPrivate passed`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateMentorPrivacy($mentorId: ID!, $isPrivate: Boolean!) {
          me {
            updateMentorPrivacy(mentorId: $mentorId, isPrivate: $isPrivate)
          }
        }`,
        variables: { mentorId: '5ffdf41a1ee2c62111111111' },
      });
    expect(response.status).to.equal(500);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Variable "$isPrivate" of required type "Boolean!" was not provided.'
    );
  });

  it(`throws an error if invalid mentorId passed`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateMentorPrivacy($mentorId: ID!, $isPrivate: Boolean!) {
          me {
            updateMentorPrivacy(mentorId: $mentorId, isPrivate: $isPrivate)
          }
        }`,
        variables: { mentorId: '5ffdf41a1ee2c62111111211', isPrivate: false },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'invalid mentor id given'
    );
  });

  it("doesn't accept unaccepted fields", async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateMentorPrivacy($mentorId: ID!, $isPrivate: Boolean!, $test: String!) {
          me {
            updateMentorPrivacy(mentorId: $mentorId, isPrivate: $isPrivate, test: $test)
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          isPrivate: false,
          test: 'test',
        },
      });
    expect(response.status).to.equal(400);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Unknown argument "test" on field "MeMutation.updateMentorPrivacy".'
    );
  });

  it("doesn't accept invalid fields", async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateMentorPrivacy($mentorId: ID!, $isPrivate: Boolean!) {
          me {
            updateMentorPrivacy(mentorId: $mentorId, isPrivate: $isPrivate)
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          isPrivate: 'bad value',
        },
      });
    expect(response.status).to.equal(500);
  });

  it('returns false if the mentor is locked', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateMentorPrivacy($mentorId: ID!, $isPrivate: Boolean!) {
          me {
            updateMentorPrivacy(mentorId: $mentorId, isPrivate: $isPrivate)
          }
        }`,
        variables: { mentorId: '5ffdf41a1ee2c62119991114', isPrivate: true },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'data.me.updateMentorPrivacy',
      false
    );
  });

  it('updates mentor privacy for own mentor', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2');
    let mentor = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
            me {
              mentor {
                isPrivate
              }
            }
          }`,
      });
    expect(mentor.status).to.equal(200);
    expect(mentor.body.data.me.mentor).to.eql({
      isPrivate: false,
    });
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateMentorPrivacy($mentorId: ID!, $isPrivate: Boolean!) {
          me {
            updateMentorPrivacy(mentorId: $mentorId, isPrivate: $isPrivate)
          }
        }`,
        variables: { mentorId: '5ffdf41a1ee2c62111111113', isPrivate: true },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'data.me.updateMentorPrivacy',
      true
    );
    mentor = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
            me {
              mentor {
                isPrivate
              }
            }
          }`,
      });
    expect(mentor.status).to.equal(200);
    expect(mentor.body.data.me.mentor).to.eql({
      isPrivate: true,
    });
  });

  it('"USER"\'s cannot update other mentors privacy', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2'); //mentor with role "User"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateMentorPrivacy($mentorId: ID!, $isPrivate: Boolean!) {
          me {
            updateMentorPrivacy(mentorId: $mentorId, isPrivate: $isPrivate)
          }
        }`,
        variables: { mentorId: '5ffdf41a1ee2c62111111111', isPrivate: true },
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
        query: `mutation UpdateMentorPrivacy($mentorId: ID!, $isPrivate: Boolean!) {
          me {
            updateMentorPrivacy(mentorId: $mentorId, isPrivate: $isPrivate)
          }
        }`,
        variables: { mentorId: '5ffdf41a1ee2c62111111112', isPrivate: true },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.updateMentorPrivacy).to.eql(true);
  });

  it('"ADMIN"\'s can update other mentors details', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1'); //mentor with role "Content Manager"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateMentorPrivacy($mentorId: ID!, $isPrivate: Boolean!) {
          me {
            updateMentorPrivacy(mentorId: $mentorId, isPrivate: $isPrivate)
          }
        }`,
        variables: { mentorId: '5ffdf41a1ee2c62111111112', isPrivate: true },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.updateMentorPrivacy).to.eql(true);
  });

  it('org ADMIN can update other mentors privacy if part of ADMIN org', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateMentorPrivacy($mentorId: ID!, $isPrivate: Boolean!) {
          me {
            updateMentorPrivacy(mentorId: $mentorId, isPrivate: $isPrivate)
          }
        }`,
        variables: { mentorId: '5ffdf41a1ee2c62111111114', isPrivate: true },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.updateMentorPrivacy).to.eql(true);
  });

  it('updates mentor orgPermissions', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea7');
    let mentor = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
            me {
              mentor {
                isPrivate
                orgPermissions {
                  orgId
                  orgName
                  viewPermission
                  editPermission
                }
              }
            }
          }`,
      });
    expect(mentor.status).to.equal(200);
    expect(mentor.body.data.me.mentor).to.eql({
      isPrivate: true,
      orgPermissions: [
        {
          orgId: '511111111111111111111112',
          orgName: 'CSUF',
          viewPermission: 'SHARE',
          editPermission: 'NONE',
        },
        {
          orgId: '511111111111111111111111',
          orgName: 'USC',
          viewPermission: 'NONE',
          editPermission: 'ADMIN',
        },
      ],
    });
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateMentorPrivacy($mentorId: ID!, $isPrivate: Boolean!, $orgPermissions: [OrgPermissionInputType]) {
          me {
            updateMentorPrivacy(mentorId: $mentorId, isPrivate: $isPrivate, orgPermissions: $orgPermissions)
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111114',
          isPrivate: true,
          orgPermissions: [
            {
              org: '511111111111111111111111',
              viewPermission: 'HIDDEN',
              editPermission: 'NONE',
            },
          ],
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'data.me.updateMentorPrivacy',
      true
    );
    mentor = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
            me {
              mentor {
                isPrivate
                orgPermissions {
                  orgId
                  orgName
                  viewPermission
                  editPermission
                }
              }
            }
          }`,
      });
    expect(mentor.status).to.equal(200);
    expect(mentor.body.data.me.mentor).to.eql({
      isPrivate: true,
      orgPermissions: [
        {
          orgId: '511111111111111111111111',
          orgName: 'USC',
          viewPermission: 'HIDDEN',
          editPermission: 'NONE',
        },
      ],
    });
  });

  it('does not update mentor orgPermissions', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea7');
    let mentor = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
            me {
              mentor {
                isPrivate
                orgPermissions {
                  orgId
                  orgName
                  viewPermission
                  editPermission
                }
              }
            }
          }`,
      });
    expect(mentor.status).to.equal(200);
    expect(mentor.body.data.me.mentor).to.eql({
      isPrivate: true,
      orgPermissions: [
        {
          orgId: '511111111111111111111112',
          orgName: 'CSUF',
          viewPermission: 'SHARE',
          editPermission: 'NONE',
        },
        {
          orgId: '511111111111111111111111',
          orgName: 'USC',
          viewPermission: 'NONE',
          editPermission: 'ADMIN',
        },
      ],
    });
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateMentorPrivacy($mentorId: ID!, $isPrivate: Boolean!, $orgPermissions: [OrgPermissionInputType]) {
          me {
            updateMentorPrivacy(mentorId: $mentorId, isPrivate: $isPrivate, orgPermissions: $orgPermissions)
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111114',
          isPrivate: true,
          orgPermissions: undefined,
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'data.me.updateMentorPrivacy',
      true
    );
    mentor = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
            me {
              mentor {
                isPrivate
                orgPermissions {
                  orgId
                  orgName
                  viewPermission
                  editPermission
                }
              }
            }
          }`,
      });
    expect(mentor.status).to.equal(200);
    expect(mentor.body.data.me.mentor).to.eql({
      isPrivate: true,
      orgPermissions: [
        {
          orgId: '511111111111111111111112',
          orgName: 'CSUF',
          viewPermission: 'SHARE',
          editPermission: 'NONE',
        },
        {
          orgId: '511111111111111111111111',
          orgName: 'USC',
          viewPermission: 'NONE',
          editPermission: 'ADMIN',
        },
      ],
    });
  });
});
