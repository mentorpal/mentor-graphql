/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLID,
  GraphQLList,
  GraphQLBoolean,
} from 'graphql';
import { Mentor as MentorModel } from '../../models';
import { User } from '../../models/User';
import { DateType } from './date';
import FirstTimeTrackingGqlType from './first-time-tracking';
import MentorType from './mentor';

export const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    defaultMentor: {
      type: MentorType,
      resolve: async (user: User) => {
        return await MentorModel.findOne({ user: user._id });
      },
    },
    _id: { type: GraphQLID },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    isDisabled: { type: GraphQLBoolean },
    userRole: { type: GraphQLString },
    lastLoginAt: { type: DateType },
    mentorIds: { type: new GraphQLList(GraphQLID) },
    firstTimeTracking: { type: FirstTimeTrackingGqlType },
  }),
});

export default UserType;
