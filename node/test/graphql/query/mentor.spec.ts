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
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          mentor(id: "111111111111111111111111") {
            _id
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
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          mentor(id: "5ffdf41a1ee2c62111111111") {
            _id
            name
            firstName
            title
            subjects {
              _id
              name
            }
          }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentor).to.eql({
      _id: '5ffdf41a1ee2c62111111111',
      name: 'Clinton Anderson',
      firstName: 'Clint',
      title: "Nuclear Electrician's Mate",
      subjects: [
        {
          _id: '5ffdf41a1ee2c62320b49eb2',
          name: 'Background',
        },
        {
          _id: '5ffdf41a1ee2c62320b49eb1',
          name: 'Repeat After Me',
        },
      ],
    });
  });

  it('mentor/subjects gets all subjects for mentor in alphabetical order', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        mentor(id: "5ffdf41a1ee2c62111111112") {
          subjects {
            name
          }
        }
      }
    `,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentor).to.eql({
      subjects: [
        {
          name: 'Background',
        },
        {
          name: 'Repeat After Me',
        },
        {
          name: 'STEM',
        },
      ],
    });
  });

  it('mentor/topics gets all topics for mentor in alphabetical order', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        mentor(id: "5ffdf41a1ee2c62111111112") {
          topics {
            name
          }
        }
      }
    `,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentor).to.eql({
      topics: [
        {
          name: 'Advice',
        },
        {
          name: 'Background',
        },
        {
          name: 'Idle',
        },
      ],
    });
  });

  it('mentor/topics gets topics in default subject in subject order', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        mentor(id: "5ffdf41a1ee2c62111111112") {
          topics(useDefaultSubject: true) {
            name
          }
        }
      }
    `,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentor).to.eql({
      topics: [
        {
          name: 'Background',
        },
        {
          name: 'Advice',
        },
      ],
    });
  });

  it('mentor/topics gets topics in subject in subject order', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        mentor(id: "5ffdf41a1ee2c62111111112") {
          topics(subject: "5ffdf41a1ee2c62320b49eb2") {
            name
          }
        }
      }
    `,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentor).to.eql({
      topics: [
        {
          name: 'Background',
        },
        {
          name: 'Advice',
        },
      ],
    });
  });

  it('mentor/topics fails to get topics in subject mentor does not have', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        mentor(id: "5ffdf41a1ee2c62111111111") {
          topics(subject: "5ffdf41a1ee2c62320b49eb3") {
            name
          }
        }
      }
    `,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentor).to.eql({
      topics: [],
    });
  });

  it('mentor/questions gets all questions for mentor', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        mentor(id: "5ffdf41a1ee2c62111111111") {
          questions {
            question {
              question
            }
            topics {
              name
            }
            category {
              name
            }
          }
        }
      }
    `,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentor.questions).to.eql([
      {
        question: {
          question: 'Who are you and what do you do?',
        },
        category: null,
        topics: [{ name: 'Background' }],
      },
      {
        question: {
          question: 'How old are you?',
        },
        category: { name: 'Category' },
        topics: [{ name: 'Background' }],
      },
      {
        question: {
          question: 'Do you like your job?',
        },
        category: null,
        topics: [{ name: 'Advice' }],
      },
      {
        question: {
          question: "Don't talk and stay still.",
        },
        category: null,
        topics: [{ name: 'Idle' }],
      },
    ]);
  });

  it('mentor/questions gets all questions in default subject for mentor', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        mentor(id: "5ffdf41a1ee2c62111111111") {
          questions(useDefaultSubject: true) {
            question {
              question
            }
            topics {
              name
            }
            category {
              name
            }
          }
        }
      }
    `,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentor.questions).to.eql([
      {
        question: {
          question: "Don't talk and stay still.",
        },
        category: null,
        topics: [{ name: 'Idle' }],
      },
    ]);
  });

  it('mentor/questions gets all questions in subject for mentor', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        mentor(id: "5ffdf41a1ee2c62111111111") {
          questions(subject: "5ffdf41a1ee2c62320b49eb1") {
            question {
              question
            }
            topics {
              name
            }
            category {
              name
            }
          }
        }
      }
    `,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentor.questions).to.eql([
      {
        question: {
          question: "Don't talk and stay still.",
        },
        category: null,
        topics: [{ name: 'Idle' }],
      },
    ]);
  });

  it('mentor/questions fails to get questions in subject mentor does not have', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        mentor(id: "5ffdf41a1ee2c62111111111") {
          questions(subject: "5ffdf41a1ee2c62320b49eb3") {
            question {
              question
            }
            topics {
              name
            }
            category {
              name
            }
          }
        }
      }
    `,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentor.questions).to.eql([]);
  });

  it('mentor/answers gets answers for all questions', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        mentor(id: "5ffdf41a1ee2c62111111111") {
          name
          answers {
            question {
              question
            }
            transcript
            status
          }
        }
      }
    `,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentor).to.eql({
      name: 'Clinton Anderson',
      answers: [
        {
          question: {
            question: 'Who are you and what do you do?',
          },
          transcript: '',
          status: 'INCOMPLETE',
        },
        {
          question: {
            question: 'How old are you?',
          },
          transcript: '',
          status: 'INCOMPLETE',
        },
        {
          question: {
            question: 'Do you like your job?',
          },
          transcript: '',
          status: 'INCOMPLETE',
        },
        {
          question: {
            question: "Don't talk and stay still.",
          },
          transcript: '[being still]',
          status: 'COMPLETE',
        },
      ],
    });
  });

  it('mentor/answers gets complete answers for all questions', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        mentor(id: "5ffdf41a1ee2c62111111111") {
          name
          answers(status: "COMPLETE") {
            question {
              question
            }
            transcript
            status
          }
        }
      }
    `,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentor).to.eql({
      name: 'Clinton Anderson',
      answers: [
        {
          question: {
            question: "Don't talk and stay still.",
          },
          transcript: '[being still]',
          status: 'COMPLETE',
        },
      ],
    });
  });

  it('mentor/answers gets answers for default subject', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        mentor(id: "5ffdf41a1ee2c62111111111") {
          answers(useDefaultSubject: true) {
            question {
              question
            }
            transcript
            status
          }
        }
      }
    `,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentor).to.eql({
      answers: [
        {
          question: {
            question: "Don't talk and stay still.",
          },
          transcript: '[being still]',
          status: 'COMPLETE',
        },
      ],
    });
  });

  it('mentor/answers gets answers for subject', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        mentor(id: "5ffdf41a1ee2c62111111111") {
          answers(subject: "5ffdf41a1ee2c62320b49eb1") {
            question {
              question
            }
            transcript
            status
          }
        }
      }
    `,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentor).to.eql({
      answers: [
        {
          question: {
            question: "Don't talk and stay still.",
          },
          transcript: '[being still]',
          status: 'COMPLETE',
        },
      ],
    });
  });

  it('mentor/answers fails to get answers for subject mentor does not have, including incomplete', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        mentor(id: "5ffdf41a1ee2c62111111111") {
          answers(subject: "5ffdf41a1ee2c62320b49eb3") {
            question {
              question
            }
            transcript
            status
          }
        }
      }
    `,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentor).to.eql({
      answers: [],
    });
  });

  it('mentor/answers gets answers for questions in topic, including incomplete', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        mentor(id: "5ffdf41a1ee2c62111111111") {
          answers(topic: "5ffdf41a1ee2c62320b49ec3") {
            question {
              question
            }
            transcript
            status
          }
        }
      }
    `,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentor).to.eql({
      answers: [
        {
          question: {
            question: 'Do you like your job?',
          },
          transcript: '',
          status: 'INCOMPLETE',
        },
      ],
    });
  });

  it('mentor/utterances gets all utterances, including incomplete', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        mentor(id: "5ffdf41a1ee2c62111111111") {
          utterances {
            question {
              question
            }
            transcript
            status
          }
        }
      }
    `,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentor).to.eql({
      utterances: [
        {
          question: {
            question: "Don't talk and stay still.",
          },
          transcript: '[being still]',
          status: 'COMPLETE',
        },
      ],
    });
  });

  it('mentor/answers gets mentor specific question for mentor', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        mentor(id: "5ffdf41a1ee2c62111111112") {
          name
          answers {
            question {
              question
            }
          }
        }
      }
    `,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentor).to.eql({
      name: 'Julianne Nordhagen',
      answers: [
        {
          question: {
            question: 'Who are you and what do you do?',
          },
        },
        {
          question: {
            question: 'How old are you?',
          },
        },
        {
          question: {
            question: 'Do you like your job?',
          },
        },
        {
          question: {
            question: 'Julia?',
          },
        },
        {
          question: {
            question: "Don't talk and stay still.",
          },
        },
      ],
    });
  });

  it('gets web videoUrl for a mentor answer', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        mentor(id: "5ffdf41a1ee2c62111111111") {
          name
          answers(status: "COMPLETE") {
            transcript
            videoUrl
          }
        }
      }
    `,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentor).to.eql({
      name: 'Clinton Anderson',
      answers: [
        {
          transcript: '[being still]',
          videoUrl: `${process.env.STATIC_URL_BASE}/web.mp4`,
        },
      ],
    });
  });

  it('gets mobile videoUrl for a mentor answer', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
        mentor(id: "5ffdf41a1ee2c62111111111") {
          name
          answers(status: "COMPLETE") {
            transcript
            videoUrl(tag: "mobile")
          }
        }
      }
    `,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentor).to.eql({
      name: 'Clinton Anderson',
      answers: [
        {
          transcript: '[being still]',
          videoUrl: `${process.env.STATIC_URL_BASE}/mobile.mp4`,
        },
      ],
    });
  });
});
