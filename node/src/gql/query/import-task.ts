/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/

import { GraphQLID, GraphQLNonNull, GraphQLObjectType } from 'graphql';
import { User, UserRole } from 'models/User';
import { ImportTask as ImportTaskModel, Mentor as MentorModel } from 'models';
import ImportTaskType from 'gql/types/import-task';
import { ImportTask } from 'models/ImportTask';
import { Mentor } from 'models/Mentor';

export const importTask = {
  type: ImportTaskType,
  args: {
    mentorId: { type: GraphQLNonNull(GraphQLID) },
  },
  resolve: async (
    _: GraphQLObjectType,
    args: {
      mentorId: string;
    },
    context: { user: User }
  ): Promise<ImportTask> => {
    if (!context.user) {
      throw new Error('Only authenticated users');
    }
    if (context.user.id) {
      const mentor: Mentor = await MentorModel.findOne({
        user: context.user._id,
      });
      if (!mentor) {
        throw new Error('you do not have a mentor');
      }
      if (
        `${mentor._id}` !== `${args.mentorId}` &&
        context.user.userRole !== UserRole.ADMIN &&
        context.user.userRole !== UserRole.CONTENT_MANAGER
      ) {
        throw new Error(
          'you do not have permission to view this mentors information'
        );
      }
    }

    const task = await ImportTaskModel.findOne({
      mentor: args.mentorId,
    });
    return task;
  },
};

export default importTask;
