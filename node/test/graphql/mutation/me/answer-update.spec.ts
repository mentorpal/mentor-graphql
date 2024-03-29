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
import { MentorDirtyReason } from '../../../constants';

describe('updateAnswer', () => {
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
        query: `mutation UpdateAnswer($questionId: ID!, $answer: UpdateAnswerInputType!) {
        me {
          updateAnswer(questionId: $questionId, answer: $answer)
        }
      }`,
        variables: { questionId: '511111111111111111111112', answer: {} },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Only authenticated users'
    );
  });

  it(`throws an error if user does not have a mentor`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea4');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateAnswer($questionId: ID!, $answer: UpdateAnswerInputType!) {
          me {
            updateAnswer(questionId: $questionId, answer: $answer)
          }
        }`,
        variables: { questionId: '511111111111111111111112', answer: {} },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'invalid mentor'
    );
  });

  it(`throws an error if no questionId`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateAnswer($questionId: ID!, $answer: UpdateAnswerInputType!) {
          me {
            updateAnswer(answer: $answer)
          }
        }`,
        variables: { answer: {} },
      });
    expect(response.status).to.equal(400);
  });

  it(`throws an error if no answer`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateAnswer($questionId: ID!, $answer: UpdateAnswerInputType!) {
          me {
            updateAnswer(questionId: "511111111111111111111112")
          }
        }`,
        variables: { questionId: '511111111111111111111112' },
      });
    expect(response.status).to.equal(400);
  });

  it(`throws an error if invalid answer`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateAnswer($questionId: ID!, $answer: UpdateAnswerInputType!) {
          me {
            updateAnswer(questionId: $questionId, answer: $answer)
          }
        }`,
        variables: {
          questionId: '511111111111111111111112',
          answer: {
            fake: true,
          },
        },
      });
    expect(response.status).to.equal(500);
  });

  it('does not accept api key user', async () => {
    const response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: `mutation UpdateAnswer($questionId: ID!, $answer: UpdateAnswerInputType!) {
          me {
            updateAnswer(questionId: $questionId, answer: $answer)
          }
        }`,
        variables: {
          questionId: '511111111111111111111112',
          answer: {
            transcript:
              "My name is Clint Anderson and I'm a Nuclear Electrician's Mate",
            status: 'Complete',
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'invalid mentor'
    );
  });

  it('mentor updates an answer and makes mentor dirty.', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const questionId = '511111111111111111111112';
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateAnswer($questionId: ID!, $answer: UpdateAnswerInputType!) {
          me {
            updateAnswer(questionId: $questionId, answer: $answer)
          }
        }`,
        variables: {
          questionId: '511111111111111111111112',
          answer: {
            transcript:
              "My name is Clint Anderson and I'm a Nuclear Electrician's Mate",
            status: 'Complete',
            previousVersions: [
              {
                versionControlId: 'previous version control id',
                transcript: 'previous tracnscript',
                webVideoHash: 'previous web video hash',
                videoDuration: 1.0,
                vttText: 'previous vtt text',
                dateVersioned: '2021-01-15T00:00:00.000Z',
              },
            ],
          },
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.data.me.updateAnswer).to.eql(true);

    const r2 = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          mentor(id: "5ffdf41a1ee2c62111111111") {
            isDirty
            dirtyReason
            answers {
              transcript
              status
              question {
                _id
              }
              previousVersions {
                versionControlId
                transcript
                webVideoHash
                videoDuration
                vttText
                dateVersioned
              }
            }
          }
      }`,
      });
    expect(r2.status).to.equal(200);
    expect(r2.body.data.mentor.isDirty).to.eql(true);
    expect(r2.body.data.mentor.dirtyReason).to.eql(
      MentorDirtyReason.ANSWERS_ADDED
    );
    const updatedAnswer = r2.body.data.mentor.answers.find(
      (a: any) => a.question._id === questionId
    );
    expect(updatedAnswer).to.have.property(
      'transcript',
      "My name is Clint Anderson and I'm a Nuclear Electrician's Mate"
    );
    expect(updatedAnswer.previousVersions).to.eql([
      {
        versionControlId: 'previous version control id',
        transcript: 'previous tracnscript',
        webVideoHash: 'previous web video hash',
        videoDuration: 1,
        vttText: 'previous vtt text',
        dateVersioned: '2021-01-15T00:00:00.000Z',
      },
    ]);
    expect(updatedAnswer).to.have.property('status', 'Complete');
  });

  it(`throws an error if question does not exist`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation {
        me {
          updateAnswer(questionId: "511111111111111111999999", answer: {})
        }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      `no question found for id '511111111111111111999999'`
    );
  });

  it('"USER"\'s cannot update other mentors answers', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2'); //mentor with role "User"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateAnswer($questionId: ID!, $answer: UpdateAnswerInputType!, $mentorId: ID!) {
          me {
            updateAnswer(questionId: $questionId, answer: $answer, mentorId: $mentorId)
          }
        }`,
        variables: {
          questionId: '511111111111111111111112',
          mentorId: '5ffdf41a1ee2c62111111112', //other mentor
          answer: {
            transcript:
              "My name is Clint Anderson and I'm a Nuclear Electrician's Mate",
            status: 'Complete',
          },
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
        query: `mutation UpdateAnswer($questionId: ID!, $answer: UpdateAnswerInputType!, $mentorId: ID!) {
          me {
            updateAnswer(questionId: $questionId, answer: $answer, mentorId: $mentorId)
          }
        }`,
        variables: {
          questionId: '511111111111111111111112',
          mentorId: '5ffdf41a1ee2c62111111111', //other mentor
          answer: {
            transcript:
              "My name is Clint Anderson and I'm a Nuclear Electrician's Mate",
            status: 'Complete',
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.updateAnswer).to.eql(true);
  });

  it('"ADMIN"\'s can update other mentors answers', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1'); //mentor with role "Admin"
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation UpdateAnswer($questionId: ID!, $answer: UpdateAnswerInputType!, $mentorId: ID!) {
          me {
            updateAnswer(questionId: $questionId, answer: $answer, mentorId: $mentorId)
          }
        }`,
        variables: {
          questionId: '511111111111111111111112',
          mentorId: '5ffdf41a1ee2c62111111111', //other mentor
          answer: {
            transcript:
              "My name is Clint Anderson and I'm a Nuclear Electrician's Mate",
            status: 'Complete',
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.updateAnswer).to.eql(true);
  });
});
