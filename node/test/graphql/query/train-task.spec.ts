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
import { getToken } from '../../helpers';
import { TrainStatus } from '../../constants';

describe('train task', () => {
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

  it('rejects with no access token', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query TrainTask($taskId: ID!) {
            trainTask(taskId: $taskId) {
              _id
              mentor
              status
            }
      }`,
        variables: { taskId: '5ffdf1241ee2c62320b49ea1' },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      'errors[0].message',
      'Only authenticated users'
    );
  });

  it(`can query train task by id`, async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea6');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query TrainTask($taskId: ID!) {
          trainTask(taskId: $taskId) {
            _id
            mentor
            status
          }
    }`,
        variables: { taskId: '5ffdf1241ee2c62320b49ea1' },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.trainTask).to.eql({
      _id: '5ffdf1241ee2c62320b49ea1',
      mentor: '5ffdf41a1ee2c62111111119',
      status: TrainStatus.PENDING,
    });
  });

  it(`can get most recent train status for a mentor`, async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query Mentor($id: ID!) {
          mentor(id: $id) {
            _id
            lastTrainStatus
          }
      }`,
        variables: { id: '5ffdf41a1ee2c62111111119' },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentor).to.eql({
      _id: '5ffdf41a1ee2c62111111119',
      lastTrainStatus: TrainStatus.PENDING,
    });
  });

  it('can get most recent train status for a list of mentors', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query MentorsById($ids: [ID]!){
        mentorsById(ids: $ids){
          _id
          lastTrainStatus
        }
    }`,
        variables: {
          ids: ['5ffdf41a1ee2c62111111119', '5ffdf41a1ee2c62111111110'],
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentorsById).to.eql([
      { _id: '5ffdf41a1ee2c62111111110', lastTrainStatus: TrainStatus.FAILURE },
      { _id: '5ffdf41a1ee2c62111111119', lastTrainStatus: TrainStatus.PENDING },
    ]);
  });
});
