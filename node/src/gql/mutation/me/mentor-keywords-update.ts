/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLID,
  GraphQLList,
  GraphQLString,
} from 'graphql';
import { Mentor as MentorModel } from '../../../models';
import { User } from '../../../models/User';
import { canEditMentor } from '../../../utils/check-permissions';

export const updateMentorKeywords = {
  type: GraphQLBoolean,
  args: {
    mentorId: { type: GraphQLID },
    keywords: { type: GraphQLList(GraphQLString) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { mentorId: string; keywords: string[] },
    context: { user: User }
  ): Promise<boolean> => {
    const mentor = args.mentorId
      ? await MentorModel.findById(args.mentorId)
      : await MentorModel.findOne({
          user: context.user._id,
        });
    // Check mentor permissions
    if (!mentor) {
      throw new Error('invalid mentor');
    }
    if (!(await canEditMentor(mentor, context.user))) {
      throw new Error('you do not have permission to edit this mentor');
    }
    // don't keep duplicate keywords
    const keywords: string[] = [];
    for (const k of args.keywords) {
      if (!keywords.find((kk) => kk.toLowerCase() === k.toLowerCase())) {
        keywords.push(k);
      }
    }
    // Update mentor keywords
    const updated = await MentorModel.findByIdAndUpdate(
      mentor._id,
      {
        $set: {
          keywords: keywords,
        },
      },
      {
        new: true,
      }
    );
    return Boolean(updated);
  },
};

export default updateMentorKeywords;
