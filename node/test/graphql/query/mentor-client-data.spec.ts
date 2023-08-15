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

describe('mentorClientData', () => {
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

  it(`throws an error if invalid id`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          mentorClientData(mentor: "111111111111111111111111") {
            _id
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'mentor 111111111111111111111111 not found'
    );
  });

  it('gets mentorClientData for default subject', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          mentorClientData(mentor: "5ffdf41a1ee2c62111111111") {
            _id
            name
            email
            title
            mentorType
            isDirty
            isPublicApproved
            topicQuestions {
              topic
              questions
            }
            utterances {
              _id
              name
              transcript
              utteranceType
              webMedia {
                type
                tag
                url
              }
              mobileMedia {
                type
                tag
                url
              }
              externalVideoIds{
                wistiaId
              }
            }
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentorClientData).to.eql({
      _id: '5ffdf41a1ee2c62111111111',
      name: 'Clinton Anderson',
      email: 'clint@email.com',
      title: "Nuclear Electrician's Mate",
      mentorType: 'VIDEO',
      isPublicApproved: false,
      isDirty: false,
      topicQuestions: [],
      utterances: [
        {
          _id: '511111111111111111111112',
          name: 'idle',
          transcript: '[being still]',
          utteranceType: 'cant_answer',
          webMedia: {
            type: 'video',
            tag: 'web',
            url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/web.mp4',
          },
          mobileMedia: {
            type: 'video',
            tag: 'mobile',
            url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/mobile.mp4',
          },
          externalVideoIds: {
            wistiaId: '5ffdf41a1ee2c62111111111-wistia-id',
          },
        },
      ],
    });
  });

  it('gets mentorClientData for given subject', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          mentorClientData(mentor: "5ffdf41a1ee2c62111111111", subject: "5ffdf41a1ee2c62320b49eb1") {
            _id
            name
            title
            mentorType
            topicQuestions {
              topic
              questions
            }
            hasVirtualBackground,
            virtualBackgroundUrl,
            utterances {
              _id
              name
              transcript
              webMedia {
                type
                tag
                url
              }
              mobileMedia {
                type
                tag
                url
              }
            }
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentorClientData).to.eql({
      _id: '5ffdf41a1ee2c62111111111',
      name: 'Clinton Anderson',
      title: "Nuclear Electrician's Mate",
      mentorType: 'VIDEO',
      topicQuestions: [],
      hasVirtualBackground: true,
      virtualBackgroundUrl: 'https://www.fakeurl.com/',
      utterances: [
        {
          _id: '511111111111111111111112',
          name: 'idle',
          transcript: '[being still]',

          webMedia: {
            type: 'video',
            tag: 'web',
            url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/web.mp4',
          },
          mobileMedia: {
            type: 'video',
            tag: 'mobile',
            url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/mobile.mp4',
          },
        },
      ],
    });
  });

  it('gets mentorClientData for all subjects', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          mentorClientData(mentor: "5ffdf41a1ee2c62111111113") {
            _id
            name
            title
            mentorType
            topicQuestions {
              topic
              questions
            }
            utterances {
              _id
              name
              transcript
              webMedia {
                type
                tag
                url
              }
              mobileMedia {
                type
                tag
                url
              }
            }
          }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentorClientData).to.eql({
      _id: '5ffdf41a1ee2c62111111113',
      name: 'Dan Davis',
      title: null,
      mentorType: 'VIDEO',
      topicQuestions: [],
      utterances: [],
    });
  });
});
