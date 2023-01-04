/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import createApp, { appStart, appStop } from 'app';
import { expect } from 'chai';
import { Express } from 'express';
import { describe } from 'mocha';
import mongoUnit from 'mongo-unit';
import request from 'supertest';
import SettingModel, { Config } from 'models/Setting';

describe('config', () => {
  let app: Express;
  let ENV_GOOGLE_CLIENT_ID_RESTORE: string = '';

  beforeEach(async () => {
    ENV_GOOGLE_CLIENT_ID_RESTORE = process.env.GOOGLE_CLIENT_ID;
    await mongoUnit.load(require('test/fixtures/mongodb/data-default.js'));
    app = await createApp();
    await appStart();
  });

  afterEach(async () => {
    if (typeof ENV_GOOGLE_CLIENT_ID_RESTORE === 'string') {
      process.env.GOOGLE_CLIENT_ID = ENV_GOOGLE_CLIENT_ID_RESTORE || undefined;
    } else {
      delete process.env['GOOGLE_CLIENT_ID'];
    }
    await appStop();
    await mongoUnit.drop();
  });

  it(`serves default config when no settings`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          config {
            cmi5Enabled
            cmi5Endpoint
            cmi5Fetch
            googleClientId
            mentorsDefault
            featuredMentors
            featuredMentorPanels
            activeMentors
            urlGraphql
            urlVideo
            styleHeaderLogo
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data?.config).to.eql({
      cmi5Enabled: false,
      cmi5Endpoint: '',
      cmi5Fetch: '',
      googleClientId: '',
      mentorsDefault: [],
      featuredMentors: [],
      featuredMentorPanels: [],
      activeMentors: [],
      urlGraphql: '/graphql',
      urlVideo: '/video',
      styleHeaderLogo: '',
    });
  });

  it(`serves googleClientId config from env when no settings`, async () => {
    process.env.GOOGLE_CLIENT_ID = 'clientIdSetByEnv';
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          config {
            googleClientId
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data?.config).to.eql({
      googleClientId: 'clientIdSetByEnv',
    });
  });

  it(`serves googleClientId config from settings as an override to env va`, async () => {
    process.env.GOOGLE_CLIENT_ID = 'clientIdSetByEnv';
    await SettingModel.saveConfig({
      googleClientId: 'clientIdSetBySettings',
    });
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          config {
            googleClientId
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data?.config).to.eql({
      googleClientId: 'clientIdSetBySettings',
    });
  });

  it(`serves config from Settings`, async () => {
    const config: Config = {
      cmi5Enabled: true,
      cmi5Endpoint: '/xapi',
      cmi5Fetch: '/auth',
      googleClientId: '',
      mentorsDefault: ['somementor'],
      virtualBackgroundUrls: ['https://some/custom/url'],
      defaultVirtualBackground: 'https://some/custom/url',
      urlGraphql: '/graphql/v2',
      urlVideo: '/video/v2',
      urlDocSetup: 'https://some/custom/url',
      urlVideoIdleTips: 'https://some/custom/url',
      subjectRecordPriority: ['subj_id_1'],
      urlVideoMentorpalWalkthrough: 'https://fakewalkthroughurl.com',
      classifierLambdaEndpoint: 'https://fakelambdaurl.com',
      graphqlLambdaEndpoint: 'https://fakegraphqllambda.com',
      uploadLambdaEndpoint: 'https://faketransferlambdaurl.com',
      filterEmailMentorAddress: 'fakeemail@gmail.com',
      videoRecorderMaxLength: 300,
      // home style settings
      styleHeaderTitle: '',
      styleHeaderText: '',
      styleHeaderColor: '',
      styleHeaderTextColor: '',
      styleHeaderLogo: '/a/logo.png',
      styleHeaderLogoUrl: '',
      homeFooterColor: '',
      homeFooterTextColor: '',
      homeFooterImages: [],
      homeFooterLinks: [],
      homeBannerColor: '',
      homeBannerButtonColor: '',
      homeCarouselColor: '',
      walkthroughDisabled: false,
      walkthroughTitle: '',
      disclaimerDisabled: false,
      disclaimerTitle: '',
      disclaimerText: '',
      termsOfServiceDisabled: false,
      termsOfServiceText: '',
      displayGuestPrompt: false,
      guestPromptTitle: '',
      guestPromptText: '',
      guestPromptInputType: 'email',
      activeMentors: ['somementor'],
      activeMentorPanels: ['somementorpanel'],
      featuredMentors: ['somementor'],
      featuredMentorPanels: ['somementorpanel'],
      featuredSubjects: [],
      featuredKeywordTypes: [],
      defaultSubject: '',
      questionSortOrder: 0,
    };
    await SettingModel.saveConfig(config);
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          config {
            cmi5Enabled
            cmi5Endpoint
            cmi5Fetch
            classifierLambdaEndpoint
            uploadLambdaEndpoint
            graphqlLambdaEndpoint
            subjectRecordPriority
            filterEmailMentorAddress
            videoRecorderMaxLength
            googleClientId
            virtualBackgroundUrls
            defaultVirtualBackground
            questionSortOrder
            urlGraphql
            urlVideo
            urlDocSetup
            urlVideoIdleTips
            mentorsDefault
            styleHeaderTitle
            styleHeaderText
            styleHeaderColor
            styleHeaderTextColor
            styleHeaderLogo
            styleHeaderLogoUrl
            homeFooterColor
            homeFooterTextColor
            homeFooterImages
            homeFooterLinks
            homeBannerColor
            homeBannerButtonColor
            homeCarouselColor
            walkthroughDisabled
            walkthroughTitle
            urlVideoMentorpalWalkthrough
            disclaimerDisabled
            disclaimerTitle
            disclaimerText
            termsOfServiceDisabled
            termsOfServiceText
            displayGuestPrompt
            guestPromptTitle
            guestPromptText
            guestPromptInputType
            activeMentors
            activeMentorPanels
            featuredMentors
            featuredMentorPanels
            featuredSubjects
            featuredKeywordTypes
            defaultSubject
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data).to.eql({
      config,
    });
  });
});
