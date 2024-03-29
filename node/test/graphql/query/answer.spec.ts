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

describe('answer', () => {
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

  it(`throws an error if invalid mentor id`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query Answer($mentor: ID!, $question: ID!) {
          answer(mentor: $mentor, question: $question) {
            _id
          }
        }`,
        variables: {
          mentor: 'asdf',
          question: '511111111111111111111111',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property('errors[0].message');
  });

  it(`throws an error if invalid question id`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query Answer($mentor: ID!, $question: ID!) {
          answer(mentor: $mentor, question: $question) {
            _id
          }
        }`,
        variables: {
          mentor: '5ffdf41a1ee2c62111111111',
          question: 'asdf',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property('errors[0].message');
  });

  it(`gets answer`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query Answer($mentor: ID!, $question: ID!) {
          answer(mentor: $mentor, question: $question) {
            _id
            webMedia{
              url
            }
          }
        }`,
        variables: {
          mentor: '5ffdf41a1ee2c62111111111',
          question: '511111111111111111111111',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.answer).to.eql({
      _id: '511111111111111111111112',
      webMedia: {
        url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/web.mp4',
      },
    });

    it('gets webm instead of mp4 via arg', async () => {
      const response = await request(app)
        .post('/graphql')
        .send({
          query: `query Answer($mentor: ID!, $question: ID!) {
        answer(mentor: $mentor, question: $question) {
          _id
          webMedia{
            url(browserSupportsVbg: true)
          }
        }
      }`,
          variables: {
            mentor: '5ffdf41a1ee2c62111111111',
            question: '511111111111111111111111',
          },
        });
      expect(response.status).to.equal(200);
      expect(response.body.data.answer).to.eql({
        _id: '511111111111111111111112',
        webMedia: {
          url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/web.webm',
        },
      });
    });
  });

  it(`gets markdown version and regular version of transcript`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query Answer($mentor: ID!, $question: ID!) {
          answer(mentor: $mentor, question: $question) {
            _id
            transcript
            markdownTranscript
          }
        }`,
        variables: {
          mentor: '5ffdf41a1ee2c62111111119',
          question: '511111111111111111111112',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.answer).to.eql({
      _id: '511111111111111111111174',
      transcript:
        "My name is Clint Anderson and I'm a Nuclear Electrician's Mate",
      markdownTranscript:
        "**My** [*name*](http://clint.com) __is__ Clint __Anderson and I'm a__ **Nuclear Electrician's Mate**",
    });
  });

  it(`throws an error if mentor is private and user is not logged in`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query Answer($mentor: ID!, $question: ID!) {
          answer(mentor: $mentor, question: $question) {
            _id
          }
        }`,
        variables: {
          mentor: '5ffdf41a1ee2c62111111114',
          question: '511111111111111111111111',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'mentor is private and you do not have permission to access'
    );
  });

  it(`throws an error if mentor is private and user is not owner or super user`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query Answer($mentor: ID!, $question: ID!) {
          answer(mentor: $mentor, question: $question) {
            _id
          }
        }`,
        variables: {
          mentor: '5ffdf41a1ee2c62111111114',
          question: '511111111111111111111111',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'mentor is private and you do not have permission to access'
    );
  });

  it(`gets answer for private mentor if content manager`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea4');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query Answer($mentor: ID!, $question: ID!) {
          answer(mentor: $mentor, question: $question) {
            _id
          }
        }`,
        variables: {
          mentor: '5ffdf41a1ee2c62111111114',
          question: '511111111111111111111111',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.not.have.deep.nested.property('errors[0].message');
    expect(response.body.data.answer).to.eql({
      _id: '511111111111111111111119',
    });
  });

  it(`gets answer for private mentor if admin`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query Answer($mentor: ID!, $question: ID!) {
          answer(mentor: $mentor, question: $question) {
            _id
          }
        }`,
        variables: {
          mentor: '5ffdf41a1ee2c62111111114',
          question: '511111111111111111111111',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.not.have.deep.nested.property('errors[0].message');
    expect(response.body.data.answer).to.eql({
      _id: '511111111111111111111119',
    });
  });

  it(`gets answer for private mentor if owner`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea7');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query Answer($mentor: ID!, $question: ID!) {
          answer(mentor: $mentor, question: $question) {
            _id
          }
        }`,
        variables: {
          mentor: '5ffdf41a1ee2c62111111114',
          question: '511111111111111111111111',
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.not.have.deep.nested.property('errors[0].message');
    expect(response.body.data.answer).to.eql({
      _id: '511111111111111111111119',
    });
  });
});
