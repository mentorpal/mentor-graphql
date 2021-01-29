/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLBoolean, GraphQLObjectType, GraphQLString } from 'graphql';
import { Mentor as MentorModel, Subject as SubjectModel } from 'models';
import { User } from 'models/User';

export const addQuestionSet = {
  type: GraphQLBoolean,
  args: {
    mentorId: { type: GraphQLString },
    subjectId: { type: GraphQLString },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { mentorId: string; subjectId: string },
    context: { user: User }
  ): Promise<boolean> => {
    if (!args.mentorId) {
      throw new Error('missing required param mentorId');
    }
    if (!args.subjectId) {
      throw new Error('missing required param subjectId');
    }
    const mentor = await MentorModel.findOne({ _id: args.mentorId });
    if (!mentor) {
      throw new Error(`no mentor found for id '${args.mentorId}'`);
    }
    if (`${context.user._id}` !== `${mentor.user}`) {
      throw new Error('you do not have permission to update this mentor');
    }
    const subject = await SubjectModel.findOne({ _id: args.subjectId });
    if (!subject) {
      throw new Error(`no subject found for id '${args.subjectId}'`);
    }
    mentor.subjects.push(subject._id);
    // mentor.questions.push(...subject.questions);
    const updatedMentor = await MentorModel.findOneAndUpdate(
      {
        _id: mentor._id,
      },
      {
        $set: {
          subjects: mentor.subjects,
          // questions: mentor.questions,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );
    return Boolean(
      updatedMentor &&
        updatedMentor.subjects &&
        updatedMentor.subjects.find((s) => `${s._id}` === args.subjectId)
    );
  },
};

export default addQuestionSet;
