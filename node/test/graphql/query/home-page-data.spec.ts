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

describe('home-page-data', () => {
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
  it('returns default home page data for no org', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({
        query: `query HomePageData($orgId: String) {
        homePageData(orgId: $orgId) {
          mentors {
            _id
            name
            title
            keywords
            transcript
            mentorUrl
            thumbnail
          }
          panels {
            _id
            org
            subject
            mentors
            title
            subtitle
          }
        }
      }`,
        variables: { orgId: undefined },
      });
    expect(res.status).to.equal(200);
    expect(res.body).to.have.deep.nested.property('data.homePageData.mentors');
    expect(res.body.data.homePageData.mentors).to.deep.include.members([
      {
        _id: '5ffdf41a1ee2c62111111112',
        name: 'Julianne Nordhagen',
        title: 'Pilot',
        keywords: ['Female'],
        transcript: '',
        mentorUrl:
          'https://fakedomain.org/chat/?mentor=5ffdf41a1ee2c62111111112',
        thumbnail: null,
      },
      {
        _id: '5ffdf41a1ee2c62111111119',
        name: 'Aaron Klunder',
        title: 'Admin',
        keywords: ['Male'],
        transcript: 'Here is my intro.',
        mentorUrl:
          'https://fakedomain.org/chat/?mentor=5ffdf41a1ee2c62111111119',
        thumbnail:
          'https://static.mentorpal.org/mentor/thumbnails/5ffdf41a1ee2c62111111111-20210621T000000.png',
      },
    ]);
    expect(res.body).to.have.deep.nested.property('data.homePageData.panels');
    expect(res.body.data.homePageData.panels).to.have.length(1);
    expect(res.body.data.homePageData.panels).to.deep.include.members([
      {
        _id: '5ffdf41a1ee2c62111111111',
        org: null,
        subject: '5ffdf41a1ee2c62320b49eb3',
        mentors: ['5ffdf41a1ee2c62111111112'],
        title: 'fake panel title',
        subtitle: 'fake panel subtitle',
      },
    ]);
  });

  it('returns data for specified org', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({
        query: `query HomePageData($orgId: String) {
        homePageData(orgId: $orgId) {
          mentors {
            _id
            name
            title
            keywords
            transcript
            mentorUrl
            thumbnail
          }
          panels {
            _id
            org
            subject
            mentors
            title
            subtitle
          }
        }
      }`,
        variables: { orgId: '511111111111111111111111' },
      });
    expect(res.status).to.equal(200);
    expect(res.body).to.have.deep.nested.property('data.homePageData.mentors');
    expect(res.body.data.homePageData.mentors).to.deep.include.members([
      {
        _id: '5ffdf41a1ee2c62111111112',
        name: 'Julianne Nordhagen',
        title: 'Pilot',
        keywords: ['Female'],
        transcript: '',
        mentorUrl:
          'https://USC.fakedomain.org/chat/?mentor=5ffdf41a1ee2c62111111112',
        thumbnail: null,
      },
    ]);
    expect(res.body).to.have.deep.nested.property('data.homePageData.panels');
    expect(res.body.data.homePageData.panels).to.have.length(1);
    expect(res.body.data.homePageData.panels).to.deep.include.members([
      {
        _id: '5ffdf41a1ee2c62111111111',
        org: null,
        subject: '5ffdf41a1ee2c62320b49eb3',
        mentors: ['5ffdf41a1ee2c62111111112'],
        title: 'fake panel title',
        subtitle: 'fake panel subtitle',
      },
    ]);
  });
});
