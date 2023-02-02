/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLID,
  GraphQLString,
  GraphQLBoolean,
} from 'graphql';
import DateType from './date';
import MentorType from './mentor';
import { MentorPanel } from '../../models/MentorPanel';
import { Mentor as MentorModel } from '../../models';

export const MentorPanelType = new GraphQLObjectType({
  name: 'MentorPanel',
  fields: () => ({
    _id: { type: GraphQLID },
    org: { type: GraphQLID },
    subject: { type: GraphQLID },
    mentors: { type: GraphQLList(GraphQLID) },
    title: { type: GraphQLString },
    subtitle: { type: GraphQLString },
    createdAt: { type: DateType },
    updatedAt: { type: DateType },
    deleted: { type: GraphQLBoolean },
    mentorData: {
      type: GraphQLList(MentorType),
      resolve: async (mp: MentorPanel) => {
        const mentors = await MentorModel.find({
          _id: { $in: mp.mentors },
        });
        return mentors;
      },
    },
  }),
});

export default MentorPanelType;
