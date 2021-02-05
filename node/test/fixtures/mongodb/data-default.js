/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;

module.exports = {
  users: [
    {
      _id: ObjectId('5ffdf41a1ee2c62320b49ea1'),
      name: 'Clinton Anderson',
      email: 'clint@anderson.com',
    },
    {
      _id: ObjectId('5ffdf41a1ee2c62320b49ea2'),
      name: 'Dan Davis',
      email: 'dan@davis.com',
    },
  ],

  mentors: [
    {
      _id: ObjectId('5ffdf41a1ee2c62111111111'),
      name: 'Clinton Anderson',
      firstName: 'Clint',
      title: "Nuclear Electrician's Mate",
      isBuilt: false,
      subjects: [
        ObjectId('5ffdf41a1ee2c62320b49eb1'),
        ObjectId('5ffdf41a1ee2c62320b49eb2'),
      ],
      user: ObjectId('5ffdf41a1ee2c62320b49ea1'),
    },
  ],

  answers: [
    {
      mentor: ObjectId('5ffdf41a1ee2c62111111111'),
      question: ObjectId('511111111111111111111111'),
      transcript: '[being still]',
      video: 'https://idle/url',
      status: 'Complete',
      recordedAt: new Date('2020-04-29T21:08:07.453Z'),
    },
  ],

  questions: [
    {
      _id: ObjectId('511111111111111111111111'),
      question: "Don't talk and stay still.",
      name: 'idle',
    },
    {
      _id: ObjectId('511111111111111111111112'),
      question: 'Who are you and what do you do?',
      topics: [ObjectId('5ffdf41a1ee2c62320b49ec2')],
    },
    {
      _id: ObjectId('511111111111111111111113'),
      question: 'Is STEM fun?',
    },
  ],

  subjects: [
    {
      _id: ObjectId('5ffdf41a1ee2c62320b49eb1'),
      name: 'Repeat After Me',
      description: "These are miscellaneous phrases you'll be asked to repeat.",
      questions: [ObjectId('511111111111111111111111')],
      isRequired: true,
    },
    {
      _id: ObjectId('5ffdf41a1ee2c62320b49eb2'),
      name: 'Background',
      description:
        'These questions will ask general questions about your background that might be relevant to how people understand your career.',
      questions: [ObjectId('511111111111111111111112')],
      isRequired: true,
    },
    {
      _id: ObjectId('5ffdf41a1ee2c62320b49eb3'),
      name: 'STEM',
      description: 'These questions will ask about STEM careers.',
      questions: [ObjectId('511111111111111111111113')],
    },
  ],

  topics: [
    {
      _id: ObjectId('5ffdf41a1ee2c62320b49ec1'),
      name: 'Idle',
      description: '30-second idle clip',
    },
    {
      _id: ObjectId('5ffdf41a1ee2c62320b49ec2'),
      name: 'Background',
      description:
        'These questions will ask general questions about your background, that might be relevant to how people understand your career',
    },
    {
      _id: ObjectId('5ffdf41a1ee2c62320b49ec3'),
      name: 'Advice',
      description:
        'These questions will ask you to give advice to someone who is interested in your career',
    },
  ],
};
