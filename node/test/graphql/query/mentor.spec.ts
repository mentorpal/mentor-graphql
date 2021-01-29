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
    const response = await request(app).post('/graphql').send({
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
    const response = await request(app).post('/graphql').send({
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
            questions {
              id
              question
              status
              subject {
                _id
                name
              }
              topics {
                _id
                name
              }
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
          _id: '5ffdf41a1ee2c62320b49eb1',
          name: 'Repeat After Me',
        },
        {
          _id: '5ffdf41a1ee2c62320b49eb2',
          name: 'Background',
        },
      ],
      questions: [
        {
          id: 'A1',
          question: "Don't talk and stay still.",
          status: 'Incomplete',
          subject: {
            _id: '5ffdf41a1ee2c62320b49eb1',
            name: 'Repeat After Me',
          },
          topics: [
            {
              _id: '5ffdf41a1ee2c62320b49ec1',
              name: 'Idle',
            },
          ],
        },
        {
          id: 'B1',
          question: 'Who are you and what do you do?',
          status: 'Incomplete',
          subject: {
            _id: '5ffdf41a1ee2c62320b49eb2',
            name: 'Background',
          },
          topics: [
            {
              _id: '5ffdf41a1ee2c62320b49ec2',
              name: 'Background',
            },
          ],
        },
      ],
    });
  });
});
