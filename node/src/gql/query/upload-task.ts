/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLID, GraphQLNonNull, GraphQLObjectType } from 'graphql';
import { User } from '../../models/User';
import {
  UploadTask as UploadTaskModel,
  Mentor as MentorModel,
} from '../../models';
import { UploadTask } from '../../models/UploadTask';
import { UploadTaskType } from '../types/upload-task';
import { canEditMentor } from '../../utils/check-permissions';

export const uploadTask = {
  type: UploadTaskType,
  args: {
    mentorId: { type: new GraphQLNonNull(GraphQLID) },
    questionId: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: async (
    _: GraphQLObjectType,
    args: {
      mentorId: string;
      questionId: string;
    },
    context: { user: User }
  ): Promise<UploadTask> => {
    if (!context.user) {
      throw new Error('Only authenticated users');
    }
    // jwt strategy (users)
    if (context.user.id) {
      const mentor = await MentorModel.findById(args.mentorId);
      if (!mentor) {
        throw new Error('invalid mentor');
      }
      if (!(await canEditMentor(mentor, context.user))) {
        throw new Error(
          'you are not authorized to view this mentors information'
        );
      }
    } // else bearer-api strategy (services)
    const task = await UploadTaskModel.findOne({
      mentor: args.mentorId,
      question: args.questionId,
    });
    return task;
  },
};

export default uploadTask;
