/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLObjectType } from 'graphql';
import mentor from './mentor';
import mentors from './mentors';
import subject from './subject';
import subjects from './subjects';
import topic from './topic';
import topics from './topics';
import questionSet from './question-set';

export default new GraphQLObjectType({
  name: 'Query',
  fields: {
    mentor,
    mentors,
    subject,
    subjects,
    topic,
    topics,
    questionSet,
  },
});
