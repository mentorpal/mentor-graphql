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
        query: `mutation ImportMentor($mentor: ID!, $json: MentorImportJsonType!, $replacedMentorDataChanges: ReplacedMentorDataChangesType!) {
          me {
            mentorImport(mentor: $mentor, json: $json, replacedMentorDataChanges: $replacedMentorDataChanges) {
              _id
            }  
          }
        }`,
        variables: {
          mentor: '5ffdf41a1ee2c62111112111',
          json: {},
          replacedMentorDataChanges: { questionChanges: [], answerChanges: [] },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Error: mentor not found'
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
    console.log(JSON.stringify(mentorJson));
    expect(mentorJson).to.eql({
      id: '5ffdf41a1ee2c62111111111',
      subjects: [
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
              topics: [
                {
                  id: '5ffdf41a1ee2c62320b49ec2',
                },
              ],
            },
            {
              question: {
                _id: '511111111111111111111113',
                question: 'How old are you?',
              },
              category: {
                id: 'category',
              },
              topics: [
                {
                  id: '5ffdf41a1ee2c62320b49ec2',
                },
              ],
            },
            {
              question: {
                _id: '511111111111111111111114',
                question: 'Do you like your job?',
              },
              category: null,
              topics: [
                {
                  id: '5ffdf41a1ee2c62320b49ec3',
                },
              ],
            },
            {
              question: {
                _id: '511111111111111111111117',
                question: 'What is Aaron like?',
              },
              category: {
                id: 'category',
              },
              topics: [],
            },
          ],
        },
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
              topics: [
                {
                  id: '5ffdf41a1ee2c62320b49ec1',
                },
              ],
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
          hasUntransferredMedia: false,
          media: [
            {
              tag: 'web',
              type: 'video',
              url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/web.mp4',
              needsTransfer: false,
            },
            {
              tag: 'mobile',
              type: 'video',
              url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/mobile.mp4',
              needsTransfer: false,
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
          hasUntransferredMedia: false,
          media: [
            {
              tag: 'web',
              type: 'video',
              url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111117/web.mp4',
              needsTransfer: false,
            },
            {
              tag: 'mobile',
              type: 'video',
              url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111117/mobile.mp4',
              needsTransfer: false,
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
        query: `mutation ImportMentor($mentor: ID!, $json: MentorImportJsonType!, $replacedMentorDataChanges: ReplacedMentorDataChangesType!) {
          me {
            mentorImport(mentor: $mentor, json: $json, replacedMentorDataChanges: $replacedMentorDataChanges) {
              _id
            }
          }
        }`,
        variables: {
          mentor: '5ffdf41a1ee2c62111111113',
          json: mentorJson,
          replacedMentorDataChanges: { questionChanges: [], answerChanges: [] },
        },
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
    console.log(JSON.stringify(response.body.data.mentorExport));
    expect(response.body.data.mentorExport).to.eql({
      id: '5ffdf41a1ee2c62111111113',
      subjects: [
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
              topics: [
                {
                  id: '5ffdf41a1ee2c62320b49ec2',
                },
              ],
            },
            {
              question: {
                _id: '511111111111111111111113',
                question: 'How old are you?',
              },
              category: {
                id: 'category',
              },
              topics: [
                {
                  id: '5ffdf41a1ee2c62320b49ec2',
                },
              ],
            },
            {
              question: {
                _id: '511111111111111111111114',
                question: 'Do you like your job?',
              },
              category: null,
              topics: [
                {
                  id: '5ffdf41a1ee2c62320b49ec3',
                },
              ],
            },
            {
              question: {
                _id: '511111111111111111111117',
                question: 'What is Aaron like?',
              },
              category: {
                id: 'category',
              },
              topics: [],
            },
          ],
        },
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
              topics: [
                {
                  id: '5ffdf41a1ee2c62320b49ec1',
                },
              ],
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
          transcript: 'Test Transcript',
          status: 'COMPLETE',
          question: {
            _id: '511111111111111111111117',
            question: 'What is Aaron like?',
          },
          hasUntransferredMedia: true,
          media: [
            {
              tag: 'web',
              type: 'video',
              url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111117/web.mp4',
              needsTransfer: true,
            },
            {
              tag: 'mobile',
              type: 'video',
              url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111117/mobile.mp4',
              needsTransfer: true,
            },
          ],
        },
        {
          transcript: '[being still]',
          status: 'COMPLETE',
          question: {
            _id: '511111111111111111111111',
            question: "Don't talk and stay still.",
          },
          hasUntransferredMedia: true,
          media: [
            {
              tag: 'web',
              type: 'video',
              url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/web.mp4',
              needsTransfer: true,
            },
            {
              tag: 'mobile',
              type: 'video',
              url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/mobile.mp4',
              needsTransfer: true,
            },
          ],
        },
      ],
    });
  });

  it(`creates new question and subject when importing`, async () => {
    const json = {
      id: '5ffdf41a1ee2c62111111111',
      mentorInfo: {},
      subjects: [
        {
          _id: '5ffdf41a1ee2c62320b49eb1',
          name: 'Repeat After Me',
          questions: [
            {
              question: { _id: '511111111111111111111111' },
            },
          ],
          categories: [] as string[],
          topics: [] as string[],
        },
        {
          _id: '5ffdf41a1ee2c62320b49eb7',
          name: 'New Subject1',
          questions: [
            {
              question: { _id: '511111111111111111111199' },
            },
            {
              question: { _id: '511111111111111111111198' },
            },
            {
              question: { _id: '511111111111111111111197' },
            },
          ],
          categories: [] as string[],
          topics: [] as string[],
        },
      ],
      questions: [
        {
          _id: '511111111111111111111111',
          question: "Don't talk and stay still.",
        },
        {
          _id: '511111111111111111111199',
          question: 'new question',
        },
        {
          _id: '511111111111111111111198',
          question: 'new question 2',
        },
        {
          _id: '511111111111111111111197',
          question: 'new question 3',
        },
      ],
      answers: [
        {
          transcript: '[being still]',
          question: { _id: '511111111111111111111111' },
          status: 'COMPLETE',
          media: [
            {
              type: 'video',
              tag: 'web',
              url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/web.mp4',
            },
            {
              type: 'video',
              tag: 'mobile',
              url: 'https://mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/mobile.mp4',
            },
          ],
        },
        {
          transcript: 'new answer',
          question: { _id: '511111111111111111111199' },
          status: 'COMPLETE',
          media: [],
        },
      ],
    };
    const token = getToken('5ffdf41a1ee2c62320b49ea4');
    let response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation ImportMentor($mentor: ID!, $json: MentorImportJsonType!, $replacedMentorDataChanges: ReplacedMentorDataChangesType!) {
          me {
            mentorImport(mentor: $mentor, json: $json, replacedMentorDataChanges: $replacedMentorDataChanges) {
              _id
            }  
          }
        }`,
        variables: {
          mentor: '5ffdf41a1ee2c62111111113',
          json: json,
          replacedMentorDataChanges: { questionChanges: [], answerChanges: [] },
        },
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
              questions{
                question{
                  _id
                  question
                }
              }
            }
            questions {
              question
            }
            answers {
              transcript
              question {
                question
              }
              hasUntransferredMedia
              media {
                url
                needsTransfer
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
          name: 'New Subject1',
          questions: [
            {
              question: {
                _id: '511111111111111111111199',
                question: 'new question',
              },
            },
            {
              question: {
                _id: '511111111111111111111198',
                question: 'new question 2',
              },
            },
            {
              question: {
                _id: '511111111111111111111197',
                question: 'new question 3',
              },
            },
          ],
        },
        {
          name: 'Repeat After Me',
          questions: [
            {
              question: {
                _id: '511111111111111111111111',
                question: "Don't talk and stay still.",
              },
            },
          ],
        },
      ],
      questions: [
        { question: "Don't talk and stay still." },
        { question: 'new question 3' },
        { question: 'new question 2' },
        { question: 'new question' },
      ],
      answers: [
        {
          transcript: '[being still]',
          question: { question: "Don't talk and stay still." },
          hasUntransferredMedia: true,
          media: [
            {
              url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/web.mp4',
              needsTransfer: true,
            },
            {
              url: 'https://mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/mobile.mp4',
              needsTransfer: true,
            },
          ],
        },
        {
          transcript: 'new answer',
          question: { question: 'new question' },
          hasUntransferredMedia: true,
          media: [],
        },
      ],
    });
  });

  it(`when a mentor is replaced, their mentor specific questions are removed only if marked for removal`, async () => {
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

    response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation ImportMentor($mentor: ID!, $json: MentorImportJsonType!, $replacedMentorDataChanges: ReplacedMentorDataChangesType!) {
          me {
            mentorImport(mentor: $mentor, json: $json, replacedMentorDataChanges: $replacedMentorDataChanges) {
              _id
            }
          }
        }`,
        variables: {
          mentor: '5ffdf41a1ee2c62111111112',
          json: mentorJson,
          replacedMentorDataChanges: {
            questionChanges: [
              {
                editType: 'REMOVED',
                data: { _id: '511111111111111111111116', mentor:"5ffdf41a1ee2c62111111112" },
              },
            ],
            answerChanges: [],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.mentorImport).to.eql({
      _id: '5ffdf41a1ee2c62111111112',
    });
    // all mentor specific questions should not remain
    response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query{
          questions(filter:{mentor:"5ffdf41a1ee2c62111111112"}){
            edges{
              node{
                question
              }
            }
          }
        }`,
      });
    expect(response.body.data.questions.edges).to.eql([]);

    // all mentor specific questions should not remain in subject
    response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query{
          subject(id:"5ffdf41a1ee2c62320b49eb2"){
            questions{
              question{
                _id
              }
            }
          }
        }`,
      });
    expect(response.body.data.subject.questions).to.eql([
      { question: { _id: '511111111111111111111112' } },
      { question: { _id: '511111111111111111111113' } },
      { question: { _id: '511111111111111111111114' } },
      { question: { _id: '511111111111111111111117' } },
    ]);
  });

  const uneditedJson = {
    id: '5ffdf41a1ee2c62111111119',
    subjects: [
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
            topics: [
              {
                id: '5ffdf41a1ee2c62320b49ec2',
              },
            ],
          },
          {
            question: {
              _id: '511111111111111111111113',
              question: 'How old are you?',
            },
            category: {
              id: 'category',
            },
            topics: [
              {
                id: '5ffdf41a1ee2c62320b49ec2',
              },
            ],
          },
          {
            question: {
              _id: '511111111111111111111114',
              question: 'Do you like your job?',
            },
            category: null,
            topics: [
              {
                id: '5ffdf41a1ee2c62320b49ec3',
              },
            ],
          },
          {
            question: {
              _id: '511111111111111111111117',
              question: 'What is Aaron like?',
            },
            category: {
              id: 'category',
            },
            topics: [],
          },
        ],
      },
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
            topics: [
              {
                id: '5ffdf41a1ee2c62320b49ec1',
              },
            ],
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
        paraphrases: [] as string[],
        mentor: null as string,
        mentorType: null as string,
        minVideoLength: null as number,
      },
      {
        _id: '511111111111111111111112',
        question: 'Who are you and what do you do?',
        type: 'QUESTION',
        name: null,
        paraphrases: [] as string[],
        mentor: null as string,
        mentorType: null as string,
        minVideoLength: null as number,
      },
      {
        _id: '511111111111111111111113',
        question: 'How old are you?',
        type: 'QUESTION',
        name: null,
        paraphrases: [] as string[],
        mentor: null as string,
        mentorType: null as string,
        minVideoLength: null as number,
      },
      {
        _id: '511111111111111111111114',
        question: 'Do you like your job?',
        type: 'QUESTION',
        name: null,
        paraphrases: [] as string[],
        mentor: null as string,
        mentorType: null as string,
        minVideoLength: null as number,
      },
      {
        _id: '511111111111111111111117',
        question: 'What is Aaron like?',
        type: 'QUESTION',
        name: null,
        paraphrases: [] as string[],
        mentor: null as string,
        mentorType: null as string,
        minVideoLength: null as number,
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
        hasUntransferredMedia: false,
        media: [
          {
            tag: 'web',
            type: 'video',
            url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/web.mp4',
            needsTransfer: false,
          },
          {
            tag: 'mobile',
            type: 'video',
            url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/mobile.mp4',
            needsTransfer: false,
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
        hasUntransferredMedia: false,
        media: [
          {
            tag: 'web',
            type: 'video',
            url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111117/web.mp4',
            needsTransfer: false,
          },
          {
            tag: 'mobile',
            type: 'video',
            url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111117/mobile.mp4',
            needsTransfer: false,
          },
        ],
      },
    ],
  };

  it('imported mentor specific questions are always created', async () => {
    const json = {
      ...uneditedJson,
      questions: [
        ...uneditedJson.questions,
        {
          _id: '511111111111111111111119',
          question: 'What is Aaron like?',
          type: 'QUESTION',
          name: null,
          paraphrases: [] as string[],
          mentor: '5ffdf41a1ee2c62111111111',
          mentorType: null as string,
          minVideoLength: null as number,
        },
      ],
      subjects: uneditedJson.subjects.map((subj) => {
        if (subj.name == 'Repeat After Me') {
          subj.questions = [
            ...subj.questions,
            {
              question: {
                _id: '511111111111111111111119',
                question: 'What is Aaron like?',
              },
              category: null,
              topics: [{ id: '511111111111111111111125' }],
            },
          ];
        }
        return subj;
      }),
    };
    // overwrite mentor 5ffdf41a1ee2c62111111111 with new mentor
    const token = getToken('5ffdf41a1ee2c62320b49ea4');
    let response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation ImportMentor($mentor: ID!, $json: MentorImportJsonType!, $replacedMentorDataChanges: ReplacedMentorDataChangesType!) {
          me {
            mentorImport(mentor: $mentor, json: $json, replacedMentorDataChanges: $replacedMentorDataChanges) {
              _id
            }
          }
        }`,
        variables: {
          mentor: '5ffdf41a1ee2c62111111111',
          json: json,
          replacedMentorDataChanges: { questionChanges: [], answerChanges: [] },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.mentorImport).to.eql({
      _id: '5ffdf41a1ee2c62111111111',
    });
    // Question document should have been created
    response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query{
        questions(filter:{mentor:"5ffdf41a1ee2c62111111111"}){
          edges{
            node{
              question
            }
          }
        }
      }`,
      });
    expect(response.body.data.questions.edges).to.eql([
      { node: { question: 'What is Aaron like?' } },
    ]);
  });

  it('imported questions that do not match any questions by _id or exact text match are created and are mentor specific', async () => {
    // added a new question to repeat after me, which
    const json = {
      ...uneditedJson,
      questions: [
        ...uneditedJson.questions,
        {
          _id: '511111111111111111111124',
          question: 'New Qustion matches no text or id!?',
          type: 'QUESTION',
          name: null,
          paraphrases: [] as string[],
          mentor: null as string,
          mentorType: null as string,
          minVideoLength: null as number,
        },
      ],
      subjects: uneditedJson.subjects.map((subj) => {
        if (subj.name == 'Repeat After Me') {
          subj.questions = [
            ...subj.questions,
            {
              question: {
                _id: '511111111111111111111124',
                question: 'New Qustion matches no text or id!?',
              },
              category: null,
              topics: [{ id: '511111111111111111111125' }],
            },
          ];
        }
        return subj;
      }),
    };
    const token = getToken('5ffdf41a1ee2c62320b49ea4');
    let response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation ImportMentor($mentor: ID!, $json: MentorImportJsonType!, $replacedMentorDataChanges: ReplacedMentorDataChangesType!) {
        me {
          mentorImport(mentor: $mentor, json: $json, replacedMentorDataChanges: $replacedMentorDataChanges) {
            _id
          }
        }
      }`,
        variables: {
          mentor: '5ffdf41a1ee2c62111111111',
          json: json,
          replacedMentorDataChanges: { questionChanges: [], answerChanges: [] },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.mentorImport).to.eql({
      _id: '5ffdf41a1ee2c62111111111',
    });
    // Question document should have been created
    response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query{
                  questions(filter:{mentor:"5ffdf41a1ee2c62111111111"}){
                    edges{
                      node{
                        question
                        mentor
                      }
                    }
                  }
                }`,
      });
    expect(response.body.data.questions.edges).to.eql([
      {
        node: {
          question: 'New Qustion matches no text or id!?',
          mentor: '5ffdf41a1ee2c62111111111',
        },
      },
    ]);
    // Question should have been added to subject
    response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query{
                  subjects(filter:{name:"Repeat After Me"}){
                    edges{
                      node{
                        questions{
                          question{
                            question
                            mentor
                          }
                        }
                      }
                    }
                  }
                }`,
      });
    expect(response.body.data.subjects.edges).to.eql([
      {
        node: {
          questions: [
            {
              question: {
                question: "Don't talk and stay still.",
                mentor: null,
              },
            },
            {
              question: {
                question: 'New Qustion matches no text or id!?',
                mentor: '5ffdf41a1ee2c62111111111',
              },
            },
          ],
        },
      },
    ]);
  });

  it('when importing a subject that already exists, it should merge questions, topics, and categories with the pre-existing subject document', async () => {
    const json = {
      ...uneditedJson,
      questions: [
        {
          _id: '511111111111111111111124',
          question: 'New Qustion matches no text or id!?',
          type: 'QUESTION',
          name: null as string,
          paraphrases: [] as string[],
          mentor: null as string,
          mentorType: null as string,
          minVideoLength: null as number,
        },
        {
          _id: '511111111111111111111129',
          question: "Don't talk and stay still.",
          type: 'QUESTION',
          name: null as string,
          paraphrases: [] as string[],
          mentor: null as string,
          mentorType: null as string,
          minVideoLength: null as number,
        },
      ],
      subjects: uneditedJson.subjects.map((subj) => {
        // Add new questions but remove old one, removed one should still be there since subjects merge
        if (subj.name == 'Repeat After Me') {
          subj.questions = [
            {
              question: {
                _id: '511111111111111111111124',
                question: 'New Qustion matches no text or id!?',
              },
              category: null,
              topics: [{ id: '511111111111111111111125' }],
            },
          ];
        }
        return subj;
      }),
    };

    const token = getToken('5ffdf41a1ee2c62320b49ea4');
    let response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation ImportMentor($mentor: ID!, $json: MentorImportJsonType!, $replacedMentorDataChanges: ReplacedMentorDataChangesType!) {
        me {
          mentorImport(mentor: $mentor, json: $json, replacedMentorDataChanges: $replacedMentorDataChanges) {
            _id
          }
        }
      }`,
        variables: {
          mentor: '5ffdf41a1ee2c62111111111',
          json: json,
          replacedMentorDataChanges: { questionChanges: [], answerChanges: [] },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.mentorImport).to.eql({
      _id: '5ffdf41a1ee2c62111111111',
    });

    // Question document should have been created
    response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query{
                  questions{
                    edges{
                      node{
                        question
                        mentor
                      }
                    }
                  }
                }`,
      });
    expect(response.body.data.questions.edges).to.eql([
      {
        node: {
          question: 'New Qustion matches no text or id!?',
          mentor: '5ffdf41a1ee2c62111111111',
        },
      },
      {
        node: {
          question: 'What is Aaron like?',
          mentor: null,
        },
      },
      {
        node: {
          question: 'Julia?',
          mentor: '5ffdf41a1ee2c62111111112',
        },
      },
      {
        node: {
          question: 'Is STEM fun?',
          mentor: null,
        },
      },
      {
        node: {
          question: 'Do you like your job?',
          mentor: null,
        },
      },
      {
        node: {
          question: 'How old are you?',
          mentor: null,
        },
      },
      {
        node: {
          question: 'Who are you and what do you do?',
          mentor: null,
        },
      },
      {
        node: {
          question: "Don't talk and stay still.",
          mentor: null,
        },
      },
    ]);
    response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query{
                  subjects(filter:{name:"Repeat After Me"}){
                    edges{
                      node{
                        questions{
                          question{
                            _id
                            question
                            mentor
                          }
                        }
                      }
                    }
                  }
                }`,
      });
    console.log(JSON.stringify(response.body.data.subjects.edges));
    expect(response.body.data.subjects.edges).to.eql([
      {
        node: {
          questions: [
            {
              question: {
                _id: '511111111111111111111111',
                question: "Don't talk and stay still.",
                mentor: null,
              },
            },
            {
              question: {
                _id: '511111111111111111111124',
                question: 'New Qustion matches no text or id!?',
                mentor: '5ffdf41a1ee2c62111111111',
              },
            },
          ],
        },
      },
    ]);
  });

  it('Only answers marked for removal get removed from mentor', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea5');
    const json = {
      ...uneditedJson,
      answers: [] as string[],
    };
    let response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query{
        answer(mentor: "5ffdf41a1ee2c62111111111", question:"511111111111111111111111"){
          question{
            _id
          }
        }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.answer).to.eql({
      question: { _id: '511111111111111111111111' },
    });
    response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation ImportMentor($mentor: ID!, $json: MentorImportJsonType!, $replacedMentorDataChanges: ReplacedMentorDataChangesType!) {
                  me {
                      mentorImport(mentor: $mentor, json: $json, replacedMentorDataChanges: $replacedMentorDataChanges) {
                        _id
                      }
                    }
                  }`,
        variables: {
          mentor: '5ffdf41a1ee2c62111111111',
          json: json,
          replacedMentorDataChanges: {
            questionChanges: [],
            answerChanges: [
              {
                editType: 'REMOVED',
                data: {
                  question: { _id: '511111111111111111111111' },
                  transcript: '',
                  status: '',
                },
              },
            ],
          },
        },
      });
    // console.log(response.body);
    expect(response.status).to.equal(200);
    expect(response.body.data.me.mentorImport).to.eql({
      _id: '5ffdf41a1ee2c62111111111',
    });
    // check that answer was removed
    response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query{
        answer(mentor: "5ffdf41a1ee2c62111111111", question:"511111111111111111111111"){
          question{
            _id
          }
        }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.answer).to.eql(null);
    // check that other answers remain
    response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query{
        answer(mentor: "5ffdf41a1ee2c62111111111", question:"511111111111111111111117"){
          question{
            _id
          }
        }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.answer).to.not.eql(null);
  });

  // it('Importing a mentor with less subjects than the current mentor only keeps imported subjects', async () => {});
});
