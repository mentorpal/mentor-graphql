/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLID,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInt,
} from 'graphql';
import SettingModel, { Config } from '../../../models/Setting';
import { User, UserRole } from '../../../models/User';
import { ConfigType } from '../../types/config';

export interface ConfigUpdateInput {
  mentorsDefault: string[];
  activeMentors: string[];
  featuredMentors: string[];
  featuredMentorPanels: string[];
  styleHeaderLogo: string;
  styleHeaderColor: string;
  styleHeaderTextColor: string;
  disclaimerTitle: string;
  disclaimerText: string;
  disclaimerDisabled: boolean;
  displayGuestPrompt: boolean;
  videoRecorderMaxLength: number;
}

export const ConfigUpdateInputType = new GraphQLInputObjectType({
  name: 'ConfigUpdateInputType',
  fields: () => ({
    mentorsDefault: { type: GraphQLList(GraphQLID) },
    activeMentors: { type: GraphQLList(GraphQLID) },
    featuredMentors: { type: GraphQLList(GraphQLID) },
    featuredMentorPanels: { type: GraphQLList(GraphQLID) },
    styleHeaderLogo: { type: GraphQLString },
    styleHeaderColor: { type: GraphQLString },
    styleHeaderTextColor: { type: GraphQLString },
    disclaimerTitle: { type: GraphQLString },
    disclaimerText: { type: GraphQLString },
    disclaimerDisabled: { type: GraphQLBoolean },
    displayGuestPrompt: { type: GraphQLBoolean },
    videoRecorderMaxLength: { type: GraphQLInt },
  }),
});

export const updateConfig = {
  type: ConfigType,
  args: {
    config: { type: GraphQLNonNull(ConfigUpdateInputType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { config: ConfigUpdateInput },
    context: { user: User }
  ): Promise<Config> => {
    if (
      context.user.userRole !== UserRole.ADMIN &&
      context.user.userRole !== UserRole.CONTENT_MANAGER
    ) {
      throw new Error('you do not have permission to edit config');
    }
    await SettingModel.saveConfig(args.config);
    return await SettingModel.getConfig();
  },
};

export default updateConfig;