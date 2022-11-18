/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLBoolean,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLList,
  GraphQLString,
  GraphQLInputObjectType,
} from 'graphql';
import { v4 as uuid } from 'uuid';
import OrganizationType from '../../../gql/types/mentor-panel';
import OrganizationModel, { Organization } from '../../../models/Organization';
import { User, UserRole } from '../../../models/User';
import { canEditOrganization } from '../../../utils/check-permissions';
import { ConfigUpdateInput, ConfigUpdateInputType } from './config-update';

interface AddOrUpdateOrganizationInput {
  name: string;
  subdomain: string;
  isPrivate: string;
  config: ConfigUpdateInput;
  members: OrganizationMentorInput[];
}
interface OrganizationMentorInput {
  user: string;
  role: string;
}

export const OrganizationMemberInputType = new GraphQLInputObjectType({
  name: 'OrganizationMemberInputType',
  fields: {
    user: { type: GraphQLID },
    role: { type: GraphQLString },
  },
});
export const AddOrUpdateOrganizationInputType = new GraphQLInputObjectType({
  name: 'AddOrUpdateOrganizationInputType',
  fields: {
    name: { type: GraphQLString },
    subdomain: { type: GraphQLString },
    isPrivate: { type: GraphQLBoolean },
    config: { type: ConfigUpdateInputType },
    members: { type: GraphQLList(OrganizationMemberInputType) },
  },
});

export const addOrUpdateOrganization = {
  type: OrganizationType,
  args: {
    id: { type: GraphQLID },
    organization: { type: GraphQLNonNull(AddOrUpdateOrganizationInputType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { id: string; organization: AddOrUpdateOrganizationInput },
    context: { user: User }
  ): Promise<Organization> => {
    const org = await OrganizationModel.findById(args.id);
    const id = org ? org.uuid : uuid();
    if (org) {
      if (!canEditOrganization(org, context.user)) {
        throw new Error(
          'you do not have permission to add or edit organization'
        );
      }
    } else {
      const userRole = context.user.userRole;
      if (
        userRole !== UserRole.SUPER_ADMIN &&
        userRole !== UserRole.SUPER_CONTENT_MANAGER
      ) {
        throw new Error(
          'you do not have permission to add or edit organization'
        );
      }
    }
    return await OrganizationModel.findOneAndUpdate(
      { _id: args.id },
      {
        $set: { ...args.organization, uuid: id },
      },
      {
        new: true,
        upsert: true,
      }
    );
  },
};

export default addOrUpdateOrganization;
