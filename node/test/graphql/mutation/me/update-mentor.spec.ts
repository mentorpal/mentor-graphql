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

describe('updateMentor', () => {
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
            updateMentor(mentor: "") { 
              id
            }   
          }
        }`,
    });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Only authenticated users'
    );
  });

  it(`throws an error if logged in user is not the mentor`, async () => {
    const token = getToken('5f0cfea3395d762ca65405d2');
    const mentor = encodeURI(
      JSON.stringify({
        id: '5f0cfea3395d762ca65405d1',
      })
    );
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation {
          me {
            updateMentor(mentor: "${mentor}") {
              id
            }   
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'you do not have permission to update this mentor'
    );
  });

  it(`throws an error if no mentor`, async () => {
    const token = getToken('5f0cfea3395d762ca65405d1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation {
          me {
            updateMentor { 
              id
            }   
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'missing required param mentor'
    );
  });

  it(`throws an error if mentor videoId is not lowercase`, async () => {
    const token = getToken('5f0cfea3395d762ca65405d1');
    const mentor = encodeURI(
      JSON.stringify({
        id: '5f0cfea3395d762ca65405d1',
        videoId: 'Clint',
      })
    );
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation {
          me {
            updateMentor(mentor: "${mentor}") {
              id
            }   
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'videoId must match [a-z]'
    );
  });

  it(`throws an error if mentor videoId contains special chars`, async () => {
    const token = getToken('5f0cfea3395d762ca65405d1');
    const mentor = encodeURI(
      JSON.stringify({
        id: '5f0cfea3395d762ca65405d1',
        videoId: '!',
      })
    );
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation {
          me {
            updateMentor(mentor: "${mentor}") {
              id
            }   
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'videoId must match [a-z]'
    );
  });

  it('updates mentor', async () => {
    const token = getToken('5f0cfea3395d762ca65405d1');
    const mentor = encodeURI(
      JSON.stringify({
        id: '5f0cfea3395d762ca65405d1',
        videoId: 'clintanderson',
        name: 'Clint Anderson',
        shortName: 'C',
      })
    );
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation {
          me {
            updateMentor(mentor: "${mentor}") {
              id
              videoId
              name
              shortName
            }   
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.updateMentor).to.eql({
      id: '5f0cfea3395d762ca65405d1',
      videoId: 'clintanderson',
      name: 'Clint Anderson',
      shortName: 'C',
    });
  });

  it('creates a new mentor', async () => {
    const token = getToken('5f0cfea3395d762ca65405d2');
    const mentor = encodeURI(
      JSON.stringify({
        id: '5f0cfea3395d762ca65405d2',
        videoId: 'dan',
        name: 'Dan Davis',
        shortName: 'Dan',
        title: 'Dan the man',
      })
    );
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `mutation {
          me {
            updateMentor(mentor: "${mentor}") {
              id
              videoId
              name
              shortName
              title
            }
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.updateMentor).to.eql({
      id: '5f0cfea3395d762ca65405d2',
      videoId: 'dan',
      name: 'Dan Davis',
      shortName: 'Dan',
      title: 'Dan the man',
    });
  });
});
