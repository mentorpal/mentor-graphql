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

describe('mentorsByKeyword', () => {
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

  it('gets a list of public mentors if not logged in', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          mentorsByKeyword {
            _id
            name
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentorsByKeyword).to.eql([
      {
        _id: '5ffdf41a1ee2c62111111119',
        name: 'Aaron Klunder',
      },
      {
        _id: '5ffdf41a1ee2c62111111110',
        name: 'Jacob Ferguson',
      },
      {
        _id: '5ffdf41a1ee2c62111111111',
        name: 'Clinton Anderson',
      },
      {
        _id: '5ffdf41a1ee2c62111111112',
        name: 'Julianne Nordhagen',
      },
      {
        _id: '5ffdf41a1ee2c62111111113',
        name: 'Dan Davis',
      },
      {
        _id: '5ffdf41a1ee2c62119991114',
        name: 'Locked Down Mentor',
      },
    ]);
  });

  it('does not get private mentors if not owner or super user', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea2');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          mentorsByKeyword {
            _id
            name
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentorsByKeyword).to.eql([
      {
        _id: '5ffdf41a1ee2c62111111119',
        name: 'Aaron Klunder',
      },
      {
        _id: '5ffdf41a1ee2c62111111110',
        name: 'Jacob Ferguson',
      },
      {
        _id: '5ffdf41a1ee2c62111111111',
        name: 'Clinton Anderson',
      },
      {
        _id: '5ffdf41a1ee2c62111111112',
        name: 'Julianne Nordhagen',
      },
      {
        _id: '5ffdf41a1ee2c62111111113',
        name: 'Dan Davis',
      },
      {
        _id: '5ffdf41a1ee2c62119991114',
        name: 'Locked Down Mentor',
      },
    ]);
  });

  it('gets private mentors if content manager', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea4');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          mentorsByKeyword {
            _id
            name
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentorsByKeyword).to.eql([
      {
        _id: '5ffdf41a1ee2c62111111119',
        name: 'Aaron Klunder',
      },
      {
        _id: '5ffdf41a1ee2c62111111110',
        name: 'Jacob Ferguson',
      },
      {
        _id: '5ffdf41a1ee2c62111111111',
        name: 'Clinton Anderson',
      },
      {
        _id: '5ffdf41a1ee2c62111111112',
        name: 'Julianne Nordhagen',
      },
      {
        _id: '5ffdf41a1ee2c62111111113',
        name: 'Dan Davis',
      },
      {
        _id: '5ffdf41a1ee2c62111111114',
        name: 'Private Mentor',
      },
      {
        _id: '5ffdf41a1ee2c62119991114',
        name: 'Locked Down Mentor',
      },
    ]);
  });

  it('gets private mentors if admin', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea1');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          mentorsByKeyword {
            _id
            name
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentorsByKeyword).to.eql([
      {
        _id: '5ffdf41a1ee2c62111111119',
        name: 'Aaron Klunder',
      },
      {
        _id: '5ffdf41a1ee2c62111111110',
        name: 'Jacob Ferguson',
      },
      {
        _id: '5ffdf41a1ee2c62111111111',
        name: 'Clinton Anderson',
      },
      {
        _id: '5ffdf41a1ee2c62111111112',
        name: 'Julianne Nordhagen',
      },
      {
        _id: '5ffdf41a1ee2c62111111113',
        name: 'Dan Davis',
      },
      {
        _id: '5ffdf41a1ee2c62111111114',
        name: 'Private Mentor',
      },
      {
        _id: '5ffdf41a1ee2c62119991114',
        name: 'Locked Down Mentor',
      },
    ]);
  });

  it('gets private mentors if owner', async () => {
    const token = getToken('5ffdf41a1ee2c62320b49ea7');
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `bearer ${token}`)
      .send({
        query: `query {
          mentorsByKeyword {
            _id
            name
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentorsByKeyword).to.eql([
      {
        _id: '5ffdf41a1ee2c62111111119',
        name: 'Aaron Klunder',
      },
      {
        _id: '5ffdf41a1ee2c62111111110',
        name: 'Jacob Ferguson',
      },
      {
        _id: '5ffdf41a1ee2c62111111111',
        name: 'Clinton Anderson',
      },
      {
        _id: '5ffdf41a1ee2c62111111112',
        name: 'Julianne Nordhagen',
      },
      {
        _id: '5ffdf41a1ee2c62111111113',
        name: 'Dan Davis',
      },
      {
        _id: '5ffdf41a1ee2c62111111114',
        name: 'Private Mentor',
      },
      {
        _id: '5ffdf41a1ee2c62119991114',
        name: 'Locked Down Mentor',
      },
    ]);
  });

  it('gets list of mentors sorted by name in ascending order', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query MentorsByKeyword($sortBy: String, $sortAscending: Boolean) {
          mentorsByKeyword(sortBy: $sortBy, sortAscending: $sortAscending) {
            name
          }
        }`,
        variables: { sortBy: 'name', sortAscending: true },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentorsByKeyword).to.eql([
      {
        name: 'Aaron Klunder',
      },
      {
        name: 'Clinton Anderson',
      },
      {
        name: 'Dan Davis',
      },
      {
        name: 'Jacob Ferguson',
      },
      {
        name: 'Julianne Nordhagen',
      },
      {
        name: 'Locked Down Mentor',
      },
    ]);
  });

  it('gets list of mentors sorted by name in descending order', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query MentorsByKeyword($sortBy: String, $sortAscending: Boolean) {
          mentorsByKeyword(sortBy: $sortBy, sortAscending: $sortAscending) {
            name
          }
        }`,
        variables: { sortBy: 'name', sortAscending: false },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentorsByKeyword).to.eql([
      {
        name: 'Locked Down Mentor',
      },
      {
        name: 'Julianne Nordhagen',
      },
      {
        name: 'Jacob Ferguson',
      },
      {
        name: 'Dan Davis',
      },
      {
        name: 'Clinton Anderson',
      },
      {
        name: 'Aaron Klunder',
      },
    ]);
  });

  it('gets list of mentors sorted by name in default order', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query MentorsByKeyword($sortBy: String) {
          mentorsByKeyword(sortBy: $sortBy) {
            name
          }
        }`,
        variables: { sortBy: 'name', sortAscending: false },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentorsByKeyword).to.eql([
      {
        name: 'Locked Down Mentor',
      },
      {
        name: 'Julianne Nordhagen',
      },
      {
        name: 'Jacob Ferguson',
      },
      {
        name: 'Dan Davis',
      },
      {
        name: 'Clinton Anderson',
      },
      {
        name: 'Aaron Klunder',
      },
    ]);
  });

  it('gets a list of mentors filtered by subject', async () => {
    let response = await request(app)
      .post('/graphql')
      .send({
        query: `query MentorsByKeyword($subject: ID) {
          mentorsByKeyword(subject: $subject) {
            name
          }
        }`,
        variables: { subject: '5ffdf41a1ee2c62320b49eb2' },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentorsByKeyword).to.eql([
      {
        name: 'Aaron Klunder',
      },
      {
        name: 'Jacob Ferguson',
      },
      {
        name: 'Clinton Anderson',
      },
      {
        name: 'Julianne Nordhagen',
      },
    ]);
    response = await request(app)
      .post('/graphql')
      .send({
        query: `query MentorsByKeyword($subject: ID) {
          mentorsByKeyword(subject: $subject) {
            name
          }
        }`,
        variables: { subject: '5ffdf41a1ee2c62320b49eb3' },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentorsByKeyword).to.eql([
      {
        name: 'Julianne Nordhagen',
      },
      {
        name: 'Locked Down Mentor',
      },
    ]);
  });

  it('gets a list of mentors sorted by keyword relevancy', async () => {
    // sort male first
    let response = await request(app)
      .post('/graphql')
      .send({
        query: `query MentorsByKeyword($keywords: [String]) {
          mentorsByKeyword(keywords: $keywords) {
            name
          }
        }`,
        variables: { keywords: ['Male'] },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentorsByKeyword).to.eql([
      {
        name: 'Aaron Klunder',
      },
      {
        name: 'Jacob Ferguson',
      },
      {
        name: 'Clinton Anderson',
      },
      {
        name: 'Dan Davis',
      },
      {
        name: 'Julianne Nordhagen',
      },
      {
        name: 'Locked Down Mentor',
      },
    ]);
    // sort female first
    response = await request(app)
      .post('/graphql')
      .send({
        query: `query MentorsByKeyword($keywords: [String]) {
          mentorsByKeyword(keywords: $keywords) {
            name
          }
        }`,
        variables: { keywords: ['Female'] },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentorsByKeyword).to.eql([
      {
        name: 'Julianne Nordhagen',
      },
      {
        name: 'Aaron Klunder',
      },
      {
        name: 'Jacob Ferguson',
      },
      {
        name: 'Clinton Anderson',
      },
      {
        name: 'Dan Davis',
      },
      {
        name: 'Locked Down Mentor',
      },
    ]);
    // sort male + stem first
    response = await request(app)
      .post('/graphql')
      .send({
        query: `query MentorsByKeyword($keywords: [String]) {
          mentorsByKeyword(keywords: $keywords) {
            name
          }
        }`,
        variables: {
          keywords: ['Male', 'STEM'],
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentorsByKeyword).to.eql([
      {
        name: 'Clinton Anderson',
      },
      {
        name: 'Aaron Klunder',
      },
      {
        name: 'Jacob Ferguson',
      },
      {
        name: 'Dan Davis',
      },
      {
        name: 'Julianne Nordhagen',
      },
      {
        name: 'Locked Down Mentor',
      },
    ]);
  });

  it('combines keyword sort + subject filter + sort by name', async () => {
    // sort female first, then by name, while filtering by subject
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `query MentorsByKeyword($keywords: [String], $subject: ID, $sortBy: String, $sortAscending: Boolean) {
            mentorsByKeyword(keywords: $keywords, subject: $subject, sortBy: $sortBy, sortAscending: $sortAscending) {
              name
            }
          }`,
        variables: {
          keywords: ['Female'],
          subject: '5ffdf41a1ee2c62320b49eb2',
          sortBy: 'name',
          sortAscending: true,
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.mentorsByKeyword).to.eql([
      {
        name: 'Julianne Nordhagen',
      },
      {
        name: 'Aaron Klunder',
      },
      {
        name: 'Clinton Anderson',
      },
      {
        name: 'Jacob Ferguson',
      },
    ]);
  });
});
