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

describe('updateSubject', () => {
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
    const response = await request(app).post('/graphql').send({
      query: `mutation {
          me {
            updateSubject(subject: "")
          }
        }`,
    });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Only authenticated users'
    );
  });

  it(`throws an error if no subject`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation {
          me {
            updateSubject(subject: "")
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'missing required param subject'
    );
  });

  it('updates subject', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const subject = encodeURI(
      JSON.stringify({
        _id: '5ffdf41a1ee2c62320b49eb3',
        name: 'stem',
        description: 'These questions will ask about STEM careers.',
        questions: [
          {
            _id: '511111111111111111111113',
            question: 'Is stem fun?',
            topics: [
              {
                name: 'New Topic',
                description: 'New',
              },
            ],
          },
        ],
      })
    );
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation {
          me {
            updateSubject(subject: "${subject}")
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'data.me.updateSubject',
      true
    );
    const updatedSubject = await request(app).post('/graphql').send({
      query: `query {
        subject(id: "5ffdf41a1ee2c62320b49eb3") {
          _id
          name
          description
          questions {
            _id
            question
            topics {
              name
              description
            }
          }
        }
      }`,
    });
    expect(updatedSubject.status).to.equal(200);
    expect(updatedSubject.body.data.subject).to.eql({
      _id: '5ffdf41a1ee2c62320b49eb3',
      name: 'stem',
      description: 'These questions will ask about STEM careers.',
      questions: [
        {
          _id: '511111111111111111111113',
          question: 'Is stem fun?',
          topics: [
            {
              name: 'New Topic',
              description: 'New',
            },
          ],
        },
      ],
    });
  });

  it('creates a new subject', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const subject = encodeURI(
      JSON.stringify({
        name: '_new',
        description: 'new subject description',
        questions: [
          {
            question: 'new question',
            topics: [
              {
                name: 'new topic',
                description: 'new topic description',
              },
            ],
          },
        ],
      })
    );
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation {
          me {
            updateSubject(subject: "${subject}")
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'data.me.updateSubject',
      true
    );
    const updatedSubjects = await request(app).post('/graphql').send({
      query: `query {
        subjects(sortBy: "name", sortAscending: true, limit: 1) {
          edges {
            node {
              name
              description
              questions {
                question
                topics {
                  name
                  description
                }
              }
            }
          }
        }
      }`,
    });
    expect(updatedSubjects.status).to.equal(200);
    expect(updatedSubjects.body.data.subjects).to.eql({
      edges: [
        {
          node: {
            name: '_new',
            description: 'new subject description',
            questions: [
              {
                question: 'new question',
                topics: [
                  {
                    name: 'new topic',
                    description: 'new topic description',
                  },
                ],
              },
            ],
          },
        },
      ],
    });
  });
});
