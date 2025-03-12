/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLList,
  GraphQLString,
  GraphQLInputObjectType,
} from 'graphql';
import MentorPanelType from '../../../gql/types/mentor-panel';
import MentorPanelModel, { MentorPanel } from '../../../models/MentorPanel';
import { User } from '../../../models/User';
import { canEditMentorPanel } from '../../../utils/check-permissions';
import { idOrNew } from './helpers';
import { Types } from 'mongoose';

interface AddOrUpdateMentorPanelInput {
  org: Types.ObjectId;
  subject: Types.ObjectId;
  mentors: Types.ObjectId[];
  title: string;
  subtitle: string;
}

export const AddOrUpdateMentorPanelInputType = new GraphQLInputObjectType({
  name: 'AddOrUpdateMentorPanelInputType',
  fields: {
    org: { type: GraphQLID },
    subject: { type: GraphQLID },
    mentors: { type: new GraphQLList(GraphQLID) },
    title: { type: GraphQLString },
    subtitle: { type: GraphQLString },
  },
});

export const addOrUpdateMentorPanel = {
  type: MentorPanelType,
  args: {
    id: { type: GraphQLID },
    mentorPanel: { type: new GraphQLNonNull(AddOrUpdateMentorPanelInputType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { id: string; mentorPanel: AddOrUpdateMentorPanelInput },
    context: { user: User }
  ): Promise<MentorPanel> => {
    if (context.user?.isDisabled) {
      throw new Error('Your account has been disabled');
    }
    if (!(await canEditMentorPanel(context.user, args.mentorPanel.org))) {
      throw new Error('you do not have permission to add or edit mentorpanel');
    }
    return await MentorPanelModel.findOneAndUpdate(
      { _id: idOrNew(args.id) },
      {
        $set: { ...args.mentorPanel },
      },
      {
        new: true,
        upsert: true,
      }
    );
  },
};

export default addOrUpdateMentorPanel;
