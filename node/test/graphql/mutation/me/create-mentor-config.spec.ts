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

describe('Create Mentor Config', () => {
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
        query: `mutation MentorConfigCreateUpdate($mentorConfig: MentorConfigInputType!) {
          me {
            mentorConfigCreateUpdate(mentorConfig: $mentorConfig){
              configId
              subjects
              publiclyVisible
              orgPermissions {
                orgId
                viewPermission
                editPermission
              }
            }
          }
        }`,
        variables: {
          mentorConfig: {},
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Only authenticated users'
    );
  });

  it('Can create a mentor config', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation MentorConfigCreateUpdate($mentorConfig: MentorConfigInputType!) {
          me {
            mentorConfigCreateUpdate(mentorConfig: $mentorConfig){
              configId
              subjects
              publiclyVisible
              orgPermissions {
                orgId
                viewPermission
                editPermission
              }
            }
          }
        }`,
        variables: {
          mentorConfig: {
            configId: 'TestConfigId',
            subjects: ['TestSubject'],
            publiclyVisible: true,
            orgPermissions: [
              {
                org: '511111111111111111111112',
                viewPermission: 'SHARE',
                editPermission: 'SHARE',
              },
            ],
          },
        },
      });
    expect(response.status).to.equal(200);

    // confirm the document was created
    const response2 = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query FetchMentorConfig($mentorConfigId: ID!) {
          me {
            fetchMentorConfig(mentorConfigId: $mentorConfigId){
              configId
              subjects
              publiclyVisible
              orgPermissions {
                orgId
                viewPermission
                editPermission
              }
            }
          }
        }`,
        variables: {
          mentorConfigId:
            response.body.data.me.mentorConfigCreateUpdate.configId,
        },
      });
    console.log(response2.body, null, 2);
    expect(response2.status).to.equal(200);
    expect(response2.body.data.me.fetchMentorConfig).to.have.property(
      'configId',
      response.body.data.me.mentorConfigCreateUpdate.configId
    );
  });
});
