/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/

import mongoose, { Document, Model, Schema } from 'mongoose';
import { Mentor } from './Mentor';
import { GraphQLString, GraphQLObjectType, GraphQLList } from 'graphql';

export interface GraphQLUpdateProps {
  status: string;
  errorMessage: string;
}

export interface GraphQLUpdateInfo extends GraphQLUpdateProps, Document {}

export const GraphQLUpdateSchema = new Schema({
  status: { type: String },
  errorMessage: { type: String },
});

export const GraphQLUpdateType = new GraphQLObjectType({
  name: 'GraphQLUpdate',
  fields: {
    status: { type: GraphQLString },
    errorMessage: { type: GraphQLString },
  },
});

export interface AnswerMediaMigrateUpdateProps {
  question: string;
  status: string;
  errorMessage: string;
}

export interface s3VideoMigrateProps {
  status: string;
  answerMediaMigrations: AnswerMediaMigrateUpdateProps[];
}

export const AnswerMediaMigrationSchema = new Schema({
  question: { type: String },
  status: { type: String },
  errorMessage: { type: String },
});

export const AnswerMediaMigrationType = new GraphQLObjectType({
  name: 'AnswerMediaMigration',
  fields: {
    question: { type: GraphQLString },
    status: { type: GraphQLString },
    errorMessage: { type: GraphQLString },
  },
});

export interface s3VideoMigrateInfo extends s3VideoMigrateProps, Document {}

export const s3VideoMigrateSchema = new Schema({
  status: { type: String },
  answerMediaMigrations: { type: [AnswerMediaMigrationSchema] },
});

export const S3VideoMigrateType = new GraphQLObjectType({
  name: 'S3VideoMigrate',
  fields: {
    status: { type: GraphQLString },
    answerMediaMigrations: { type: GraphQLList(AnswerMediaMigrationType) },
  },
});

export interface ImportTask extends Document {
  mentor: Mentor['_id'];
  graphQLUpdate: GraphQLUpdateInfo;
  s3VideoMigrate: s3VideoMigrateInfo;
}

export const ImportTaskSchema = new Schema<ImportTask, ImportTaskModel>(
  {
    mentor: { type: mongoose.Types.ObjectId, ref: 'Mentor' },
    graphQLUpdate: { type: GraphQLUpdateSchema },
    s3VideoMigrate: { type: s3VideoMigrateSchema },
  },
  { timestamps: true, collation: { locale: 'en', strength: 2 } }
);

ImportTaskSchema.index({ mentor: -1 }, { unique: true });

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ImportTaskModel extends Model<ImportTask> {}

export default mongoose.model<ImportTask, ImportTaskModel>(
  'ImportTask',
  ImportTaskSchema
);
