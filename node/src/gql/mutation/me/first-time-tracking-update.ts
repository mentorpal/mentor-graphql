/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import FirstTimeTrackingGqlType from '../../types/first-time-tracking';
import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLInputObjectType,
  GraphQLBoolean,
} from 'graphql';
import { FirstTimeTracking } from '../../../models/User';
import UserModel, { User } from '../../../models/User';

export const firstTimeTrackingUpdateInputType = new GraphQLInputObjectType({
  name: 'FirstTimeTrackingUpdateInputType',
  fields: () => ({
    myMentorSplash: {
      type: GraphQLBoolean,
    },
    tooltips: {
      type: GraphQLBoolean,
    },
  }),
});

export const firstTimeTrackingUpdate = {
  type: FirstTimeTrackingGqlType,
  args: {
    updates: { type: new GraphQLNonNull(firstTimeTrackingUpdateInputType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      updates: Partial<FirstTimeTracking>;
    },
    context: { user: User }
  ): Promise<FirstTimeTracking> => {
    if (context.user?.isDisabled) {
      throw new Error('Your account has been disabled');
    }
    const user = await UserModel.findOneAndUpdate(
      { _id: context.user._id },
      { new: true }
    );
    if (!user) {
      throw new Error(`Failed to find user for id ${context.user._id}`);
    }
    if (args.updates.myMentorSplash !== undefined) {
      user.firstTimeTracking.myMentorSplash = args.updates.myMentorSplash;
      user.markModified('firstTimeTracking');
    }
    if (args.updates.tooltips !== undefined) {
      user.firstTimeTracking.tooltips = args.updates.tooltips;
      user.markModified('firstTimeTracking');
    }
    user.save();
    return user.firstTimeTracking;
  },
};

export default firstTimeTrackingUpdate;
