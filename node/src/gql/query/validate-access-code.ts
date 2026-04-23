/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLBoolean, GraphQLObjectType, GraphQLString } from 'graphql';
import OrganizationModel from '../../models/Organization';

export const validateAccessCode = {
  type: GraphQLBoolean,
  args: {
    orgAccessCode: { type: GraphQLString },
    orgId: { type: GraphQLString },
  },
  resolve: async (
    _: GraphQLObjectType,
    args: { orgAccessCode: string; orgId: string }
  ): Promise<boolean> => {
    const org = await OrganizationModel.findById(args.orgId);
    if (!org) {
      return false;
    }
    const isPrivate = org.isPrivate;
    if (isPrivate) {
      return org.accessCodes.includes(args.orgAccessCode);
    }
    return true;
  },
};

export default validateAccessCode;
