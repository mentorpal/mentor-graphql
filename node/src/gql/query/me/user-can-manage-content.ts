/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLString, GraphQLObjectType, GraphQLBoolean } from 'graphql';
import { User } from '../../../models/User';
import { User as UserSchema } from '../../../models';
import { canEditContent } from '../../../utils/check-permissions';

export const canManageContent = {
  type: GraphQLBoolean,
  args: {
    userId: { type: GraphQLString },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { userId: string },
    context: { user: User }
  ): Promise<boolean> => {
    const userIdToFind = args.userId ? args.userId : context.user.id;
    const user = await UserSchema.findOne({ _id: userIdToFind });
    return canEditContent(user);
  },
};

export default canManageContent;
