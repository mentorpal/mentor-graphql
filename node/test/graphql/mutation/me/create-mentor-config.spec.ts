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
                org
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
              lockedToSubjects
              publiclyVisible
              orgPermissions {
                org
                viewPermission
                editPermission
              }
              loginHeaderText
              welcomeSlideHeader
              welcomeSlideText
              disableMyGoalSlide
              disableFollowups
              disableKeywordsRecommendation
              disableThumbnailRecommendation
              disableLevelProgressDisplay
              completeSubjectsNotificationText
              recordTimeLimitSeconds
            }
          }
        }`,
        variables: {
          mentorConfig: {
            configId: 'TestConfigId',
            subjects: ['TestSubject'],
            lockedToSubjects: true,
            publiclyVisible: true,
            orgPermissions: [
              {
                org: '511111111111111111111112',
                viewPermission: 'SHARE',
                editPermission: 'SHARE',
              },
            ],
            loginHeaderText: 'TestLoginHeaderText',
            welcomeSlideHeader: 'TestWelcomeSlideHeader',
            welcomeSlideText: 'TestWelcomeSlideText',
            disableMyGoalSlide: true,
            disableFollowups: true,
            disableKeywordsRecommendation: true,
            disableThumbnailRecommendation: true,
            disableLevelProgressDisplay: true,
            completeSubjectsNotificationText:
              'TestCompleteSubjectsNotificationText',
            recordTimeLimitSeconds: 100,
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
            fetchMentorConfig(mentorConfigId: $mentorConfigId){
              configId
              subjects
              lockedToSubjects
              publiclyVisible
              orgPermissions {
                org
                viewPermission
                editPermission
              }
              loginHeaderText
              welcomeSlideHeader
              welcomeSlideText
              disableMyGoalSlide
              disableFollowups
              disableKeywordsRecommendation
              disableThumbnailRecommendation
              disableLevelProgressDisplay
              completeSubjectsNotificationText
              recordTimeLimitSeconds
            }
        }`,
        variables: {
          mentorConfigId:
            response.body.data.me.mentorConfigCreateUpdate.configId,
        },
      });
    expect(response2.status).to.equal(200);
    expect(response2.body.data.fetchMentorConfig).to.have.property(
      'configId',
      response.body.data.me.mentorConfigCreateUpdate.configId
    );
    expect(
      response2.body.data.fetchMentorConfig.subjects
    ).to.deep.include.members(['TestSubject']);
    expect(response2.body.data.fetchMentorConfig).to.have.property(
      'publiclyVisible',
      true
    );
    expect(
      response2.body.data.fetchMentorConfig.orgPermissions[0].org
    ).to.equal('511111111111111111111112');
    expect(
      response2.body.data.fetchMentorConfig.orgPermissions[0].viewPermission
    ).to.equal('SHARE');
    expect(
      response2.body.data.fetchMentorConfig.orgPermissions[0].editPermission
    ).to.equal('SHARE');
    expect(response2.body.data.fetchMentorConfig.loginHeaderText).to.equal(
      'TestLoginHeaderText'
    );
    expect(response2.body.data.fetchMentorConfig.welcomeSlideText).to.equal(
      'TestWelcomeSlideText'
    );
    expect(response2.body.data.fetchMentorConfig.welcomeSlideHeader).to.equal(
      'TestWelcomeSlideHeader'
    );
    expect(response2.body.data.fetchMentorConfig.disableFollowups).to.equal(
      true
    );
    expect(response2.body.data.fetchMentorConfig.disableMyGoalSlide).to.equal(
      true
    );
    expect(
      response2.body.data.fetchMentorConfig.disableKeywordsRecommendation
    ).to.equal(true);
    expect(
      response2.body.data.fetchMentorConfig.disableThumbnailRecommendation
    ).to.equal(true);
    expect(
      response2.body.data.fetchMentorConfig.disableLevelProgressDisplay
    ).to.equal(true);
    expect(
      response2.body.data.fetchMentorConfig.completeSubjectsNotificationText
    ).to.equal('TestCompleteSubjectsNotificationText');
    expect(
      response2.body.data.fetchMentorConfig.recordTimeLimitSeconds
    ).to.equal(100);
    expect(response2.body.data.fetchMentorConfig.lockedToSubjects).to.equal(
      true
    );
  });
});
