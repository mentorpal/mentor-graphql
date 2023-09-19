/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Document, Model, Schema } from 'mongoose';
import { OrgPermissionProps, OrgPermissionSchema } from './Mentor';
import {
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { OrgPermissionInputType } from 'gql/mutation/me/mentor-update-privacy';
import { OrgPermissionType } from 'gql/types/mentor';

export interface MentorConfig extends Document {
  configId: string;
  subjects: string[];
  publiclyVisible: boolean;
  orgPermissions: OrgPermissionProps[];
}

export const MentorConfigSchema = new Schema(
  {
    configId: { type: String, default: '' },
    subjects: { type: [String], default: [] },
    publiclyVisible: { type: Boolean, default: false },
    orgPermissions: { type: [OrgPermissionSchema], default: [] },
  },
  { timestamps: true, collation: { locale: 'en', strength: 2 } }
);

export const MentorConfigInputType = new GraphQLInputObjectType({
  name: 'MentorConfigInputType',
  fields: {
    configId: { type: GraphQLString },
    subjects: { type: GraphQLList(GraphQLString) },
    publiclyVisible: { type: GraphQLBoolean },
    orgPermissions: { type: GraphQLList(OrgPermissionInputType) },
  },
});

export const MentorConfigType = new GraphQLObjectType({
  name: 'MentorConfigType',
  fields: {
    configId: { type: GraphQLString },
    subjects: { type: GraphQLList(GraphQLString) },
    publiclyVisible: { type: GraphQLBoolean },
    orgPermissions: { type: GraphQLList(OrgPermissionType) },
  },
});

MentorConfigSchema.index({ configId: -1, _id: -1 });
export interface MentorConfigModel extends Model<MentorConfig> {}

export default mongoose.model<MentorConfig, MentorConfigModel>(
  'MentorConfig',
  MentorConfigSchema
);
