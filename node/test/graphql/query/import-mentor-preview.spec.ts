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

describe('import mentor preview', () => {
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

  it(`view changes made if imported`, async () => {
    const json = {
      id: '5ffdf41a1ee2c62111111111',
      subjects: [
        {
          _id: '5ffdf41a1ee2c62320b49eb1',
          name: 'Repeat After Me',
          questions: [
            {
              question: {
                _id: '511111111111111111111111',
                question: "Don't talk and stay still.",
              },
            },
            {
              question: { _id: 'newquestion', question: 'new question' },
            },
          ],
        },
        {
          _id: 'newsubject',
          name: 'New Subject',
          questions: [
            {
              question: { _id: 'newquestion', question: 'new question' },
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
          status: 'COMPLETE',
          question: {
            _id: '511111111111111111111111',
            question: "Don't talk and stay still.",
          },
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
          status: 'COMPLETE',
          question: { _id: 'newquestion', question: 'new question' },
        },
      ],
    };
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query ImportMentorPreview($mentor: ID!, $json: MentorImportJsonType!) {
          mentorImportPreview(mentor: $mentor, json: $json) {
            id
            subjects {
              importData {
                name
              }
              curData {
                name
              }
              editType
            }
            questions {
              importData {
                question
              }
              curData {
                question
              }
              editType
            }
            answers {
              importData {
                transcript
                question {
                  question
                }
                hasUntransferredMedia
                media {
                  type
                  tag
                  url
                  needsTransfer
                }
              }
              curData {
                transcript
                question {
                  question
                }
              }
              editType
            }
          }
        }`,
        variables: { mentor: '5ffdf41a1ee2c62111111111', json },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentorImportPreview).to.eql({
      id: '5ffdf41a1ee2c62111111111',
      subjects: [
        {
          importData: { name: 'Repeat After Me' },
          curData: { name: 'Repeat After Me' },
          editType: 'NONE',
        },
        {
          importData: { name: 'New Subject' },
          curData: null,
          editType: 'CREATED',
        },
        {
          importData: null,
          curData: { name: 'Background' },
          editType: 'REMOVED',
        },
      ],
      questions: [
        {
          importData: { question: "Don't talk and stay still." },
          curData: { question: "Don't talk and stay still." },
          editType: 'NONE',
        },
        {
          importData: { question: 'new question' },
          curData: null,
          editType: 'CREATED',
        },
        {
          importData: null,
          curData: { question: 'Who are you and what do you do?' },
          editType: 'OLD_FOLLOWUP',
        },
        {
          importData: null,
          curData: { question: 'How old are you?' },
          editType: 'OLD_FOLLOWUP',
        },
        {
          importData: null,
          curData: { question: 'Do you like your job?' },
          editType: 'OLD_FOLLOWUP',
        },
        {
          importData: null,
          curData: { question: 'What is Aaron like?' },
          editType: 'OLD_FOLLOWUP',
        },
      ],
      answers: [
        {
          importData: {
            transcript: '[being still]',
            question: { question: "Don't talk and stay still." },
            hasUntransferredMedia: true,
            media: [
              {
                type: 'video',
                tag: 'web',
                url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/web.mp4',
                needsTransfer: true,
              },
              {
                type: 'video',
                tag: 'mobile',
                url: 'https://mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/mobile.mp4',
                needsTransfer: true,
              },
            ],
          },
          curData: {
            transcript: '[being still]',
            question: { question: "Don't talk and stay still." },
          },
          editType: 'NONE',
        },
        {
          importData: {
            transcript: 'new answer',
            question: { question: 'new question' },
            hasUntransferredMedia: null,
            media: null,
          },
          curData: null,
          editType: 'CREATED',
        },
        {
          importData: null,
          curData: {
            transcript: 'Test Transcript',
            question: { question: 'What is Aaron like?' },
          },
          editType: 'OLD_ANSWER',
        },
      ],
    });
  });

  // current mentor == mentor getting replaced
  it('questions that are part of the current mentor and not part of import are marked as OLD_FOLLOWUPS', async () => {
    const json = {
      id: '5ffdf41a1ee2c62111111111',
      subjects: [
        {
          _id: '5ffdf41a1ee2c62320b49eb1',
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
        {
          _id: '511111111111111111111111',
          question: "Don't talk and stay still.",
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
      ],
    };
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query ImportMentorPreview($mentor: ID!, $json: MentorImportJsonType!) {
        mentorImportPreview(mentor: $mentor, json: $json) {
          id
          subjects {
            importData {
              name
            }
            curData {
              name
            }
            editType
          }
          questions {
            importData {
              question
            }
            curData {
              question
            }
            editType
          }
          answers {
            importData {
              transcript
              question {
                question
              }
              hasUntransferredMedia
              media {
                type
                tag
                url
                needsTransfer
              }
            }
            curData {
              transcript
              question {
                question
              }
            }
            editType
          }
        }
      }`,
        variables: { mentor: '5ffdf41a1ee2c62111111111', json },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentorImportPreview).to.eql({
      id: '5ffdf41a1ee2c62111111111',
      subjects: [
        {
          importData: { name: 'Repeat After Me' },
          curData: { name: 'Repeat After Me' },
          editType: 'NONE',
        },
        {
          importData: null,
          curData: { name: 'Background' },
          editType: 'REMOVED',
        },
      ],
      questions: [
        {
          importData: { question: "Don't talk and stay still." },
          curData: { question: "Don't talk and stay still." },
          editType: 'NONE',
        },
        {
          importData: null,
          curData: { question: 'Who are you and what do you do?' },
          editType: 'OLD_FOLLOWUP',
        },
        {
          importData: null,
          curData: { question: 'How old are you?' },
          editType: 'OLD_FOLLOWUP',
        },
        {
          importData: null,
          curData: { question: 'Do you like your job?' },
          editType: 'OLD_FOLLOWUP',
        },
        {
          importData: null,
          curData: { question: 'What is Aaron like?' },
          editType: 'OLD_FOLLOWUP',
        },
      ],
      answers: [
        {
          importData: {
            transcript: '[being still]',
            question: { question: "Don't talk and stay still." },
            hasUntransferredMedia: true,
            media: [
              {
                type: 'video',
                tag: 'web',
                url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/web.mp4',
                needsTransfer: true,
              },
              {
                type: 'video',
                tag: 'mobile',
                url: 'https://mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/mobile.mp4',
                needsTransfer: true,
              },
            ],
          },
          curData: {
            transcript: '[being still]',
            question: { question: "Don't talk and stay still." },
          },
          editType: 'NONE',
        },
        {
          importData: null,
          curData: {
            transcript: 'Test Transcript',
            question: { question: 'What is Aaron like?' },
          },
          editType: 'OLD_ANSWER',
        },
      ],
    });
  });

  // const json = {
  //   id: '5ffdf41a1ee2c62111111111',
  //   subjects: [
  //     {
  //       _id: '5ffdf41a1ee2c62320b49eb2',
  //       name: 'Background',
  //       description:
  //         'These questions will ask general questions about your background that might be relevant to how people understand your career.',
  //       isRequired: true,
  //       topics: [
  //         {
  //           id: '5ffdf41a1ee2c62320b49ec2',
  //           name: 'Background',
  //           description:
  //             'These questions will ask general questions about your background, that might be relevant to how people understand your career',
  //         },
  //         {
  //           id: '5ffdf41a1ee2c62320b49ec3',
  //           name: 'Advice',
  //           description:
  //             'These questions will ask you to give advice to someone who is interested in your career',
  //         },
  //       ],
  //       categories: [
  //         {
  //           id: 'category',
  //           name: 'Category',
  //           description: 'A test category',
  //         },
  //       ],
  //       questions: [
  //         {
  //           question: {
  //             _id: '511111111111111111111112',
  //             question: 'Who are you and what do you do?',
  //           },
  //           category: null,
  //           topics: [
  //             {
  //               id: '5ffdf41a1ee2c62320b49ec2',
  //             },
  //           ],
  //         },
  //         {
  //           question: {
  //             _id: '511111111111111111111113',
  //             question: 'How old are you?',
  //           },
  //           category: {
  //             id: 'category',
  //           },
  //           topics: [
  //             {
  //               id: '5ffdf41a1ee2c62320b49ec2',
  //             },
  //           ],
  //         },
  //         {
  //           question: {
  //             _id: '511111111111111111111114',
  //             question: 'Do you like your job?',
  //           },
  //           category: null,
  //           topics: [
  //             {
  //               id: '5ffdf41a1ee2c62320b49ec3',
  //             },
  //           ],
  //         },
  //         {
  //           question: {
  //             _id: '511111111111111111111117',
  //             question: 'What is Aaron like?',
  //           },
  //           category: {
  //             id: 'category',
  //           },
  //           topics: [],
  //         },
  //       ],
  //     },
  //     {
  //       _id: '5ffdf41a1ee2c62320b49eb1',
  //       name: 'Repeat After Me',
  //       description:
  //         "These are miscellaneous phrases you'll be asked to repeat.",
  //       isRequired: true,
  //       topics: [
  //         {
  //           id: '5ffdf41a1ee2c62320b49ec1',
  //           name: 'Idle',
  //           description: '30-second idle clip',
  //         },
  //       ],
  //       categories: [],
  //       questions: [
  //         {
  //           question: {
  //             _id: '511111111111111111111111',
  //             question: "Don't talk and stay still.",
  //           },
  //           category: null,
  //           topics: [
  //             {
  //               id: '5ffdf41a1ee2c62320b49ec1',
  //             },
  //           ],
  //         },
  //       ],
  //     },
  //   ],
  //   questions: [
  //     {
  //       _id: '511111111111111111111111',
  //       question: "Don't talk and stay still.",
  //       type: 'UTTERANCE',
  //       name: 'idle',
  //       paraphrases: [] as string[],
  //       mentor: null as string,
  //       mentorType: null as string,
  //       minVideoLength: null as number,
  //     },
  //     {
  //       _id: '511111111111111111111112',
  //       question: 'Who are you and what do you do?',
  //       type: 'QUESTION',
  //       name: null,
  //       paraphrases: [] as string[],
  //       mentor: null as string,
  //       mentorType: null as string,
  //       minVideoLength: null as number,
  //     },
  //     {
  //       _id: '511111111111111111111113',
  //       question: 'How old are you?',
  //       type: 'QUESTION',
  //       name: null,
  //       paraphrases: [] as string[],
  //       mentor: null as string,
  //       mentorType: null as string,
  //       minVideoLength: null as number,
  //     },
  //     {
  //       _id: '511111111111111111111114',
  //       question: 'Do you like your job?',
  //       type: 'QUESTION',
  //       name: null,
  //       paraphrases: [] as string[],
  //       mentor: null as string,
  //       mentorType: null as string,
  //       minVideoLength: null as number,
  //     },
  //     {
  //       _id: '511111111111111111111117',
  //       question: 'What is Aaron like?',
  //       type: 'QUESTION',
  //       name: null,
  //       paraphrases: [] as string[],
  //       mentor: null as string,
  //       mentorType: null as string,
  //       minVideoLength: null as number,
  //     },
  //   ],
  //   answers: [
  //     {
  //       transcript: '[being still]',
  //       status: 'COMPLETE',
  //       question: {
  //         _id: '511111111111111111111111',
  //         question: "Don't talk and stay still.",
  //       },
  //       hasUntransferredMedia: false,
  //       media: [
  //         {
  //           tag: 'web',
  //           type: 'video',
  //           url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/web.mp4',
  //           needsTransfer: false,
  //         },
  //         {
  //           tag: 'mobile',
  //           type: 'video',
  //           url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/mobile.mp4',
  //           needsTransfer: false,
  //         },
  //       ],
  //     },
  //     {
  //       transcript: 'Test Transcript',
  //       status: 'COMPLETE',
  //       question: {
  //         _id: '511111111111111111111117',
  //         question: 'What is Aaron like?',
  //       },
  //       hasUntransferredMedia: false,
  //       media: [
  //         {
  //           tag: 'web',
  //           type: 'video',
  //           url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111117/web.mp4',
  //           needsTransfer: false,
  //         },
  //         {
  //           tag: 'mobile',
  //           type: 'video',
  //           url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111117/mobile.mp4',
  //           needsTransfer: false,
  //         },
  //       ],
  //     },
  //   ],
  // }

  it('questions that are not part of current mentor and are part of importing mentor are marked as CREATED', async () => {
    const json = {
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
        {
          _id: '511111111111111111111125',
          question: 'New question to be created!',
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
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query ImportMentorPreview($mentor: ID!, $json: MentorImportJsonType!) {
        mentorImportPreview(mentor: $mentor, json: $json) {
          id
          subjects {
            importData {
              name
            }
            curData {
              name
            }
            editType
          }
          questions {
            importData {
              question
            }
            curData {
              question
            }
            editType
          }
          answers {
            importData {
              transcript
              question {
                question
              }
              hasUntransferredMedia
              media {
                type
                tag
                url
                needsTransfer
              }
            }
            curData {
              transcript
              question {
                question
              }
            }
            editType
          }
        }
      }`,
        variables: { mentor: '5ffdf41a1ee2c62111111111', json },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentorImportPreview).to.eql({
      id: '5ffdf41a1ee2c62111111111',
      subjects: [
        {
          importData: {
            name: 'Background',
          },
          curData: {
            name: 'Background',
          },
          editType: 'NONE',
        },
        {
          importData: {
            name: 'Repeat After Me',
          },
          curData: {
            name: 'Repeat After Me',
          },
          editType: 'NONE',
        },
      ],
      questions: [
        {
          importData: {
            question: "Don't talk and stay still.",
          },
          curData: {
            question: "Don't talk and stay still.",
          },
          editType: 'NONE',
        },
        {
          importData: {
            question: 'Who are you and what do you do?',
          },
          curData: {
            question: 'Who are you and what do you do?',
          },
          editType: 'NONE',
        },
        {
          importData: {
            question: 'How old are you?',
          },
          curData: {
            question: 'How old are you?',
          },
          editType: 'NONE',
        },
        {
          importData: {
            question: 'Do you like your job?',
          },
          curData: {
            question: 'Do you like your job?',
          },
          editType: 'NONE',
        },
        {
          importData: {
            question: 'What is Aaron like?',
          },
          curData: {
            question: 'What is Aaron like?',
          },
          editType: 'NONE',
        },
        {
          importData: {
            question: 'New question to be created!',
          },
          curData: null,
          editType: 'CREATED',
        },
      ],
      answers: [
        {
          importData: {
            transcript: '[being still]',
            question: {
              question: "Don't talk and stay still.",
            },
            hasUntransferredMedia: true,
            media: [
              {
                type: 'video',
                tag: 'web',
                url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/web.mp4',
                needsTransfer: true,
              },
              {
                type: 'video',
                tag: 'mobile',
                url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/mobile.mp4',
                needsTransfer: true,
              },
            ],
          },
          curData: {
            transcript: '[being still]',
            question: {
              question: "Don't talk and stay still.",
            },
          },
          editType: 'NONE',
        },
        {
          importData: {
            transcript: 'Test Transcript',
            question: {
              question: 'What is Aaron like?',
            },
            hasUntransferredMedia: true,
            media: [
              {
                type: 'video',
                tag: 'web',
                url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111117/web.mp4',
                needsTransfer: true,
              },
              {
                type: 'video',
                tag: 'mobile',
                url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111117/mobile.mp4',
                needsTransfer: true,
              },
            ],
          },
          curData: {
            transcript: 'Test Transcript',
            question: {
              question: 'What is Aaron like?',
            },
          },
          editType: 'NONE',
        },
      ],
    });
  });

  it('imported mentor specific questions are marked as CREATED, despite same _id or exact text match to existing question', async () => {
    const json = {
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
        {
          _id: '511111111111111111111117',
          question: 'Matches by _id, but mentor specific, so create',
          type: 'QUESTION',
          name: null,
          paraphrases: [] as string[],
          mentor: '5ffdf41a1ee2c62111111111',
          mentorType: null as string,
          minVideoLength: null as number,
        },
        // Matches by exact text, but mentor specific, so it gets created
        {
          _id: '511111111111111111111134',
          question: 'What is Aaron like?',
          type: 'QUESTION',
          name: null,
          paraphrases: [] as string[],
          mentor: '5ffdf41a1ee2c62111111111',
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
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query ImportMentorPreview($mentor: ID!, $json: MentorImportJsonType!) {
      mentorImportPreview(mentor: $mentor, json: $json) {
        id
        subjects {
          importData {
            name
          }
          curData {
            name
          }
          editType
        }
        questions {
          importData {
            question
          }
          curData {
            question
          }
          editType
        }
        answers {
          importData {
            transcript
            question {
              question
            }
            hasUntransferredMedia
            media {
              type
              tag
              url
              needsTransfer
            }
          }
          curData {
            transcript
            question {
              question
            }
          }
          editType
        }
      }
    }`,
        variables: { mentor: '5ffdf41a1ee2c62111111111', json },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentorImportPreview).to.eql({
      id: '5ffdf41a1ee2c62111111111',
      subjects: [
        {
          importData: { name: 'Background' },
          curData: { name: 'Background' },
          editType: 'NONE',
        },
        {
          importData: { name: 'Repeat After Me' },
          curData: { name: 'Repeat After Me' },
          editType: 'NONE',
        },
      ],
      questions: [
        {
          importData: { question: "Don't talk and stay still." },
          curData: { question: "Don't talk and stay still." },
          editType: 'NONE',
        },
        {
          importData: { question: 'Who are you and what do you do?' },
          curData: { question: 'Who are you and what do you do?' },
          editType: 'NONE',
        },
        {
          importData: { question: 'How old are you?' },
          curData: { question: 'How old are you?' },
          editType: 'NONE',
        },
        {
          importData: { question: 'Do you like your job?' },
          curData: { question: 'Do you like your job?' },
          editType: 'NONE',
        },
        {
          importData: { question: 'What is Aaron like?' },
          curData: { question: 'What is Aaron like?' },
          editType: 'NONE',
        },
        {
          importData: {
            question: 'Matches by _id, but mentor specific, so create',
          },
          curData: null,
          editType: 'CREATED',
        },
        {
          importData: { question: 'What is Aaron like?' },
          curData: null,
          editType: 'CREATED',
        },
      ],
      answers: [
        {
          importData: {
            transcript: '[being still]',
            question: { question: "Don't talk and stay still." },
            hasUntransferredMedia: true,
            media: [
              {
                type: 'video',
                tag: 'web',
                url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/web.mp4',
                needsTransfer: true,
              },
              {
                type: 'video',
                tag: 'mobile',
                url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/mobile.mp4',
                needsTransfer: true,
              },
            ],
          },
          curData: {
            transcript: '[being still]',
            question: { question: "Don't talk and stay still." },
          },
          editType: 'NONE',
        },
        {
          importData: {
            transcript: 'Test Transcript',
            question: { question: 'What is Aaron like?' },
            hasUntransferredMedia: true,
            media: [
              {
                type: 'video',
                tag: 'web',
                url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111117/web.mp4',
                needsTransfer: true,
              },
              {
                type: 'video',
                tag: 'mobile',
                url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111117/mobile.mp4',
                needsTransfer: true,
              },
            ],
          },
          curData: {
            transcript: 'Test Transcript',
            question: { question: 'What is Aaron like?' },
          },
          editType: 'NONE',
        },
      ],
    });
  });

  it('imported questions that do not match any questions by _id or exact text match are marked as CREATED', async () => {
    const json = {
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
        {
          _id: '511111111111111111111123',
          question: 'New Question',
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
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query ImportMentorPreview($mentor: ID!, $json: MentorImportJsonType!) {
        mentorImportPreview(mentor: $mentor, json: $json) {
          id
          subjects {
            importData {
              name
            }
            curData {
              name
            }
            editType
          }
          questions {
            importData {
              question
            }
            curData {
              question
            }
            editType
          }
          answers {
            importData {
              transcript
              question {
                question
              }
              hasUntransferredMedia
              media {
                type
                tag
                url
                needsTransfer
              }
            }
            curData {
              transcript
              question {
                question
              }
            }
            editType
          }
        }
      }`,
        variables: { mentor: '5ffdf41a1ee2c62111111111', json },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentorImportPreview).to.eql({
      id: '5ffdf41a1ee2c62111111111',
      subjects: [
        {
          importData: {
            name: 'Background',
          },
          curData: {
            name: 'Background',
          },
          editType: 'NONE',
        },
        {
          importData: {
            name: 'Repeat After Me',
          },
          curData: {
            name: 'Repeat After Me',
          },
          editType: 'NONE',
        },
      ],
      questions: [
        {
          importData: {
            question: "Don't talk and stay still.",
          },
          curData: {
            question: "Don't talk and stay still.",
          },
          editType: 'NONE',
        },
        {
          importData: {
            question: 'Who are you and what do you do?',
          },
          curData: {
            question: 'Who are you and what do you do?',
          },
          editType: 'NONE',
        },
        {
          importData: {
            question: 'How old are you?',
          },
          curData: {
            question: 'How old are you?',
          },
          editType: 'NONE',
        },
        {
          importData: {
            question: 'Do you like your job?',
          },
          curData: {
            question: 'Do you like your job?',
          },
          editType: 'NONE',
        },
        {
          importData: {
            question: 'What is Aaron like?',
          },
          curData: {
            question: 'What is Aaron like?',
          },
          editType: 'NONE',
        },
        {
          importData: {
            question: 'New Question',
          },
          curData: null,
          editType: 'CREATED',
        },
      ],
      answers: [
        {
          importData: {
            transcript: '[being still]',
            question: {
              question: "Don't talk and stay still.",
            },
            hasUntransferredMedia: true,
            media: [
              {
                type: 'video',
                tag: 'web',
                url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/web.mp4',
                needsTransfer: true,
              },
              {
                type: 'video',
                tag: 'mobile',
                url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111111/mobile.mp4',
                needsTransfer: true,
              },
            ],
          },
          curData: {
            transcript: '[being still]',
            question: {
              question: "Don't talk and stay still.",
            },
          },
          editType: 'NONE',
        },
        {
          importData: {
            transcript: 'Test Transcript',
            question: {
              question: 'What is Aaron like?',
            },
            hasUntransferredMedia: true,
            media: [
              {
                type: 'video',
                tag: 'web',
                url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111117/web.mp4',
                needsTransfer: true,
              },
              {
                type: 'video',
                tag: 'mobile',
                url: 'https://static.mentorpal.org/videos/5ffdf41a1ee2c62111111111/511111111111111111111117/mobile.mp4',
                needsTransfer: true,
              },
            ],
          },
          curData: {
            transcript: 'Test Transcript',
            question: {
              question: 'What is Aaron like?',
            },
          },
          editType: 'NONE',
        },
      ],
    });
  });
});
