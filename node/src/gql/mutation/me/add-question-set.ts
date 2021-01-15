/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLString, GraphQLObjectType } from 'graphql';
import MentorType from 'gql/types/mentor';
import { Mentor as MentorSchema, Subject as SubjectSchema } from 'models';
import { Mentor } from 'models/Mentor';
import { User } from 'models/User';

export const addQuestionSet = {
  type: MentorType,
  args: {
    mentorId: { type: GraphQLString },
    subjectId: { type: GraphQLString },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { mentorId: string; subjectId: string },
    context: { user: User }
  ): Promise<Mentor> => {
    if (!args.mentorId) {
      throw new Error('missing required param mentorId');
    }
    if (!args.subjectId) {
      throw new Error('missing required param subjectId');
    }
    if (`${context.user._id}` !== `${args.mentorId}`) {
      throw new Error('you do not have permission to update this mentor');
    }
    const mentor = await MentorSchema.findOne({ _id: args.mentorId });
    if (!mentor) {
      throw new Error(`could not find mentor ${args.mentorId}`);
    }
    const subject = await SubjectSchema.findOne({ _id: args.subjectId });
    if (!subject) {
      throw new Error(`could not find subject ${args.subjectId}`);
    }
    mentor.subjects.push(subject._id);
    mentor.questions.push(...subject.questions);

    return await MentorSchema.findOneAndUpdate(
      {
        _id: mentor._id,
      },
      {
        $set: {
          subjects: mentor.subjects,
          questions: mentor.questions,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );
  },
};

export default addQuestionSet;
