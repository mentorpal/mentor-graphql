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
import { getToken } from '../../helpers';

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

  it('get mentorClientData topicsQuestions', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        mentorClientData(mentor: "5ffdf41a1ee2c62119991234") {
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
      _id: '5ffdf41a1ee2c62119991234',
      name: 'Test Default Topics Mentor',
      title: null,
      mentorType: 'VIDEO',
      topicQuestions: [
        {
          topic: '(Default Topic) Test Category',
          questions: ['Is STEM fun?', 'How old are you?'],
        },
      ],
      utterances: [],
    });
  });

  it('get mentorClientData ignoreTopicQuestions', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        mentorClientData(mentor: "5ffdf41a1ee2c62119991234", ignoreTopicQuestions: true) {
          _id
          name
          title
          mentorType
          topicQuestions {
            topic
            questions
          }
        }
    }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentorClientData).to.eql({
      _id: '5ffdf41a1ee2c62119991234',
      name: 'Test Default Topics Mentor',
      title: null,
      mentorType: 'VIDEO',
      topicQuestions: [],
    });
  });

  describe('private mentor', () => {
    it('returns mentor if user is owner', async () => {
      const token = getToken('5ffdf41a1ee2c62320b49ea7');
      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `bearer ${token}`)
        .send({
          query: `query {
              mentorClientData(mentor: "5ffdf41a1ee2c62111111114") {
                _id
              }
          }`,
        });
      expect(response.status).to.equal(200);
      expect(response.body.data.mentorClientData).to.eql({
        _id: '5ffdf41a1ee2c62111111114',
      });
    });

    it('returns mentor if user is admin/content manager/super admin/super content manager', async () => {
      const token = getToken('5ffdf41a1ee2c62320b49ea1'); // ADMIN
      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `bearer ${token}`)
        .send({
          // private mentor
          query: `query {
              mentorClientData(mentor: "5ffdf41a1ee2c62111111114") {
                _id
              }
          }`,
        });
      expect(response.status).to.equal(200);
      expect(response.body.data.mentorClientData).to.eql({
        _id: '5ffdf41a1ee2c62111111114',
      });
    });

    it('rejects if user is not owner and has no higher permissions', async () => {
      const token = getToken('5ffdf41a1ee2c62320b49ea3'); // USER
      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `bearer ${token}`)
        .send({
          // private mentor
          query: `query {
              mentorClientData(mentor: "5ffdf41a1ee2c62111111114") {
                _id
              }
          }`,
        });
      expect(response.status).to.equal(200);
      expect(response.body).to.have.deep.nested.property(
        'errors[0].message',
        'mentor is private and you do not have permission to access'
      );
    });

    it('returns mentor if requesting user manages org and has share permission', async () => {
      const token = getToken('5ffdf41a1ee2c62320b49a10'); // CONTENT_MANAGER of the org that user shares with
      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `bearer ${token}`)
        .send({
          // private mentor
          query: `query {
              mentorClientData(mentor: "5ffdf41a1ee2c62111111114") {
                _id
              }
          }`,
        });
      expect(response.status).to.equal(200);
      expect(response.body.data.mentorClientData).to.eql({
        _id: '5ffdf41a1ee2c62111111114',
      });
    });
  });

  describe('direct link private mentor', () => {
    beforeEach(async () => {
      const token = getToken('5ffdf41a1ee2c62320b49ea2');
      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `bearer ${token}`)
        .send({
          query: `mutation UpdateMentorPrivacy($mentorId: ID!, $isPrivate: Boolean!, $directLinkPrivate: Boolean) {
          me {
            updateMentorPrivacy(mentorId: $mentorId, isPrivate: $isPrivate, directLinkPrivate: $directLinkPrivate)
          }
        }`,
          variables: {
            mentorId: '5ffdf41a1ee2c62111111113',
            isPrivate: false,
            directLinkPrivate: true,
          },
        });
      expect(response.status).to.equal(200);
      expect(response.body).to.have.deep.nested.property(
        'data.me.updateMentorPrivacy',
        true
      );
    });

    it('Rejects if mentor is directLinkPrivate and no "leftHomePageData" param provided', async () => {
      const response = await request(app)
        .post('/graphql')
        .send({
          query: `query {
            mentorClientData(mentor: "5ffdf41a1ee2c62111111113") {
              _id
              name
            }
        }`,
        });
      expect(response.status).to.equal(200);
      expect(response.body).to.have.deep.nested.property(
        'errors[0].message',
        'mentor can only be accessed via homepage'
      );
    });

    it('Rejects if home page visited more than 5 hours ago', async () => {
      const eightHoursAgo = new Date();
      eightHoursAgo.setHours(eightHoursAgo.getHours() - 8);
      const timeInPast = eightHoursAgo.toISOString();

      const data = JSON.stringify({
        time: timeInPast,
        targetMentors: ['5ffdf41a1ee2c62111111113'],
      });

      const response = await request(app)
        .post('/graphql')
        .send({
          query: `query MentorClientData($leftHomePageData: String!) {
            mentorClientData(mentor: "5ffdf41a1ee2c62111111113", leftHomePageData: $leftHomePageData) {
              _id
              name
            }
        }`,
          variables: {
            leftHomePageData: data,
          },
        });
      expect(response.status).to.equal(200);
      expect(response.body).to.have.deep.nested.property(
        'errors[0].message',
        'mentor can only be accessed via homepage'
      );
    });

    it('Does not reject despite visited time if user owns mentor', async () => {
      const token = getToken('5ffdf41a1ee2c62320b49ea2');
      const eightHoursAgo = new Date();
      eightHoursAgo.setHours(eightHoursAgo.getHours() - 8);
      const timeInPast = eightHoursAgo.toISOString();

      const data = JSON.stringify({
        time: timeInPast,
        targetMentors: ['5ffdf41a1ee2c62111111113'],
      });
      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `bearer ${token}`)
        .send({
          query: `query MentorClientData($leftHomePageData: String!) {
            mentorClientData(mentor: "5ffdf41a1ee2c62111111113", leftHomePageData: $leftHomePageData) {
              _id
              name
            }
        }`,
          variables: {
            leftHomePageData: data,
          },
        });
      expect(response.status).to.equal(200);
      expect(response.body.data.mentorClientData).to.eql({
        _id: '5ffdf41a1ee2c62111111113',
        name: 'Dan Davis',
      });
    });

    it('Does not reject despite visited time if user is admin', async () => {
      const token = getToken('5ffdf41a1ee2c62320b49ea6');
      const eightHoursAgo = new Date();
      eightHoursAgo.setHours(eightHoursAgo.getHours() - 8);
      const timeInPast = eightHoursAgo.toISOString();

      const data = JSON.stringify({
        time: timeInPast,
        targetMentors: ['5ffdf41a1ee2c62111111113'],
      });
      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `bearer ${token}`)
        .send({
          query: `query MentorClientData($leftHomePageData: String!) {
            mentorClientData(mentor: "5ffdf41a1ee2c62111111113", leftHomePageData: $leftHomePageData) {
              _id
              name
            }
        }`,
          variables: {
            leftHomePageData: data,
          },
        });
      expect(response.status).to.equal(200);
      expect(response.body.data.mentorClientData).to.eql({
        _id: '5ffdf41a1ee2c62111111113',
        name: 'Dan Davis',
      });
    });

    it('returns mentor if home page visited within last hour', async () => {
      const now = new Date().toISOString();

      const data = JSON.stringify({
        time: now,
        targetMentors: ['5ffdf41a1ee2c62111111113'],
      });
      const response = await request(app)
        .post('/graphql')
        .send({
          query: `query MentorClientData($leftHomePageData: String!) {
            mentorClientData(mentor: "5ffdf41a1ee2c62111111113", leftHomePageData: $leftHomePageData) {
              _id
              name
            }
        }`,
          variables: {
            leftHomePageData: data,
          },
        });
      expect(response.status).to.equal(200);
      expect(response.body.data.mentorClientData).to.eql({
        _id: '5ffdf41a1ee2c62111111113',
        name: 'Dan Davis',
      });
    });
  });
});
