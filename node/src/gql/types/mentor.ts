/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLList,
  GraphQLBoolean,
  GraphQLID,
} from 'graphql';
import { Subject as SubjectSchema } from 'models';
import { Mentor } from 'models/Mentor';
import QuestionType from './question';
import SubjectType from './subject';

export const MentorType = new GraphQLObjectType({
  name: 'Mentor',
  fields: {
    _id: { type: GraphQLID },
    name: { type: GraphQLString },
    shortName: { type: GraphQLString },
    title: { type: GraphQLString },
    isBuilt: { type: GraphQLBoolean },
    subjects: {
      type: GraphQLList(SubjectType),
      resolve: async function (mentor: Mentor) {
        const resolveSubjects = async (id: string) => {
          return await SubjectSchema.findOne({ _id: id });
        };
        return Promise.all(
          mentor.subjects.map((s: string) => resolveSubjects(s))
        );
      },
    },
    questions: {
      type: GraphQLList(QuestionType),
      resolve: async function (mentor: Mentor) {
        return mentor.questions;
      },
    },
  },
});

export default MentorType;
