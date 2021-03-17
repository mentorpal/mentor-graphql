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
/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved.
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { expect } from 'chai';
import { Express } from 'express';
import request from 'supertest';
import { appStart, appStop, gqlWithAuth } from 'test/helpers';

describe('topicsCreate', () => {
  let app: Express;

  beforeEach(async () => {
    app = await appStart();
  });

  afterEach(async () => {
    await appStop();
  });

  it(`throws an error if not logged in`, async () => {
    const response = await request(app).post('/graphql').send({
      query: `mutation {
          me {
            topicsCreate(topics: []) {
              topics {
                _id
              }
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

  it(`throws an error if no topics`, async () => {
    const response = await gqlWithAuth(app, {
      query: `mutation {
          me {
            topicsCreate(topics: []) {
              topics {
                _id
              }
            }
          }
        }`,
    });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'input topics must include at least one item'
    );
  });

  it('creates topics', async () => {
    const response = await gqlWithAuth(app, {
      query: `mutation {
          me {
            topicsCreate(topics: [
              { 
                name: "topic1"
                description: "about topic 1"
              },
              { 
                name: "topic2"
                description: "about topic 2"
              }
            ]) {
              topics {
                _id
                name
                description
              }
            }
          }
        }`,
    });
    expect(response.status).to.equal(200);
    expect(response.body)
      .to.have.deep.nested.property('data.me.topicsCreate.topics[0]._id')
      .and.have.length(24); // is a mongo id
    expect(response.body).to.have.deep.nested.property(
      'data.me.topicsCreate.topics[0].name',
      'topic1'
    );
    expect(response.body).to.have.deep.nested.property(
      'data.me.topicsCreate.topics[0].description',
      'about topic 1'
    );
    expect(response.body)
      .to.have.deep.nested.property('data.me.topicsCreate.topics[1]._id')
      .and.have.length(24); // is a mongo id

    expect(response.body).to.have.deep.nested.property(
      'data.me.topicsCreate.topics[1].name',
      'topic2'
    );
    expect(response.body).to.have.deep.nested.property(
      'data.me.topicsCreate.topics[1].description',
      'about topic 2'
    );
  });
});
