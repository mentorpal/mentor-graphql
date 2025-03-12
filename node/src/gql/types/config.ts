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
    subjectRecordPriority: { type: new GraphQLList(GraphQLID) },
    filterEmailMentorAddress: { type: GraphQLString },
    videoRecorderMaxLength: { type: GraphQLInt },
    googleClientId: { type: GraphQLString },
    virtualBackgroundUrls: { type: new GraphQLList(GraphQLString) },
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
    homeFooterImages: { type: new GraphQLList(GraphQLString) },
    homeFooterLinks: { type: new GraphQLList(GraphQLString) },
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
    displaySurveyPopupCondition: { type: GraphQLString },
    guestPromptTitle: { type: GraphQLString },
    guestPromptText: { type: GraphQLString },
    guestPromptInputType: { type: GraphQLString },
    surveyButtonInDisclaimer: { type: GraphQLString },
    // client settings
    questionSortOrder: { type: GraphQLString },
    mentorsDefault: { type: new GraphQLList(GraphQLString) },
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

export default ConfigType;
