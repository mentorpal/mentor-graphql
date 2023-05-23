/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLBoolean, GraphQLObjectType, GraphQLString } from 'graphql';
import { Organization } from '../../models/Organization';
import { User } from '../../models/User';
import { canViewOrganization } from '../../utils/check-permissions';

export interface OrgCheckPermission {
  isOrg: boolean;
  isPrivate: boolean;
  canView: boolean;
}
export const OrgCheckPermissionType = new GraphQLObjectType({
  name: 'OrgCheckPermissionType',
  fields: () => ({
    isOrg: { type: GraphQLBoolean },
    isPrivate: { type: GraphQLBoolean },
    canView: { type: GraphQLBoolean },
  }),
});

export const orgCheckPermission = {
  type: OrgCheckPermissionType,
  args: {
    orgAccessCode: { type: GraphQLString },
  },
  resolve: async (
    _: GraphQLObjectType,
    args: { orgAccessCode?: string },
    context: { org: Organization; user: User }
  ): Promise<OrgCheckPermission> => {
    const isOrg = Boolean(context.org);
    const isPrivate = isOrg ? context.org.isPrivate : false;
    const canView = isOrg
      ? canViewOrganization(context.org, context.user, args.orgAccessCode)
      : true;
    return {
      isOrg,
      isPrivate,
      canView,
    };
  },
};

export default orgCheckPermission;
