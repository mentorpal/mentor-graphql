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
import OrganizationType from '../../../gql/types/organization';
import OrganizationModel, { Organization } from '../../../models/Organization';
import { User, UserRole } from '../../../models/User';
import { canEditOrganization } from '../../../utils/check-permissions';
import { idOrNew } from './helpers';

const reservedSubdomains = [
  'newdev',
  'v2',
  'local',
  'uscquestions',
  'api',
  'api-dev',
  'api-qa',
  'static',
  'static-v2',
  'static-newdev',
  'static-careerfair',
  'static-uscquestions',
  'sbert',
  'sbert-qa',
];

interface AddOrUpdateOrganizationInput {
  name: string;
  subdomain: string;
  isPrivate: string;
  accessCodes: string[];
  members: OrganizationMentorInput[];
}

interface OrganizationMentorInput {
  user: string;
  role: string;
}

export const OrganizationMemberInputType = new GraphQLInputObjectType({
  name: 'OrganizationMemberInputType',
  fields: {
    user: { type: GraphQLNonNull(GraphQLID) },
    role: { type: GraphQLNonNull(GraphQLString) },
  },
});

export const AddOrUpdateOrganizationInputType = new GraphQLInputObjectType({
  name: 'AddOrUpdateOrganizationInputType',
  fields: {
    name: { type: GraphQLString },
    subdomain: { type: GraphQLString },
    isPrivate: { type: GraphQLBoolean },
    accessCodes: { type: GraphQLList(GraphQLString) },
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
    if (context.user?.isDisabled) {
      throw new Error('Your account has been disabled');
    }
    const org = args.id ? await OrganizationModel.findById(args.id) : undefined;
    const id = org ? org.uuid : uuid();
    if (org) {
      if (!canEditOrganization(org, context.user)) {
        throw new Error('you do not have permission to edit organization');
      }
    } else {
      const userRole = context.user.userRole;
      if (
        userRole !== UserRole.SUPER_ADMIN &&
        userRole !== UserRole.SUPER_CONTENT_MANAGER
      ) {
        throw new Error('you do not have permission to create an organization');
      }
      if (!args.organization.name) {
        throw new Error('you must have an organization name');
      }
      if (!args.organization.subdomain) {
        throw new Error('you must have an organization subdomain');
      }
    }
    const subdomain = args.organization.subdomain;
    if (subdomain && !/^[a-z0-9]{3,20}$/.test(subdomain)) {
      throw new Error(
        'subdomain must be lower-case, alpha-numerical, and 3-20 characters'
      );
    }
    if (reservedSubdomains.includes(subdomain)) {
      throw new Error(
        'subdomain is reserved, please pick a different subdomain'
      );
    }
    const checkSubdomain = await OrganizationModel.findOne({
      subdomain: subdomain,
    });
    if (checkSubdomain && `${checkSubdomain._id}` !== `${args.id}`) {
      throw new Error(
        'subdomain is already in use, please pick a different subdomain'
      );
    }
    return await OrganizationModel.findOneAndUpdate(
      { _id: idOrNew(args.id) },
      {
        $set: {
          ...args.organization,
          uuid: id,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );
  },
};

export default addOrUpdateOrganization;
