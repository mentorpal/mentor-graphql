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

describe('questionsById', () => {
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

  it('gets a list of questions by id', async () => {
    const ids = ['511111111111111111111111', '511111111111111111111112'];
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query QuestionsById($ids: [ID]!) {
          questionsById(ids: $ids) {
            _id
          }
        }`,
        variables: { ids },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.questionsById).to.eql([
      {
        _id: '511111111111111111111111',
      },
      {
        _id: '511111111111111111111112',
      },
    ]);
  });
});
