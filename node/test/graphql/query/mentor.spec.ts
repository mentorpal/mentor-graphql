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

describe('mentor', () => {
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
    const token = getToken('5f0cfea3395d762ca65405d1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          mentor(id: "111111111111111111111111") {
            id
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'mentor not found for args "{"id":"111111111111111111111111"}"'
    );
  });

  it('gets a mentor by id', async () => {
    const token = getToken('5f0cfea3395d762ca65405d1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          mentor(id: "5f0cfea3395d762ca65405d1") {
            id
            videoId
            name
            shortName
            title
            topics {
              id
              name
              description
              category
            }
            questions {
              question
              videoId
              video
              transcript
              status
              recordedAt
              topics {
                id
                name
                description
                category
              }
            }
            utterances {
              question
              videoId
              video
              transcript
              status
              recordedAt
              topics {
                id
                name
                description
                category
              }
            }
          }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentor).to.eql({
      id: '5f0cfea3395d762ca65405d1',
      videoId: 'clintanderson',
      name: 'Clinton Anderson',
      shortName: 'Clint',
      title: "Nuclear Electrician's Mate",
      topics: [
        {
          id: 'background',
          name: 'Background',
          description:
            'These questions will ask general questions about your background, that might be relevant to how people understand your career',
          category: 'About Me',
        },
        {
          id: 'advice',
          name: 'Advice',
          description:
            'These questions will ask you to give advice to someone who is interested in your career',
          category: 'What Does it Take?',
        },
      ],
      questions: [
        {
          question: 'Who are you and what do you do?',
          topics: [
            {
              id: 'background',
              name: 'Background',
              description:
                'These questions will ask general questions about your background, that might be relevant to how people understand your career',
              category: 'About Me',
            },
          ],
          videoId: 'A1_1_1',
          video: null,
          transcript: null,
          status: 'Incomplete',
          recordedAt: null,
        },
        {
          question: 'Can you give me some advice?',
          topics: [
            {
              id: 'advice',
              name: 'Advice',
              description:
                'These questions will ask you to give advice to someone who is interested in your career',
              category: 'What Does it Take?',
            },
          ],
          videoId: 'A2_1_1',
          video: null,
          transcript: null,
          status: 'Incomplete',
          recordedAt: null,
        },
      ],
      utterances: [
        {
          question:
            'Please look at the camera for 30 seconds without speaking. Try to remain in the same position.',
          topics: [
            {
              id: '_IDLE_',
              name: 'Idle',
              description: '30-second idle clip',
              category: 'Utterance',
            },
          ],
          videoId: 'U1_1_1',
          video: null,
          transcript: null,
          status: 'Incomplete',
          recordedAt: null,
        },
        {
          question:
            'Please give a short introduction of yourself, which includes your name, current job, and title.',
          topics: [
            {
              id: '_INTRO_',
              name: 'Intro',
              description: 'Short introduction about you',
              category: 'Utterance',
            },
          ],
          videoId: 'U2_1_1',
          video: null,
          transcript: null,
          status: 'Incomplete',
          recordedAt: null,
        },
        {
          question:
            "Please repeat the following: 'I couldn't understand the question. Try asking me something else.'",
          topics: [
            {
              id: '_OFF_TOPIC_',
              name: 'Off-Topic',
              description:
                'Short responses to off-topic questions you do not have answers for or do not understand',
              category: 'Utterance',
            },
          ],
          videoId: 'U3_1_1',
          video: null,
          transcript: null,
          status: 'Incomplete',
          recordedAt: null,
        },
      ],
    });
  });
});
