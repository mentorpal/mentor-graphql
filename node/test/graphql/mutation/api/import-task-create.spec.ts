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

const importTaskCreate = `mutation ImportTaskCreate($mentor: ID!,
  $graphQLUpdate: GraphQLUpdateInputType!,
  $s3VideoMigrate: S3VideoMigrationInputType!) {
      api {
          importTaskCreate(graphQLUpdate: $graphQLUpdate, mentor: $mentor, s3VideoMigrate: $s3VideoMigrate)
      }
}`;

const importTaskUpdate = `mutation ImportTaskUpdate($mentor: ID!, $graphQLUpdate: GraphQLUpdateInputType, $s3VideoMigrateUpdate: S3VideoMigrationInputType){
  api{
      importTaskUpdate(mentor: $mentor, graphQLUpdate: $graphQLUpdate, s3VideoMigrateUpdate: $s3VideoMigrateUpdate)
  }
}`;

describe('mediaUpdate', () => {
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

  it(`can create import task`, async () => {
    let response = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: importTaskCreate,
        variables: {
          mentor: '5ffdf41a1ee2c62111111111',
          graphQLUpdate: {
            status: 'IN_PROGRESS',
            errorMessage: '',
          },
          s3VideoMigrate: {
            status: 'IN_PROGRESS',
            errorMessage: '',
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.api.importTaskCreate).to.eql(true);
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response2 = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `        query ImportTask($mentorId: ID!){
          importTask(mentorId:$mentorId){
            graphQLUpdate{
              status
              errorMessage
            }
            s3VideoMigrate{
              status
              errorMessage
            }
          }
        }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
        },
      });
    expect(response2.body.data.importTask).to.eql({
      graphQLUpdate: { status: 'IN_PROGRESS', errorMessage: '' },
      s3VideoMigrate: { status: 'IN_PROGRESS', errorMessage: '' },
    });

    let response3 = await request(app)
      .post('/graphql')
      .set('mentor-graphql-req', 'true')
      .set('Authorization', `bearer ${process.env.API_SECRET}`)
      .send({
        query: importTaskUpdate,
        variables: {
          mentor: '5ffdf41a1ee2c62111111111',
          graphQLUpdate: {
            status: 'FAILED',
            errorMessage: 'error message',
          },
          s3VideoMigrateUpdate: {
            status: 'DONE',
            errorMessage: '',
          },
        },
      });
    expect(response3.body.data.api.importTaskUpdate).to.eql(true);

    const response4 = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `        query ImportTask($mentorId: ID!){
        importTask(mentorId:$mentorId){
          graphQLUpdate{
            status
            errorMessage
          }
          s3VideoMigrate{
            status
            errorMessage
          }
        }
      }`,
        variables: {
          mentorId: '5ffdf41a1ee2c62111111111',
        },
      });
    expect(response4.body.data.importTask).to.eql({
      graphQLUpdate: { status: 'FAILED', errorMessage: 'error message' },
      s3VideoMigrate: { status: 'DONE', errorMessage: '' },
    });
  });
});
