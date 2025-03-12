/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLObjectType, GraphQLNonNull, GraphQLID } from 'graphql';
import { MentorType } from '../types/mentor';
import { Mentor as MentorModel } from '../../models';
import { Mentor, MentorDirtyReason } from '../../models/Mentor';

export const updateMentorTraining = {
  type: MentorType,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { id: string }
  ): Promise<Mentor> => {
    return await MentorModel.findByIdAndUpdate(
      args.id,
      {
        lastTrainedAt: new Date(),
        isDirty: false,
        dirtyReason: MentorDirtyReason.NONE,
      },
      {
        new: true,
      }
    );
  },
};

export default updateMentorTraining;
