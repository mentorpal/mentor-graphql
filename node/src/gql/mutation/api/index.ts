/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLObjectType } from 'graphql';
import { User } from 'models/User';
import mentorThumbnailUpdate from './mentor-thumbnail-update';
import mediaUpdate from './media-update';
import uploadAnswer from './upload-answer';
import uploadTaskUpdate from './upload-task-update';

export const Api: GraphQLObjectType = new GraphQLObjectType({
  name: 'ApiMutation',
  fields: () => ({
    mentorThumbnailUpdate,
    mediaUpdate,
    uploadAnswer,
    uploadTaskUpdate,
  }),
});

export const api = {
  type: Api,
  resolve: (_: any, args: any, context: { user: User }): { user: User } => {
    if (!context.user) {
      throw new Error('Only authenticated users');
    }
    return {
      user: context.user,
    };
  },
};

export default api;
