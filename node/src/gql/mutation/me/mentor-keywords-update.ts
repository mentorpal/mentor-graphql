/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLString,
} from 'graphql';
import {
  Mentor as MentorModel,
  Keyword as KeywordModel,
} from '../../../models';
import { User } from '../../../models/User';
import { canEditMentor } from '../../../utils/check-permissions';

export interface UpdateKeyword {
  name: string;
  type: string;
}

export const UpdateKeywordType = new GraphQLInputObjectType({
  name: 'UpdateKeywordType',
  fields: () => ({
    name: { type: GraphQLString },
    type: { type: GraphQLString },
  }),
});

export const updateMentorKeywords = {
  type: GraphQLBoolean,
  args: {
    mentorId: { type: GraphQLID },
    keywords: { type: GraphQLList(UpdateKeywordType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { mentorId: string; keywords: UpdateKeyword[] },
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
    if (!canEditMentor(mentor, context.user)) {
      throw new Error('you do not have permission to edit this mentor');
    }
    // Batch write all keywords
    if (args.keywords && args.keywords.length > 0) {
      await KeywordModel.bulkWrite(
        args.keywords.map((k) => {
          return {
            updateOne: {
              filter: { name: k.name },
              update: { $set: k },
              upsert: true,
            },
          };
        })
      );
    }

    // Update mentor keywords
    const keywords = await KeywordModel.find({
      name: { $in: args.keywords.map((k) => k.name) },
    });
    const updated = await MentorModel.findByIdAndUpdate(
      mentor._id,
      {
        $set: {
          keywords: keywords.map((k) => k._id),
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
