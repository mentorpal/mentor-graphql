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
    googleClientId: { type: GraphQLString },
    mentorsDefault: { type: GraphQLList(GraphQLString) },
    featuredMentors: { type: GraphQLList(GraphQLID) },
    featuredMentorPanels: { type: GraphQLList(GraphQLID) },
    activeMentors: { type: GraphQLList(GraphQLID) },
    urlClassifier: { type: GraphQLString },
    urlGraphql: { type: GraphQLString },
    urlVideo: { type: GraphQLString },
    urlVideoIdleTips: { type: GraphQLString },
    urlVideoMentorpalWalkthrough: { type: GraphQLString },
    classifierLambdaEndpoint: { type: GraphQLString },
    uploadLambdaEndpoint: { type: GraphQLString },
    filterEmailMentorAddress: { type: GraphQLString },
    videoRecorderMaxLength: { type: GraphQLInt },
    styleHeaderLogo: { type: GraphQLString },
    styleHeaderColor: { type: GraphQLString },
    styleHeaderTextColor: { type: GraphQLString },
    displayGuestPrompt: { type: GraphQLBoolean },
    disclaimerTitle: { type: GraphQLString },
    disclaimerText: { type: GraphQLString },
    disclaimerDisabled: { type: GraphQLBoolean },
  }),
});

export default ConfigType;
