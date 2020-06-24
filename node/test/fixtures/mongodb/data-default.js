/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;

module.exports = {
  mentors: [
    {
      _id: ObjectId('5f0cfea3395d762ca65405d1'),
      id: '5f0cfea3395d762ca65405d1',
      videoId: 'clintanderson',
      name: 'Clinton Anderson',
      shortName: 'Clint',
      title: "Nuclear Electrician's Mate",
      topics: ['5f0cfea3395d762ca65405d1', '5f0cfea3395d762ca65405d2'],
      questions: [
        {
          question: 'Who are you and what do you do?',
          topics: ['5f0cfea3395d762ca65405d1'],
          videoId: 'A1_1_1',
          video: null,
          transcript: null,
          status: 'Incomplete',
        },
        {
          question: 'Can you give me some advice?',
          topics: ['5f0cfea3395d762ca65405d2'],
          videoId: 'A2_1_1',
          video: null,
          transcript: null,
          status: 'Incomplete',
        },
      ],
      utterances: [
        {
          question:
            'Please look at the camera for 30 seconds without speaking. Try to remain in the same position.',
          topics: ['5f0cfea3395d762ca65405d3'],
          videoId: 'U1_1_1',
          video: null,
          transcript: null,
          status: 'Incomplete',
        },
        {
          question:
            'Please give a short introduction of yourself, which includes your name, current job, and title.',
          topics: ['5f0cfea3395d762ca65405d4'],
          videoId: 'U2_1_1',
          video: null,
          transcript: null,
          status: 'Incomplete',
        },
        {
          question:
            "Please repeat the following: 'I couldn't understand the question. Try asking me something else.'",
          topics: ['5f0cfea3395d762ca65405d5'],
          videoId: 'U3_1_1',
          video: null,
          transcript: null,
          status: 'Incomplete',
        },
      ],
    },
  ],

  topics: [
    {
      _id: ObjectId('5f0cfea3395d762ca65405d1'),
      id: 'background',
      name: 'Background',
      description:
        'These questions will ask general questions about your background, that might be relevant to how people understand your career',
      category: 'About Me',
    },
    {
      _id: ObjectId('5f0cfea3395d762ca65405d2'),
      id: 'advice',
      name: 'Advice',
      description:
        'These questions will ask you to give advice to someone who is interested in your career',
      category: 'What Does it Take?',
    },
    {
      _id: ObjectId('5f0cfea3395d762ca65405d3'),
      id: '_IDLE_',
      name: 'Idle',
      description: '30-second idle clip',
      category: 'Utterance',
    },
    {
      _id: ObjectId('5f0cfea3395d762ca65405d4'),
      id: '_INTRO_',
      name: 'Intro',
      description: 'Short introduction about you',
      category: 'Utterance',
    },
    {
      _id: ObjectId('5f0cfea3395d762ca65405d5'),
      id: '_OFF_TOPIC_',
      name: 'Off-Topic',
      description:
        'Short responses to off-topic questions you do not have answers for or do not understand',
      category: 'Utterance',
    },
  ],

  users: [
    {
      _id: ObjectId('5f0cfea3395d762ca65405d1'),
      name: 'Clinton Anderson',
      email: 'clint@anderson.com',
    },
    {
      _id: ObjectId('5f0cfea3395d762ca65405d2'),
      name: 'Dan Davis',
      email: 'dan@davis.com',
    },
  ],
};
