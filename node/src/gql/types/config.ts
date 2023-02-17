/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLList,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLID,
} from 'graphql';

export const ConfigType = new GraphQLObjectType({
  name: 'Config',
  fields: () => ({
    cmi5Enabled: { type: GraphQLBoolean },
    cmi5Endpoint: { type: GraphQLString },
    cmi5Fetch: { type: GraphQLString },
    classifierLambdaEndpoint: { type: GraphQLString },
    uploadLambdaEndpoint: { type: GraphQLString },
    graphqlLambdaEndpoint: { type: GraphQLString },
    subjectRecordPriority: { type: GraphQLList(GraphQLID) },
    filterEmailMentorAddress: { type: GraphQLString },
    videoRecorderMaxLength: { type: GraphQLInt },
    googleClientId: { type: GraphQLString },
    virtualBackgroundUrls: { type: GraphQLList(GraphQLString) },
    defaultVirtualBackground: { type: GraphQLString },
    urlGraphql: { type: GraphQLString },
    urlVideo: { type: GraphQLString },
    urlDocSetup: { type: GraphQLString },
    urlVideoIdleTips: { type: GraphQLString },
    // style settings
    styleHeaderTitle: { type: GraphQLString },
    styleHeaderText: { type: GraphQLString },
    styleHeaderColor: { type: GraphQLString },
    styleHeaderTextColor: { type: GraphQLString },
    styleHeaderLogo: { type: GraphQLString },
    styleHeaderLogoUrl: { type: GraphQLString },
    homeFooterColor: { type: GraphQLString },
    homeFooterTextColor: { type: GraphQLString },
    homeFooterImages: { type: GraphQLList(GraphQLString) },
    homeFooterLinks: { type: GraphQLList(GraphQLString) },
    styleHeaderLogoOffset: { type: GraphQLInt },
    styleHeaderLogoHeight: { type: GraphQLInt },
    styleHeaderLogoWidth: { type: GraphQLInt },
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
    guestPromptTitle: { type: GraphQLString },
    guestPromptText: { type: GraphQLString },
    guestPromptInputType: { type: GraphQLString },
    surveyButtonInDisclaimer: { type: GraphQLString },
    // client settings
    questionSortOrder: { type: GraphQLString },
    mentorsDefault: { type: GraphQLList(GraphQLString) },
    postSurveyLink: { type: GraphQLString },
    postSurveyTimer: { type: GraphQLInt },
    postSurveyUserIdEnabled: { type: GraphQLBoolean },
    postSurveyReferrerEnabled: { type: GraphQLBoolean },
    minTopicQuestionSize: { type: GraphQLInt },
    // home style settings
    activeMentors: { type: GraphQLList(GraphQLID) },
    activeMentorPanels: { type: GraphQLList(GraphQLID) },
    featuredMentors: { type: GraphQLList(GraphQLID) },
    featuredMentorPanels: { type: GraphQLList(GraphQLID) },
    featuredSubjects: { type: GraphQLList(GraphQLID) },
    featuredKeywordTypes: { type: GraphQLList(GraphQLString) },
    defaultSubject: { type: GraphQLID },
  }),
});

export default ConfigType;
