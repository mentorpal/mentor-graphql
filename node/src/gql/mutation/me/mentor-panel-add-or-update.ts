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
import { canEditContent } from '../../../utils/check-permissions';

interface AddOrUpdateMentorPanelInput {
  subject: string;
  mentors: string[];
  title: string;
  subtitle: string;
}

export const AddOrUpdateMentorPanelInputType = new GraphQLInputObjectType({
  name: 'AddOrUpdateMentorPanelInputType',
  fields: {
    subject: { type: GraphQLID },
    mentors: { type: GraphQLList(GraphQLID) },
    title: { type: GraphQLString },
    subtitle: { type: GraphQLString },
  },
});

export const addOrUpdateMentorPanel = {
  type: MentorPanelType,
  args: {
    id: { type: GraphQLID },
    mentorPanel: { type: GraphQLNonNull(AddOrUpdateMentorPanelInputType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { id: string; mentorPanel: AddOrUpdateMentorPanelInput },
    context: { user: User }
  ): Promise<MentorPanel> => {
    if (!canEditContent(context.user)) {
      throw new Error('you do not have permission to add or edit mentorpanel');
    }
    return await MentorPanelModel.findOneAndUpdate(
      { _id: args.id },
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
