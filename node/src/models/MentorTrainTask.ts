/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/

import mongoose, { Document, Model, Schema } from 'mongoose';
import { Mentor } from './Mentor';
import { GraphQLID, GraphQLObjectType, GraphQLString } from 'graphql';

export enum TrainStatus {
  NONE = 'NONE',
  FAILURE = 'FAILURE',
  SUCCESS = 'SUCCESS',
  PENDING = 'PENDING',
  STARTED = 'STARTED',
}

export interface MentorTrainTask extends Document {
  mentor: Mentor['_id'];
  status: TrainStatus;
}

export const MentorTrainTaskType = new GraphQLObjectType({
  name: 'MentorTrainTaskType',
  fields: () => ({
    _id: { type: GraphQLID },
    mentor: { type: GraphQLID },
    status: { type: GraphQLString },
  }),
});

export const MentorTrainTaskSchema = new Schema<
  MentorTrainTask,
  MentorTrainTaskModel
>(
  {
    mentor: { type: Schema.Types.ObjectId, ref: 'Mentor' },
    status: { type: String, enum: TrainStatus, default: TrainStatus.NONE },
  },
  { timestamps: true, collation: { locale: 'en', strength: 2 } }
);

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MentorTrainTaskModel extends Model<MentorTrainTask> {}

export default mongoose.model<MentorTrainTask, MentorTrainTaskModel>(
  'MentorTrainTask',
  MentorTrainTaskSchema
);
