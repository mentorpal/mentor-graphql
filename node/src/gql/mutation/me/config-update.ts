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
import { User } from '../../../models/User';
import { ConfigType } from '../../types/config';
import { canEditContent } from '../../../utils/check-permissions';

export interface ConfigUpdateInput {
  virtualBackgroundUrls: string[];
  defaultVirtualBackground: string;
  videoRecorderMaxLength: number;
  // style settings
  styleHeaderTitle: string;
  styleHeaderText: string;
  styleHeaderColor: string;
  styleHeaderTextColor: string;
  styleHeaderLogo: string;
  styleHeaderLogoUrl: string;
  homeFooterColor: string;
  homeFooterTextColor: string;
  homeFooterImages: string[];
  styleHeaderLogoOffset: number;
  styleHeaderLogoHeight: number;
  styleHeaderLogoWidth: number;
  homeFooterLinks: string[];
  homeBannerColor: string;
  homeBannerButtonColor: string;
  homeCarouselColor: string;
  // popup settings
  walkthroughDisabled: boolean;
  walkthroughTitle: string;
  urlVideoMentorpalWalkthrough: string;
  disclaimerDisabled: boolean;
  disclaimerTitle: string;
  disclaimerText: string;
  termsOfServiceDisabled: boolean;
  termsOfServiceText: string;
  displayGuestPrompt: boolean;
  displaySurveyPopupCondition: string;
  guestPromptTitle: string;
  guestPromptText: string;
  guestPromptInputType: string;
  surveyButtonInDisclaimer: string;
  // client settings
  questionSortOrder: string;
  mentorsDefault: string[];
  postSurveyLink: string;
  postSurveyTimer: number;
  minTopicQuestionSize: number;
  // home settings
  activeMentors: string[];
  activeMentorPanels: string[];
  featuredMentors: string[];
  featuredMentorPanels: string[];
  featuredSubjects: string[];
  featuredKeywordTypes: string[];
  defaultSubject: string;
}

export const ConfigUpdateInputType = new GraphQLInputObjectType({
  name: 'ConfigUpdateInputType',
  fields: () => ({
    virtualBackgroundUrls: { type: new GraphQLList(GraphQLString) },
    defaultVirtualBackground: { type: GraphQLString },
    videoRecorderMaxLength: { type: GraphQLInt },
    filterEmailMentorAddress: { type: GraphQLString },
    // style settings
    styleHeaderTitle: { type: GraphQLString },
    styleHeaderText: { type: GraphQLString },
    styleHeaderColor: { type: GraphQLString },
    styleHeaderTextColor: { type: GraphQLString },
    styleHeaderLogo: { type: GraphQLString },
    styleHeaderLogoUrl: { type: GraphQLString },
    styleHeaderLogoOffset: { type: GraphQLInt },
    styleHeaderLogoHeight: { type: GraphQLInt },
    styleHeaderLogoWidth: { type: GraphQLInt },
    homeFooterColor: { type: GraphQLString },
    homeFooterTextColor: { type: GraphQLString },
    homeFooterImages: { type: new GraphQLList(GraphQLString) },
    homeFooterLinks: { type: new GraphQLList(GraphQLString) },
    homeBannerColor: { type: GraphQLString },
    homeBannerButtonColor: { type: GraphQLString },
    homeCarouselColor: { type: GraphQLString },
    // popup settings
    walkthroughDisabled: { type: GraphQLBoolean },
    walkthroughTitle: { type: GraphQLString },
    urlVideoMentorpalWalkthrough: { type: GraphQLString },
    disclaimerDisabled: { type: GraphQLBoolean },
    disclaimerTitle: { type: GraphQLString },
    disclaimerText: { type: GraphQLString },
    termsOfServiceDisabled: { type: GraphQLBoolean },
    termsOfServiceText: { type: GraphQLString },
    displayGuestPrompt: { type: GraphQLBoolean },
    displaySurveyPopupCondition: { type: GraphQLString },
    guestPromptTitle: { type: GraphQLString },
    guestPromptText: { type: GraphQLString },
    guestPromptInputType: { type: GraphQLString },
    surveyButtonInDisclaimer: { type: GraphQLString },
    // client settings
    questionSortOrder: { type: GraphQLString },
    mentorsDefault: { type: new GraphQLList(GraphQLID) },
    postSurveyLink: { type: GraphQLString },
    postSurveyTimer: { type: GraphQLInt },
    postSurveyUserIdEnabled: { type: GraphQLBoolean },
    postSurveyReferrerEnabled: { type: GraphQLBoolean },
    minTopicQuestionSize: { type: GraphQLInt },
    // home style settings
    activeMentors: { type: new GraphQLList(GraphQLID) },
    activeMentorPanels: { type: new GraphQLList(GraphQLID) },
    featuredMentors: { type: new GraphQLList(GraphQLID) },
    featuredMentorPanels: { type: new GraphQLList(GraphQLID) },
    featuredSubjects: { type: new GraphQLList(GraphQLID) },
    featuredKeywordTypes: { type: new GraphQLList(GraphQLString) },
    defaultSubject: { type: GraphQLID },
  }),
});

export const updateConfig = {
  type: ConfigType,
  args: {
    config: { type: new GraphQLNonNull(ConfigUpdateInputType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { config: ConfigUpdateInput },
    context: { user: User }
  ): Promise<Config> => {
    if (context.user?.isDisabled) {
      throw new Error('Your account has been disabled');
    }
    if (!canEditContent(context.user)) {
      throw new Error('you do not have permission to edit config');
    }
    await SettingModel.saveConfig(args.config);
    return await SettingModel.getConfig();
  },
};

export default updateConfig;
