/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLList,
} from 'graphql';
import {
  Mentor as MentorModel,
  MentorConfig as MentorConfigModel,
} from '../../../models';
import { Subject } from '../../../models/Subject';
import { User } from '../../../models/User';
import { canEditMentor } from '../../../utils/check-permissions';

export interface UpdateMentorSubjects {
  defaultSubject: Subject['_id'];
  subjects: Subject['_id'][];
}

export const UpdateMentorSubjectsType = new GraphQLInputObjectType({
  name: 'UpdateMentorSubjectsType',
  fields: () => ({
    defaultSubject: { type: GraphQLID },
    subjects: { type: new GraphQLList(GraphQLID) },
  }),
});

export const updateMentorSubjects = {
  type: GraphQLBoolean,
  args: {
    mentor: { type: new GraphQLNonNull(UpdateMentorSubjectsType) },
    mentorId: { type: GraphQLID },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { mentor: UpdateMentorSubjects; mentorId: string },
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
    const mentorConfig = mentor.mentorConfig
      ? await MentorConfigModel.findById(mentor.mentorConfig)
      : null;
    if (mentorConfig && mentorConfig.lockedToSubjects) {
      throw new Error(
        'Mentor subjects are locked, please unlock them before editing'
      );
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

export default updateMentorSubjects;
