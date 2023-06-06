/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLObjectType, GraphQLNonNull, GraphQLID } from 'graphql';
import { ConfigType } from '../../../gql/types/config';
import { Config } from '../../../models/Setting';
import OrganizationModel from '../../../models/Organization';
import { User } from '../../../models/User';
import { canEditOrganization } from '../../../utils/check-permissions';
import { ConfigUpdateInput, ConfigUpdateInputType } from './config-update';

export const updateOrgConfig = {
  type: ConfigType,
  args: {
    id: { type: GraphQLNonNull(GraphQLID) },
    config: { type: GraphQLNonNull(ConfigUpdateInputType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { id: string; config: ConfigUpdateInput },
    context: { user: User }
  ): Promise<Config> => {
    if (context.user?.isDisabled) {
      throw new Error('Your account has been disabled');
    }
    const org = await OrganizationModel.findById(args.id);
    if (!org) {
      throw new Error('invalid organization id');
    }
    if (!canEditOrganization(org, context.user)) {
      throw new Error('you do not have permission to edit organization');
    }
    return await OrganizationModel.saveConfig(org, args.config);
  },
};

export default updateOrgConfig;
