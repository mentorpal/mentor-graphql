/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import ConfigType from './config';
import DateType from './date';
import { UserType } from './user';
import { User as UserModel } from '../../models';
import OrganizationModel, { Organization } from '../../models/Organization';

export const OrgMemberType = new GraphQLObjectType({
  name: 'OrgMemberType',
  fields: () => ({
    user: { type: UserType },
    role: { type: GraphQLString },
  }),
});

export const OrganizationType = new GraphQLObjectType({
  name: 'Organization',
  fields: () => ({
    _id: { type: GraphQLID },
    uuid: { type: GraphQLString },
    name: { type: GraphQLString },
    subdomain: { type: GraphQLString },
    isPrivate: { type: GraphQLBoolean },
    accessCodes: { type: GraphQLList(GraphQLString) },
    createdAt: { type: DateType },
    updatedAt: { type: DateType },
    config: {
      type: ConfigType,
      resolve: async function (org: Organization) {
        return await OrganizationModel.getConfig(org);
      },
    },
    members: {
      type: GraphQLList(OrgMemberType),
      resolve: async function (org: Organization) {
        const users = await UserModel.find({
          _id: { $in: org.members.map((m) => m.user) },
        });
        return org.members.map((m) => ({
          user: users.find((u) => `${u._id}` === `${m.user}`),
          role: m.role,
        }));
      },
    },
  }),
});

export default OrganizationType;
