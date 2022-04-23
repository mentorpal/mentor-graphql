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
import { getToken } from '../../../helpers';

describe('uploadTaskUpdate', () => {
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
        query: `mutation UpdateUploadTask($mentorId: ID!, $questionId: ID!, $status: UploadTaskInputType!) {
          api {
            uploadTaskUpdate(mentorId: $mentorId, questionId: $questionId, status: $status)
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          status: {
            originalMedia: {
              type: 'video',
              tag: 'web',
              url: '',
            },
          },
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
        query: `mutation UpdateUploadTask($mentorId: ID!, $questionId: ID!, $status: UploadTaskInputType!) {
          api {
            uploadTaskUpdate(mentorId: $mentorId, questionId: $questionId, status: $status)
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          status: {
            originalMedia: {
              type: 'video',
              tag: 'web',
              url: '',
            },
          },
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
        query: `mutation UpdateUploadTask($mentorId: ID!, $questionId: ID!, $status: UploadTaskInputType!) {
          api {
            uploadTaskUpdate(mentorId: $mentorId, questionId: $questionId, status: $status, hello: "hi")
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          status: {
            transcodeWebTask: {
              task_name: 'transcode',
              status: 'IN_PROGRESS',
            },
          },
        },
      });
    expect(response.status).to.equal(400);
  });

  it('properly creates tasks', async () => {
    const update = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: `mutation UpdateUploadTask($mentorId: ID!, $questionId: ID!, $status: UploadTaskInputType!) {
          api {
            uploadTaskUpdate(mentorId: $mentorId, questionId: $questionId, status: $status)
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          status: {
            transcodeWebTask: {
              task_name: 'transcode',
              status: 'IN_PROGRESS',
            },
          },
        },
      });
    expect(update.status).to.equal(200);
    expect(update.body.data.api.uploadTaskUpdate).to.eql(true);

    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
            me {
              uploadTasks {
                mentor {
                  _id
                }
                question {
                  _id
                  question
                }
                transcript
                transcodeWebTask{
                  task_name
                  status
                }
              }
            }
          }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.uploadTasks).to.eql([
      {
        mentor: {
          _id: '5ffdf41a1ee2c62111111111',
        },
        question: {
          _id: '511111111111111111111112',
          question: 'Who are you and what do you do?',
        },
        transcript: 'fake_transcript',
        transcodeWebTask: {
          task_name: 'transcode',
          status: 'IN_PROGRESS',
        },
      },
    ]);
  });

  it(`doesn't accept invalid fields`, async () => {
    const response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: `mutation UpdateUploadTask($mentorId: ID!, $questionId: ID!, $status: UploadTaskInputType!) {
          api {
            uploadTaskUpdate(mentorId: $mentorId, questionId: $questionId, status: $status)
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          status: 'no thanks',
        },
      });
    expect(response.status).to.equal(500);
  });

  it('updates upload task', async () => {
    const update = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: `mutation UpdateUploadTask($mentorId: ID!, $questionId: ID!, $status: UploadTaskInputType!) {
          api {
            uploadTaskUpdate(mentorId: $mentorId, questionId: $questionId, status: $status)
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          status: {
            transcodeWebTask: {
              task_name: 'transcode',
              status: 'IN_PROGRESS',
            },
            transcript: 'My name is Clinton Anderson',
            originalMedia: { type: 'video', tag: 'original', url: 'video.mp4' },
          },
        },
      });
    expect(update.status).to.equal(200);
    expect(update.body.data.api.uploadTaskUpdate).to.eql(true);

    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
            me {
              uploadTasks {
                mentor {
                  _id
                }
                question {
                  _id
                  question
                }
                transcodeWebTask{
                  task_name
                  status
                }
                transcript
                originalMedia {
                  type
                  tag
                  url
                }
              }
            }
          }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.uploadTasks).to.eql([
      {
        mentor: {
          _id: '5ffdf41a1ee2c62111111111',
        },
        question: {
          _id: '511111111111111111111112',
          question: 'Who are you and what do you do?',
        },
        transcodeWebTask: {
          task_name: 'transcode',
          status: 'IN_PROGRESS',
        },
        transcript: 'My name is Clinton Anderson',
        originalMedia: {
          type: 'video',
          tag: 'original',
          url: 'https://static.mentorpal.org/video.mp4',
        },
      },
    ]);
  });

  it('creates upload task', async () => {
    const update = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: `mutation UpdateUploadTask($mentorId: ID!, $questionId: ID!, $status: UploadTaskInputType!) {
          api {
            uploadTaskUpdate(mentorId: $mentorId, questionId: $questionId, status: $status)
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111113',
          status: {
            transcodeWebTask: {
              task_name: 'transcode',
              status: 'IN_PROGRESS',
            },
          },
        },
      });
    expect(update.status).to.equal(200);
    expect(update.body.data.api.uploadTaskUpdate).to.eql(true);

    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
            me {
              uploadTasks {
                mentor {
                  _id
                }
                question {
                  _id
                  question
                }
                transcodeWebTask{
                  task_name
                  status
                }
                transcript
                originalMedia {
                  type
                  tag
                  url
                }
              }
            }
          }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.uploadTasks).to.eql([
      {
        mentor: {
          _id: '5ffdf41a1ee2c62111111111',
        },
        question: {
          _id: '511111111111111111111112',
          question: 'Who are you and what do you do?',
        },
        transcodeWebTask: null,
        transcript: 'fake_transcript',
        originalMedia: null,
      },
      {
        mentor: {
          _id: '5ffdf41a1ee2c62111111111',
        },
        question: {
          _id: '511111111111111111111113',
          question: 'How old are you?',
        },
        transcodeWebTask: {
          task_name: 'transcode',
          status: 'IN_PROGRESS',
        },
        transcript: null,
        originalMedia: null,
      },
    ]);
  });

  it('updates task status one at a time', async () => {
    const updateWeb = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: `mutation UpdateUploadTaskStatus($mentorId: ID!, $questionId: ID!, $transcodeWebTask: TaskInfoInputType) {
          api {
            uploadTaskStatusUpdate(mentorId: $mentorId, questionId: $questionId, transcodeWebTask: $transcodeWebTask)
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          transcodeWebTask: {
            task_name: 'transcribe',
            status: 'DONE',
          },
        },
      });
    expect(updateWeb.status).to.equal(200);
    expect(updateWeb.body.data.api.uploadTaskStatusUpdate).to.eql(true);
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const updateWebResponse = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
            me {
              uploadTasks {
                transcodeWebTask{
                  task_name
                  status
                }
                transcodeMobileTask{
                  task_name
                  status
                }
                transcribeTask{
                  task_name
                  status
                }
              }
            }
          }`,
      });
    expect(updateWebResponse.status).to.equal(200);
    expect(updateWebResponse.body.data.me.uploadTasks).to.eql([
      {
        transcodeWebTask: {
          task_name: 'transcribe',
          status: 'DONE',
        },
        transcodeMobileTask: null,
        transcribeTask: {
          task_name: 'transcribe',
          status: 'IN_PROGRESS',
        },
      },
    ]);
    const updateMobile = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: `mutation UpdateUploadTaskStatus($mentorId: ID!, $questionId: ID!, $transcodeMobileTask: TaskInfoInputType) {
        api {
          uploadTaskStatusUpdate(mentorId: $mentorId, questionId: $questionId, transcodeMobileTask: $transcodeMobileTask)
        }
      }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          transcodeMobileTask: {
            task_name: 'transcode-mobile',
            status: 'DONE',
          },
        },
      });
    expect(updateMobile.status).to.equal(200);
    expect(updateMobile.body.data.api.uploadTaskStatusUpdate).to.eql(true);
    const updateMobileResponse = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          me {
            uploadTasks {
              transcodeWebTask{
                task_name
                status
              }
              transcodeMobileTask{
                task_name
                status
              }
              transcribeTask{
                task_name
                status
              }
            }
          }
        }`,
      });
    expect(updateMobileResponse.status).to.equal(200);
    expect(updateMobileResponse.body.data.me.uploadTasks).to.eql([
      {
        transcodeWebTask: {
          task_name: 'transcribe',
          status: 'DONE',
        },
        transcodeMobileTask: {
          task_name: 'transcode-mobile',
          status: 'DONE',
        },
        transcribeTask: {
          task_name: 'transcribe',
          status: 'IN_PROGRESS',
        },
      },
    ]);

    const updateTramscribe = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: `mutation UpdateUploadTaskStatus($mentorId: ID!, $questionId: ID!, $transcribeTask: TaskInfoInputType) {
          api {
            uploadTaskStatusUpdate(mentorId: $mentorId, questionId: $questionId, transcribeTask: $transcribeTask)
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          transcribeTask: {
            status: 'DONE',
          },
        },
      });
    expect(updateTramscribe.status).to.equal(200);
    expect(updateTramscribe.body.data.api.uploadTaskStatusUpdate).to.eql(true);
    const updateTranscribeResponse = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
            me {
              uploadTasks {
                transcodeWebTask{
                  task_name
                  status
                }
                transcodeMobileTask{
                  task_name
                  status
                }
                transcribeTask{
                  task_name
                  status
                }
              }
            }
          }`,
      });
    expect(updateTranscribeResponse.status).to.equal(200);
    expect(updateTranscribeResponse.body.data.me.uploadTasks).to.eql([
      {
        transcodeWebTask: {
          task_name: 'transcribe',
          status: 'DONE',
        },
        transcodeMobileTask: {
          task_name: 'transcode-mobile',
          status: 'DONE',
        },
        transcribeTask: {
          task_name: 'transcribe',
          status: 'DONE',
        },
      },
    ]);
  });

  it('updates original media', async () => {
    const updateOriginalMedia = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: `mutation UpdateUploadTaskStatus($mentorId: ID!, $questionId: ID!, $originalMedia: AnswerMediaInputType) {
          api {
            uploadTaskStatusUpdate(mentorId: $mentorId, questionId: $questionId, originalMedia: $originalMedia)
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          originalMedia: {
            type: 'video',
            tag: 'web',
            url: 'http://random.url/',
          },
        },
      });
    expect(updateOriginalMedia.status).to.equal(200);
    expect(updateOriginalMedia.body.data.api.uploadTaskStatusUpdate).to.eql(
      true
    );
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const updateOriginalMediaResponse = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
            me {
              uploadTasks {
                transcodeWebTask{
                  task_name
                  status
                }
                transcodeMobileTask{
                  task_name
                  status
                }
                transcribeTask{
                  task_name
                  status
                }
                originalMedia{
                  type
                  tag
                  url
                }
              }
            }
          }`,
      });
    expect(updateOriginalMediaResponse.status).to.equal(200);
    expect(updateOriginalMediaResponse.body.data.me.uploadTasks).to.eql([
      {
        transcodeWebTask: null,
        transcodeMobileTask: null,
        transcribeTask: {
          task_name: 'transcribe',
          status: 'IN_PROGRESS',
        },
        originalMedia: {
          type: 'video',
          tag: 'web',
          url: 'http://random.url/',
        },
      },
    ]);
  });

  it('doesnt allow multiple task updates in the same mutation', async () => {
    const response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: `mutation UpdateUploadTaskStatus($mentorId: ID!, $questionId: ID!, $transcodeWebTask: TaskInfoInputType, $transcodeMobileTask: TaskInfoInputType) {
        api {
          uploadTaskStatusUpdate(mentorId: $mentorId, questionId: $questionId, transcodeWebTask: $transcodeWebTask, transcodeMobileTask: $transcodeMobileTask)
        }
      }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          transcodeWebTask: {
            task_name: 'transcribe',
            status: 'DONE',
          },
          transcodeMobileTask: {
            task_name: 'transcribe',
            status: 'DONE',
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Please only input one task to update at a time.'
    );
  });

  it('updates transcript in task status update', async () => {
    const update = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: `mutation UpdateUploadTaskStatus($mentorId: ID!, $questionId: ID!, $transcript: String!, $originalMedia: AnswerMediaInputType) {
          api {
            uploadTaskStatusUpdate(mentorId: $mentorId, questionId: $questionId, transcript: $transcript, originalMedia: $originalMedia)
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          transcript: 'fake_transcript',
          originalMedia: { type: 'video', tag: 'original', url: 'video.mp4' },
        },
      });
    expect(update.status).to.equal(200);
    expect(update.body.data.api.uploadTaskStatusUpdate).to.eql(true);

    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
            me {
              uploadTasks {
                transcribeTask{
                  task_name
                  status
                }
                transcript
                originalMedia {
                  type
                  tag
                  url
                }
              }
            }
          }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.uploadTasks).to.eql([
      {
        transcribeTask: {
          task_name: 'transcribe',
          status: 'IN_PROGRESS',
        },
        transcript: 'fake_transcript',
        originalMedia: {
          type: 'video',
          tag: 'original',
          url: 'https://static.mentorpal.org/video.mp4',
        },
      },
    ]);
  });

  it('updating status without transcript does not clear transcript', async () => {
    const update = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: `mutation UpdateUploadTaskStatus($mentorId: ID!, $questionId: ID!, $transcript: String, $originalMedia: AnswerMediaInputType) {
          api {
            uploadTaskStatusUpdate(mentorId: $mentorId, questionId: $questionId, transcript: $transcript, originalMedia: $originalMedia)
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
          questionId: '511111111111111111111112',
          originalMedia: {
            type: 'video',
            tag: 'web',
            url: 'https://static.mentorpal.org/video.mp4',
          },
        },
      });
    expect(update.status).to.equal(200);
    expect(update.body.data.api.uploadTaskStatusUpdate).to.eql(true);

    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
            me {
              uploadTasks {
                transcribeTask{
                  task_name
                  status
                }
                transcript
              }
            }
          }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.uploadTasks).to.eql([
      {
        transcribeTask: {
          task_name: 'transcribe',
          status: 'IN_PROGRESS',
        },
        transcript: 'fake_transcript',
      },
    ]);
  });
});
