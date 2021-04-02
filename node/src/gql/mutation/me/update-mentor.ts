/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLList,
} from 'graphql';
import { Mentor as MentorModel } from 'models';
import { Mentor } from 'models/Mentor';
import { User } from 'models/User';

export interface MentorUpdateInput {
  _id: string;
  name: string;
  firstName: string;
  title: string;
  mentorType: string;
  defaultSubject: string;
  subjects: string[];
}

export const MentorUpdateInputType = new GraphQLInputObjectType({
  name: 'MentorUpdateInputType',
  fields: () => ({
    _id: { type: GraphQLID },
    name: { type: GraphQLString },
    firstName: { type: GraphQLString },
    title: { type: GraphQLString },
    mentorType: { type: GraphQLString },
    defaultSubject: { type: GraphQLID },
    subjects: { type: GraphQLList(GraphQLID) },
  }),
});

export const updateMentor = {
  type: GraphQLBoolean,
  args: {
    mentor: { type: GraphQLNonNull(MentorUpdateInputType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { mentor: MentorUpdateInput },
    context: { user: User }
  ): Promise<boolean> => {
    const mentorUpdate: MentorUpdateInput = args.mentor;
    const mentor: Mentor = await MentorModel.findById(mentorUpdate._id);
    if (mentor && `${context.user._id}` !== `${mentor.user}`) {
      throw new Error('you do not have permission to update this mentor');
    }
    const updated = await MentorModel.findByIdAndUpdate(
      mentorUpdate._id,
      {
        $set: mentorUpdate,
      },
      {
        new: true,
        upsert: true,
      }
    );
    return Boolean(updated);
  },
};

export default updateMentor;
