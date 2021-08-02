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
import { getToken } from 'test/helpers';
import { exportMentorQuery } from '../../query/export-mentor.spec';

describe('import mentor', () => {
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
    const token = getToken('5ffdf41a1ee2c62320b49ea4');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation ImportMentor($mentor: ID!, $json: MentorImportJsonType!) {
          me {
            mentorImport(mentor: $mentor, json: $json) {
              _id
            }  
          }
        }`,
        variables: { mentor: '5ffdf41a1ee2c62111112111', json: {} },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'mentor not found'
    );
  });

  it(`imports an existing chat mentor and updates mentor`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea4');
    // export mentor 5ffdf41a1ee2c62111111111
    let response = await request(app)
      .post('/graphql')
      .send({
        query: exportMentorQuery,
        variables: { mentor: '5ffdf41a1ee2c62111111111' },
      });
    expect(response.status).to.equal(200);
    const mentorJson = response.body.data.mentorExport;
    expect(mentorJson).to.eql({
      subjects: [
        {
          _id: '5ffdf41a1ee2c62320b49eb1',
          name: 'Repeat After Me',
          description:
            "These are miscellaneous phrases you'll be asked to repeat.",
          isRequired: true,
          topics: [
            {
              id: '5ffdf41a1ee2c62320b49ec1',
              name: 'Idle',
              description: '30-second idle clip',
            },
          ],
          categories: [],
          questions: [
            {
              question: {
                _id: '511111111111111111111111',
                question: "Don't talk and stay still.",
              },
              category: null,
              topics: [{ id: '5ffdf41a1ee2c62320b49ec1' }],
            },
          ],
        },
        {
          _id: '5ffdf41a1ee2c62320b49eb2',
          name: 'Background',
          description:
            'These questions will ask general questions about your background that might be relevant to how people understand your career.',
          isRequired: true,
          topics: [
            {
              id: '5ffdf41a1ee2c62320b49ec2',
              name: 'Background',
              description:
                'These questions will ask general questions about your background, that might be relevant to how people understand your career',
            },
            {
              id: '5ffdf41a1ee2c62320b49ec3',
              name: 'Advice',
              description:
                'These questions will ask you to give advice to someone who is interested in your career',
            },
          ],
          categories: [
            {
              id: 'category',
              name: 'Category',
              description: 'A test category',
            },
          ],
          questions: [
            {
              question: {
                _id: '511111111111111111111112',
                question: 'Who are you and what do you do?',
              },
              category: null,
              topics: [{ id: '5ffdf41a1ee2c62320b49ec2' }],
            },
            {
              question: {
                _id: '511111111111111111111113',
                question: 'How old are you?',
              },
              category: { id: 'category' },
              topics: [{ id: '5ffdf41a1ee2c62320b49ec2' }],
            },
            {
              question: {
                _id: '511111111111111111111114',
                question: 'Do you like your job?',
              },
              category: null,
              topics: [{ id: '5ffdf41a1ee2c62320b49ec3' }],
            },
            {
              question: { _id: '511111111111111111111116', question: 'Julia?' },
              category: null,
              topics: [],
            },
            {
              question: {
                _id: '511111111111111111111117',
                question: 'What is Aaron like?',
              },
              category: { id: 'category' },
              topics: [],
            },
          ],
        },
      ],
      questions: [
        {
          _id: '511111111111111111111111',
          question: "Don't talk and stay still.",
          type: 'UTTERANCE',
          name: 'idle',
          paraphrases: [],
          mentor: null,
          mentorType: null,
          minVideoLength: null,
        },
        {
          _id: '511111111111111111111112',
          question: 'Who are you and what do you do?',
          type: 'QUESTION',
          name: null,
          paraphrases: [],
          mentor: null,
          mentorType: null,
          minVideoLength: null,
        },
        {
          _id: '511111111111111111111113',
          question: 'How old are you?',
          type: 'QUESTION',
          name: null,
          paraphrases: [],
          mentor: null,
          mentorType: null,
          minVideoLength: null,
        },
        {
          _id: '511111111111111111111114',
          question: 'Do you like your job?',
          type: 'QUESTION',
          name: null,
          paraphrases: [],
          mentor: null,
          mentorType: null,
          minVideoLength: null,
        },
        {
          _id: '511111111111111111111117',
          question: 'What is Aaron like?',
          type: 'QUESTION',
          name: null,
          paraphrases: [],
          mentor: null,
          mentorType: null,
          minVideoLength: null,
        },
      ],
      answers: [
        {
          transcript: '[being still]',
          status: 'COMPLETE',
          question: {
            _id: '511111111111111111111111',
            question: "Don't talk and stay still.",
          },
          media: [
            {
              tag: 'web',
              type: 'video',
              url: 'https://static.mentorpal.org/web.mp4',
            },
            {
              tag: 'mobile',
              type: 'video',
              url: 'https://static.mentorpal.org/mobile.mp4',
            },
          ],
        },
        {
          transcript: 'Test Transcript',
          status: 'COMPLETE',
          question: {
            _id: '511111111111111111111117',
            question: 'What is Aaron like?',
          },
          media: [
            {
              tag: 'web',
              type: 'video',
              url: 'https://static.mentorpal.org/web.mp4',
            },
            {
              tag: 'mobile',
              type: 'video',
              url: 'https://static.mentorpal.org/mobile.mp4',
            },
          ],
        },
      ],
    });
    // overwrite mentor 5ffdf41a1ee2c62111111113 by importing data from mentor 5ffdf41a1ee2c62111111111
    response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation ImportMentor($mentor: ID!, $json: MentorImportJsonType!) {
          me {
            mentorImport(mentor: $mentor, json: $json) {
              _id
            }  
          }
        }`,
        variables: { mentor: '5ffdf41a1ee2c62111111113', json: mentorJson },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.mentorImport).to.eql({
      _id: '5ffdf41a1ee2c62111111113',
    });
    // check that data was imported correctly
    response = await request(app)
      .post('/graphql')
      .send({
        query: exportMentorQuery,
        variables: { mentor: '5ffdf41a1ee2c62111111113' },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentorExport).to.eql({
      subjects: [
        {
          _id: '5ffdf41a1ee2c62320b49eb1',
          name: 'Repeat After Me',
          description:
            "These are miscellaneous phrases you'll be asked to repeat.",
          isRequired: true,
          topics: [
            {
              id: '5ffdf41a1ee2c62320b49ec1',
              name: 'Idle',
              description: '30-second idle clip',
            },
          ],
          categories: [],
          questions: [
            {
              question: {
                _id: '511111111111111111111111',
                question: "Don't talk and stay still.",
              },
              category: null,
              topics: [{ id: '5ffdf41a1ee2c62320b49ec1' }],
            },
          ],
        },
        {
          _id: '5ffdf41a1ee2c62320b49eb2',
          name: 'Background',
          description:
            'These questions will ask general questions about your background that might be relevant to how people understand your career.',
          isRequired: true,
          topics: [
            {
              id: '5ffdf41a1ee2c62320b49ec2',
              name: 'Background',
              description:
                'These questions will ask general questions about your background, that might be relevant to how people understand your career',
            },
            {
              id: '5ffdf41a1ee2c62320b49ec3',
              name: 'Advice',
              description:
                'These questions will ask you to give advice to someone who is interested in your career',
            },
          ],
          categories: [
            {
              id: 'category',
              name: 'Category',
              description: 'A test category',
            },
          ],
          questions: [
            {
              question: {
                _id: '511111111111111111111112',
                question: 'Who are you and what do you do?',
              },
              category: null,
              topics: [{ id: '5ffdf41a1ee2c62320b49ec2' }],
            },
            {
              question: {
                _id: '511111111111111111111113',
                question: 'How old are you?',
              },
              category: { id: 'category' },
              topics: [{ id: '5ffdf41a1ee2c62320b49ec2' }],
            },
            {
              question: {
                _id: '511111111111111111111114',
                question: 'Do you like your job?',
              },
              category: null,
              topics: [{ id: '5ffdf41a1ee2c62320b49ec3' }],
            },
            {
              question: { _id: '511111111111111111111116', question: 'Julia?' },
              category: null,
              topics: [],
            },
            {
              question: {
                _id: '511111111111111111111117',
                question: 'What is Aaron like?',
              },
              category: { id: 'category' },
              topics: [],
            },
          ],
        },
      ],
      questions: [
        {
          _id: '511111111111111111111111',
          question: "Don't talk and stay still.",
          type: 'UTTERANCE',
          name: 'idle',
          paraphrases: [],
          mentor: null,
          mentorType: null,
          minVideoLength: null,
        },
        {
          _id: '511111111111111111111112',
          question: 'Who are you and what do you do?',
          type: 'QUESTION',
          name: null,
          paraphrases: [],
          mentor: null,
          mentorType: null,
          minVideoLength: null,
        },
        {
          _id: '511111111111111111111113',
          question: 'How old are you?',
          type: 'QUESTION',
          name: null,
          paraphrases: [],
          mentor: null,
          mentorType: null,
          minVideoLength: null,
        },
        {
          _id: '511111111111111111111114',
          question: 'Do you like your job?',
          type: 'QUESTION',
          name: null,
          paraphrases: [],
          mentor: null,
          mentorType: null,
          minVideoLength: null,
        },
        {
          _id: '511111111111111111111117',
          question: 'What is Aaron like?',
          type: 'QUESTION',
          name: null,
          paraphrases: [],
          mentor: null,
          mentorType: null,
          minVideoLength: null,
        },
      ],
      answers: [
        {
          transcript: '[being still]',
          status: 'COMPLETE',
          question: {
            _id: '511111111111111111111111',
            question: "Don't talk and stay still.",
          },
          media: [],
        },
        {
          transcript: 'Test Transcript',
          status: 'COMPLETE',
          question: {
            _id: '511111111111111111111117',
            question: 'What is Aaron like?',
          },
          media: [],
        },
      ],
    });
  });

  it(`creates new question and subject when importing`, async () => {
    const json = {
      subjects: [
        {
          _id: '5ffdf41a1ee2c62320b49eb1',
          name: 'Repeat After Me',
          questions: [
            {
              question: { _id: '511111111111111111111111' },
            },
            {
              question: { _id: 'newquestion' },
            },
          ],
        },
        {
          _id: 'newsubject',
          name: 'New Subject',
          questions: [
            {
              question: { _id: 'newquestion' },
            },
          ],
        },
      ],
      questions: [
        {
          _id: '511111111111111111111111',
          question: "Don't talk and stay still.",
        },
        {
          _id: 'newquestion',
          question: 'new question',
        },
      ],
      answers: [
        {
          transcript: '[being still]',
          question: { _id: '511111111111111111111111' },
          status: 'COMPLETE',
        },
        {
          transcript: 'new answer',
          question: { _id: 'newquestion' },
          status: 'COMPLETE',
        },
      ],
    };
    const token = getToken('5ffdf41a1ee2c62320b49ea4');
    let response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation ImportMentor($mentor: ID!, $json: MentorImportJsonType!) {
          me {
            mentorImport(mentor: $mentor, json: $json) {
              _id
            }  
          }
        }`,
        variables: { mentor: '5ffdf41a1ee2c62111111113', json: json },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.mentorImport).to.eql({
      _id: '5ffdf41a1ee2c62111111113',
    });
    // check that data was imported correctly
    response = await request(app)
      .post('/graphql')
      .send({
        query: `query ExportMentor($mentor: ID!) {
          mentorExport(mentor: $mentor) {
            subjects {
              name
            }
            questions {
              question
            }
            answers {
              transcript
              question {
                question
              }
            }
          }
        }`,
        variables: { mentor: '5ffdf41a1ee2c62111111113' },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentorExport).to.eql({
      subjects: [
        {
          name: 'Repeat After Me',
        },
        {
          name: 'New Subject',
        },
      ],
      questions: [
        {
          question: "Don't talk and stay still.",
        },
        {
          question: 'new question',
        },
      ],
      answers: [
        {
          transcript: '[being still]',
          question: {
            question: "Don't talk and stay still.",
          },
        },
        {
          transcript: 'new answer',
          question: { question: 'new question' },
        },
      ],
    });
  });
});
