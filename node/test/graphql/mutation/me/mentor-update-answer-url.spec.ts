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
import { getToken } from 'test/helpers';

describe('updateAnswerUrl', () => {
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
        query: `mutation UpdateAnswerUrl($mentorId: ID!, $questionId: ID!, $webUrl: String, $mobileUrl: String) {
          me {
            updateAnswerUrl(mentorId: $mentorId, questionId: $questionId, webUrl: $webUrl, mobileUrl: $mobileUrl) {
              webMedia {
                url
              }
              mobileMedia {
                url
              }
            }
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111119',
          questionId: '511111111111111111111112',
          webUrl: undefined,
          mobileUrl: undefined,
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Only authenticated users'
    );
  });

  it(`throws an error if mentor is not advanced`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateAnswerUrl($mentorId: ID!, $questionId: ID!, $webUrl: String, $mobileUrl: String) {
          me {
            updateAnswerUrl(mentorId: $mentorId, questionId: $questionId, webUrl: $webUrl, mobileUrl: $mobileUrl) {
              webMedia {
                url
              }
              mobileMedia {
                url
              }
            }
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111119',
          questionId: '511111111111111111111112',
          webUrl: undefined,
          mobileUrl: undefined,
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'only advanced mentors can edit video urls directly'
    );
  });

  it(`throws an error if question does not exist`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateAnswerUrl($mentorId: ID!, $questionId: ID!, $webUrl: String, $mobileUrl: String) {
          me {
            updateAnswerUrl(mentorId: $mentorId, questionId: $questionId, webUrl: $webUrl, mobileUrl: $mobileUrl) {
              webMedia {
                url
              }
              mobileMedia {
                url
              }
            }
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          webUrl: undefined,
          mobileUrl: undefined,
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      `no answer found`
    );
  });

  it('"USER"\'s cannot update other mentors answers', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2'); //mentor with role "User"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateAnswerUrl($mentorId: ID!, $questionId: ID!, $webUrl: String, $mobileUrl: String) {
          me {
            updateAnswerUrl(mentorId: $mentorId, questionId: $questionId, webUrl: $webUrl, mobileUrl: $mobileUrl) {
              webMedia {
                url
              }
              mobileMedia {
                url
              }
            }
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111111',
          webUrl: undefined,
          mobileUrl: undefined,
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.errors[0].message).to.equal(
      'you do not have permission to edit this mentor'
    );
  });

  it('"CONTENT_MANAGER"\'s can update other mentors answers', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea5'); //mentor with role "Content Manager"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateAnswerUrl($mentorId: ID!, $questionId: ID!, $webUrl: String, $mobileUrl: String) {
          me {
            updateAnswerUrl(mentorId: $mentorId, questionId: $questionId, webUrl: $webUrl, mobileUrl: $mobileUrl) {
              webMedia {
                url
              }
              mobileMedia {
                url
              }
            }
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111111',
          webUrl: 'http://video.mp4',
          mobileUrl: undefined,
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.updateAnswerUrl).to.eql({
      mobileMedia: {
        url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/mobile.mp4',
      },
      webMedia: {
        url: 'http://video.mp4/',
      },
    });
  });

  it('"ADMIN"\'s can update other mentors answers', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1'); //mentor with role "Admin"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateAnswerUrl($mentorId: ID!, $questionId: ID!, $webUrl: String, $mobileUrl: String) {
          me {
            updateAnswerUrl(mentorId: $mentorId, questionId: $questionId, webUrl: $webUrl, mobileUrl: $mobileUrl) {
              webMedia {
                url
              }
              mobileMedia {
                url
              }
            }
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111111',
          webUrl: undefined,
          mobileUrl: 'http://video.mp4/',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.updateAnswerUrl).to.eql({
      mobileMedia: {
        url: 'http://video.mp4/',
      },
      webMedia: {
        url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/web.mp4',
      },
    });
  });
});
