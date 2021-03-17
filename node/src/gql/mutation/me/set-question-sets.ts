/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLBoolean,
  GraphQLList,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
} from 'graphql';
import mongoose from 'mongoose';
import { Mentor as MentorModel } from 'models';
import { User } from 'models/User';

export const setQuestionSets = {
  type: GraphQLBoolean,
  args: {
    mentorId: { type: GraphQLNonNull(GraphQLID) },
    subjectIds: { type: GraphQLNonNull(GraphQLList(GraphQLID)) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { mentorId: string; subjectIds: string[] },
    context: { user: User }
  ): Promise<boolean> => {
    const mentor = await MentorModel.findOne({ _id: args.mentorId });
    if (!mentor) {
      throw new Error(`no mentor found for id '${args.mentorId}'`);
    }
    if (`${context.user._id}` !== `${mentor.user}`) {
      throw new Error('you do not have permission to update this mentor');
    }
    const updatedMentor = await MentorModel.findOneAndUpdate(
      {
        _id: mentor._id,
      },
      {
        $set: {
          subjects: args.subjectIds.map((id) => mongoose.Types.ObjectId(id)),
        },
      },
      {
        new: true,
        upsert: true,
      }
    );
    return Boolean(updatedMentor && updatedMentor.subjects);
  },
};

export default setQuestionSets;
