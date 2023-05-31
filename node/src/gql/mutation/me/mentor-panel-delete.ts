/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLObjectType, GraphQLID, GraphQLNonNull } from 'graphql';
import MentorPanelType from '../../types/mentor-panel';
import MentorPanelModel, { MentorPanel } from '../../../models/MentorPanel';
import { User } from '../../../models/User';
import { canEditMentorPanel } from '../../../utils/check-permissions';

export const deleteMentorPanel = {
  type: MentorPanelType,
  args: { id: { type: GraphQLNonNull(GraphQLID) } },
  resolve: async (
    _root: GraphQLObjectType,
    args: { id: string },
    context: { user: User }
  ): Promise<MentorPanel> => {
    if (context.user?.isDisabled) {
      throw new Error('Your account has been disabled');
    }
    const mp = await MentorPanelModel.findById(args.id);
    if (!mp) {
      throw new Error('invalid mentor panel');
    }
    if (!(await canEditMentorPanel(context.user, mp.org))) {
      throw new Error('you do not have permission to edit mentorpanel');
    }
    return await MentorPanelModel.findOneAndUpdate(
      { _id: args.id },
      {
        $set: { deleted: true },
      },
      {
        new: true,
        upsert: true,
      }
    );
  },
};

export default deleteMentorPanel;
