/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Document, Model, Schema } from 'mongoose';
import {
  MentorType,
  OrgPermissionProps,
  OrgPermissionSchema,
  OrgPermissionType,
} from './Mentor';
import {
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { OrgPermissionInputType } from '../gql/mutation/me/mentor-update-privacy';

export interface MentorConfig extends Document {
  configId: string;
  subjects: string[];
  publiclyVisible: boolean;
  mentorType: MentorType;
  orgPermissions: OrgPermissionProps[];

  loginHeaderText: string;
  welcomeSlideHeader: string;
  welcomeSlideText: string;
  disableMyGoalSlide: boolean;
  disableFollowups: boolean;
  disableKeywordsRecommendation: boolean;
  disableThumbnailRecommendation: boolean;
  disableLevelProgressDisplay: boolean;
}

export const MentorConfigSchema = new Schema(
  {
    configId: { type: String, default: '' },
    subjects: { type: [String], default: [] },
    publiclyVisible: { type: Boolean, default: false },
    mentorType: { type: String },
    orgPermissions: { type: [OrgPermissionSchema], default: [] },
    loginHeaderText: { type: String, default: '' },
    welcomeSlideHeader: { type: String, default: '' },
    welcomeSlideText: { type: String, default: '' },
    disableMyGoalSlide: { type: Boolean, default: false },
    disableFollowups: { type: Boolean, default: false },
    disableKeywordsRecommendation: { type: Boolean, default: false },
    disableThumbnailRecommendation: { type: Boolean, default: false },
    disableLevelProgressDisplay: { type: Boolean, default: false },
  },
  { timestamps: true, collation: { locale: 'en', strength: 2 } }
);

export const MentorConfigInputType = new GraphQLInputObjectType({
  name: 'MentorConfigInputType',
  fields: {
    configId: { type: GraphQLString },
    subjects: { type: GraphQLList(GraphQLString) },
    publiclyVisible: { type: GraphQLBoolean },
    mentorType: { type: GraphQLString },
    orgPermissions: { type: GraphQLList(OrgPermissionInputType) },
    // do not affect mentor doc
    loginHeaderText: { type: GraphQLString },
    welcomeSlideHeader: { type: GraphQLString },
    welcomeSlideText: { type: GraphQLString },
    disableMyGoalSlide: { type: GraphQLBoolean },
    disableFollowups: { type: GraphQLBoolean },
    disableKeywordsRecommendation: { type: GraphQLBoolean },
    disableThumbnailRecommendation: { type: GraphQLBoolean },
    disableLevelProgressDisplay: { type: GraphQLBoolean },
  },
});

export const MentorConfigType = new GraphQLObjectType({
  name: 'MentorConfigType',
  fields: {
    configId: { type: GraphQLString },
    subjects: { type: GraphQLList(GraphQLString) },
    publiclyVisible: { type: GraphQLBoolean },
    mentorType: { type: GraphQLString },
    orgPermissions: { type: GraphQLList(OrgPermissionType) },
    loginHeaderText: { type: GraphQLString },
    welcomeSlideHeader: { type: GraphQLString },
    welcomeSlideText: { type: GraphQLString },
    disableMyGoalSlide: { type: GraphQLBoolean },
    disableFollowups: { type: GraphQLBoolean },
    disableKeywordsRecommendation: { type: GraphQLBoolean },
    disableThumbnailRecommendation: { type: GraphQLBoolean },
    disableLevelProgressDisplay: { type: GraphQLBoolean },
  },
});

MentorConfigSchema.index({ configId: -1, _id: -1 });
export interface MentorConfigModel extends Model<MentorConfig> {}

export default mongoose.model<MentorConfig, MentorConfigModel>(
  'MentorConfig',
  MentorConfigSchema
);
