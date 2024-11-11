/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
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
import { MentorDirtyReason } from '../../../constants';
import AnswerModel from '../../../../src/models/Answer';
const answerMutation = `mutation UploadAnswer($mentorId: ID!, $questionId: ID!, $answer: UploadAnswerType!) {
  api {
    uploadAnswer(mentorId: $mentorId, questionId: $questionId, answer: $answer)
  }
}`;

describe('uploadAnswer', () => {
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

  it(`throws an error if no api key`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: answerMutation,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          answer: {},
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Only authenticated users'
    );
  });

  it(`throws an error if invalid api key`, async () => {
    const response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer asdfdsadf`)
      .send({
        query: answerMutation,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          answer: {},
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Only authenticated users'
    );
  });

  it(`doesn't accept unaccepted fields`, async () => {
    const response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: `mutation UploadAnswer($mentorId: ID!, $questionId: ID!, $answer: UploadAnswerType!) {
          api {
            uploadAnswer(mentorId: $mentorId, questionId: $questionId, answer: $answer, hello: "hi")
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          answer: {},
        },
      });
    expect(response.status).to.equal(400);
  });

  it(`doesn't accept invalid fields`, async () => {
    const response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: answerMutation,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          answer: 'no',
        },
      });
    expect(response.status).to.equal(500);
  });

  it('updates answer transcript', async () => {
    const response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: answerMutation,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          answer: {
            transcript:
              "My name is Clint Anderson and I'm a Nuclear Electrician's Mate",
          },
        },
      });

    const answers = await AnswerModel.find({
      mentor: '5ffdf41a1ee2c62111111111',
      question: '511111111111111111111112',
    });

    expect(response.status).to.equal(200);
    expect(response.body.data.api.uploadAnswer).to.eql(true);
    const r2 = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          mentor(id: "5ffdf41a1ee2c62111111111") {
            answers {
              transcript
              status
              question {
                _id
              }
            }
          }
      }`,
      });
    expect(r2.status).to.equal(200);
    const updatedAnswer = r2.body.data.mentor.answers.find(
      (a: any) => a.question._id === '511111111111111111111112'
    );
    expect(updatedAnswer).to.eql({
      transcript:
        "My name is Clint Anderson and I'm a Nuclear Electrician's Mate",
      status: 'NONE',
      question: {
        _id: '511111111111111111111112',
      },
    });
  });

  it('updates answer wistiaId', async () => {
    const response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: answerMutation,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          answer: {
            externalVideoIds: {
              wistiaId: 'test-wistia-id',
            },
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.api.uploadAnswer).to.eql(true);
    const r2 = await request(app)
      .post('/graphql')
      .send({
        query: `query { 
          mentor(id: "5ffdf41a1ee2c62111111111") {
            answers {
              question{
                _id
              }
              externalVideoIds{
                wistiaId
              }
            }
          }
      }`,
      });
    expect(r2.status).to.equal(200);
    const updatedAnswer = r2.body.data.mentor.answers.find(
      (a: any) => a.question._id === '511111111111111111111112'
    );
    expect(updatedAnswer).to.eql({
      question: {
        _id: '511111111111111111111112',
      },
      externalVideoIds: {
        wistiaId: 'test-wistia-id',
      },
    });
  });

  it('sets mentor to dirty', async () => {
    const response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: answerMutation,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          answer: {
            externalVideoIds: {
              wistiaId: 'test-wistia-id',
            },
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.api.uploadAnswer).to.eql(true);
    const r2 = await request(app)
      .post('/graphql')
      .send({
        query: `query { 
          mentor(id: "5ffdf41a1ee2c62111111111") {
            isDirty
            dirtyReason
          }
      }`,
      });
    expect(r2.status).to.equal(200);
    expect(r2.body.data.mentor.isDirty).to.eql(true);
    expect(r2.body.data.mentor.dirtyReason).to.eql(
      MentorDirtyReason.ANSWERS_ADDED
    );
  });

  it('updates correct media', async () => {
    let response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: answerMutation,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          answer: {
            transcript:
              "My name is Clint Anderson and I'm a Nuclear Electrician's Mate",
            webMedia: {
              type: 'video',
              tag: 'web',
              url: `${process.env.STATIC_URL_BASE}/video.mp4`,
              transparentVideoUrl: `${process.env.STATIC_URL_BASE}/video.webm`,
              hash: '123',
              stringMetadata: "{'fake': 'metadata'}",
              vttText: 'fake-vtt-text',
              duration: 1.5,
            },
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.api.uploadAnswer).to.eql(true);
    // send twice:
    response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: answerMutation,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          answer: {
            transcript:
              "My name is Clint Anderson and I'm a Nuclear Electrician's Mate",
            webMedia: {
              type: 'video',
              tag: 'web',
              url: `${process.env.STATIC_URL_BASE}/video.mp4`,
              transparentVideoUrl: `${process.env.STATIC_URL_BASE}/video.webm`,
              hash: '123',
              stringMetadata: "{'fake': 'metadata'}",
              vttText: 'fake-vtt-text',
              duration: 1.5,
            },
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.api.uploadAnswer).to.eql(true);
    const r2 = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          mentor(id: "5ffdf41a1ee2c62111111111") {
            answers {
              transcript
              status
              webMedia{
                hash
                stringMetadata
                vttText
                duration
                type
                tag
                url
                transparentVideoUrl
              }
              question {
                _id
              }
            }
          }
      }`,
      });
    expect(r2.status).to.equal(200);
    const updatedAnswer = r2.body.data.mentor.answers.find(
      (a: any) => a.question._id === '511111111111111111111112'
    );
    expect(updatedAnswer.webMedia).to.eql({
      type: 'video',
      tag: 'web',
      url: `${process.env.STATIC_URL_BASE}/video.mp4`,
      transparentVideoUrl: `${process.env.STATIC_URL_BASE}/video.webm`,
      hash: '123',
      stringMetadata: "{'fake': 'metadata'}",
      vttText: 'fake-vtt-text',
      duration: 1.5,
    });
  });

  it('uploads video with transcript', async () => {
    const response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: answerMutation,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          answer: {
            transcript:
              "My name is Clint Anderson and I'm a Nuclear Electrician's Mate",
            webMedia: {
              type: 'video',
              tag: 'web',
              url: `${process.env.STATIC_URL_BASE}/video.mp4`,
            },
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.api.uploadAnswer).to.eql(true);
    const r2 = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          mentor(id: "5ffdf41a1ee2c62111111111") {
            answers {
              transcript
              status
              webMedia {
                type
                tag
                url
              }
              question {
                _id
              }
            }
          }
      }`,
      });
    expect(r2.status).to.equal(200);
    const updatedAnswer = r2.body.data.mentor.answers.find(
      (a: any) => a.question._id === '511111111111111111111112'
    );
    expect(updatedAnswer).to.eql({
      transcript:
        "My name is Clint Anderson and I'm a Nuclear Electrician's Mate",
      status: 'NONE',
      webMedia: {
        type: 'video',
        tag: 'web',
        url: `${process.env.STATIC_URL_BASE}/video.mp4`,
      },
      question: {
        _id: '511111111111111111111112',
      },
    });
  });

  it('sets needsTransfer to false for any relative media path', async () => {
    const response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: answerMutation,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          answer: {
            transcript:
              "My name is Clint Anderson and I'm a Nuclear Electrician's Mate",
            webMedia: {
              type: 'video',
              tag: 'web',
              url: `video.mp4`,
            },
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.api.uploadAnswer).to.eql(true);
    const answer = await request(app)
      .post('/graphql')
      .send({
        query: `query Answer($mentor: ID!, $question: ID!) {
          answer(mentor: $mentor, question: $question) {
            hasUntransferredMedia
            webMedia {
              type
              tag
              url
              needsTransfer
            }
          }
        }`,
        variables: {
          mentor: '5ffdf41a1ee2c62111111111',
          question: '511111111111111111111112',
        },
      });
    expect(answer.status).to.equal(200);
    expect(answer.body.data.answer).to.eql({
      hasUntransferredMedia: false,
      webMedia: {
        type: 'video',
        tag: 'web',
        url: `${process.env.STATIC_URL_BASE}/video.mp4`,
        needsTransfer: false,
      },
    });
  });

  it('sets needsTransfer to true for any absolute media url that is not the current-site static domain', async () => {
    const response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: answerMutation,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          answer: {
            transcript:
              "My name is Clint Anderson and I'm a Nuclear Electrician's Mate",
            webMedia: {
              type: 'video',
              tag: 'web',
              url: `https://different.mentorpal.org/video.mp4`,
            },
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.api.uploadAnswer).to.eql(true);
    const answer = await request(app)
      .post('/graphql')
      .send({
        query: `query Answer($mentor: ID!, $question: ID!) {
      answer(mentor: $mentor, question: $question) {
        hasUntransferredMedia
        webMedia {
          type
          tag
          url
          needsTransfer
        }
      }
    }`,
        variables: {
          mentor: '5ffdf41a1ee2c62111111111',
          question: '511111111111111111111112',
        },
      });
    expect(answer.status).to.equal(200);
    expect(answer.body.data.answer).to.eql({
      hasUntransferredMedia: true,
      webMedia: {
        type: 'video',
        tag: 'web',
        url: `https://different.mentorpal.org/video.mp4`,
        needsTransfer: true,
      },
    });
  });

  it('parses absolute urls for the current site domain and makes them relative', async () => {
    const response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: answerMutation,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          answer: {
            transcript:
              "My name is Clint Anderson and I'm a Nuclear Electrician's Mate",
            webMedia: {
              type: 'video',
              tag: 'web',
              url: `${process.env.STATIC_URL_BASE}/video.mp4`,
            },
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.api.uploadAnswer).to.eql(true);
    const answer = await request(app)
      .post('/graphql')
      .send({
        query: `query Answer($mentor: ID!, $question: ID!) {
        answer(mentor: $mentor, question: $question) {
          hasUntransferredMedia
          webMedia {
            type
            tag
            url
            needsTransfer
          }
        }
      }`,
        variables: {
          mentor: '5ffdf41a1ee2c62111111111',
          question: '511111111111111111111112',
        },
      });
    expect(answer.status).to.equal(200);
    expect(answer.body.data.answer).to.eql({
      hasUntransferredMedia: false,
      webMedia: {
        type: 'video',
        tag: 'web',
        url: `${process.env.STATIC_URL_BASE}/video.mp4`,
        needsTransfer: false,
      },
    });
  });

  it('can set hasEditedTranscript', async () => {
    const precheck = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        mentor(id: "5ffdf41a1ee2c62111111111") {
          answers {
            hasEditedTranscript
            question {
              _id
            }
          }
        }
    }`,
      });
    expect(precheck.status).to.equal(200);
    let updatedAnswer = precheck.body.data.mentor.answers.find(
      (a: any) => a.question._id === '511111111111111111111111'
    );
    expect(updatedAnswer).to.eql({
      hasEditedTranscript: true,
      question: {
        _id: '511111111111111111111111',
      },
    });

    const response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: answerMutation,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111111',
          answer: {
            hasEditedTranscript: false,
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.api.uploadAnswer).to.eql(true);
    const r2 = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        mentor(id: "5ffdf41a1ee2c62111111111") {
          answers {
            hasEditedTranscript
            question {
              _id
            }
          }
        }
    }`,
      });
    expect(r2.status).to.equal(200);
    updatedAnswer = r2.body.data.mentor.answers.find(
      (a: any) => a.question._id === '511111111111111111111111'
    );
    expect(updatedAnswer).to.eql({
      hasEditedTranscript: false,
      question: {
        _id: '511111111111111111111111',
      },
    });
  });
});
