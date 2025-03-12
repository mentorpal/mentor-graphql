/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
} from 'graphql';
import MentorTrainModel, {
  MentorTrainTaskType,
} from '../../../models/MentorTrainTask';
import MentorModel from '../../../models/Mentor';
import { User } from '../../../models/User';
import { canEditMentor } from '../../../utils/check-permissions';
import { idOrNew } from './helpers';

export const addOrUpdateTrainTask = {
  type: MentorTrainTaskType,
  args: {
    taskDocId: { type: new GraphQLNonNull(GraphQLID) },
    mentorId: { type: new GraphQLNonNull(GraphQLID) },
    status: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { taskDocId: string; mentorId: string; status: string },
    context: { user: User }
  ): Promise<string> => {
    const { taskDocId, mentorId, status } = args;

    const mentor = await MentorModel.findOne({ _id: mentorId });
    if (!mentor) {
      throw new Error(`No mentor with id ${mentorId}`);
    }
    if (!(await canEditMentor(mentor, context.user))) {
      throw new Error('you do not have permission to edit this mentors');
    }
    const docId = idOrNew(taskDocId);
    return await MentorTrainModel.findOneAndUpdate(
      { _id: docId },
      {
        $set: {
          mentor: mentorId,
          status: status,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );
  },
};

export default addOrUpdateTrainTask;
