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
  GraphQLInputObjectType,
  GraphQLID,
} from 'graphql';
import { Mentor as MentorModel } from '../../../models';
import { User } from '../../../models/User';
import { canEditMentor } from '../../../utils/check-permissions';

export interface UpdateMentorDetails {
  name: string;
  firstName: string;
  title: string;
  goal: string;
  email: string;
  allowContact: boolean;
  mentorType: string;
  isPrivate: boolean;
  isArchived: boolean;
  hasVirtualBackground: boolean;
  virtualBackgroundUrl: string;
}

export const UpdateMentorDetailsType = new GraphQLInputObjectType({
  name: 'UpdateMentorDetailsType',
  fields: () => ({
    name: { type: GraphQLString },
    firstName: { type: GraphQLString },
    title: { type: GraphQLString },
    goal: { type: GraphQLString },
    email: { type: GraphQLString },
    allowContact: { type: GraphQLBoolean },
    mentorType: { type: GraphQLString },
    isPrivate: { type: GraphQLBoolean },
    isArchived: { type: GraphQLBoolean },
    hasVirtualBackground: { type: GraphQLBoolean },
    virtualBackgroundUrl: { type: GraphQLString },
  }),
});

export const updateMentorDetails = {
  type: GraphQLBoolean,
  args: {
    mentor: { type: new GraphQLNonNull(UpdateMentorDetailsType) },
    mentorId: { type: GraphQLID },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { mentor: UpdateMentorDetails; mentorId: string },
    context: { user: User }
  ): Promise<boolean> => {
    if (context.user?.isDisabled) {
      throw new Error('Your account has been disabled');
    }
    const mentor = args.mentorId
      ? await MentorModel.findById(args.mentorId)
      : await MentorModel.findOne({
          user: context.user._id,
        });

    if (!mentor) {
      throw new Error('invalid mentor');
    }
    if (!(await canEditMentor(mentor, context.user))) {
      throw new Error('you do not have permission to edit this mentor');
    }

    const updated = await MentorModel.findByIdAndUpdate(
      mentor._id,
      {
        $set: args.mentor,
      },
      {
        new: true,
        upsert: true,
      }
    );

    return Boolean(updated);
  },
};

export default updateMentorDetails;
