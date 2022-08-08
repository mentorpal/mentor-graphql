/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
} from 'graphql';
import { User } from '../../../models/User';
import { Mentor as MentorModel } from '../../../models';
import { Types } from 'mongoose';

export const removeQuestionFromRecordQueue = {
  type: GraphQLList(GraphQLID),
  args: {
    questionIds: { type: GraphQLNonNull(GraphQLList(GraphQLID)) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      questionIds: string[];
    },
    context: { user: User }
  ): Promise<string[]> => {
    // eslint-disable-line  @typescript-eslint/no-explicit-any
    if (!context.user) {
      throw new Error('Only authenticated users');
    }
    const mentor = await MentorModel.findOne({
      user: Types.ObjectId(`${context.user._id}`),
    });
    if (!mentor) {
      throw new Error('Failed to find mentor for user');
    }
    const newMentor = await MentorModel.findOneAndUpdate(
      { user: Types.ObjectId(`${context.user._id}`) },
      {
        $set: {
          recordQueue: args.questionIds,
        },
      },
      { new: true }
    );
    return newMentor.recordQueue;
  },
};

export default removeQuestionFromRecordQueue;