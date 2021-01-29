/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/

import mongoose, { Document, Model, Schema } from 'mongoose';

export enum Status {
  INCOMPLETE = 'Incomplete',
  COMPLETE = 'Complete',
}

export interface Question extends Document {
  id: string;
  question: string;
  subject: string;
  topics: [string];
  video: string;
  transcript: string;
  status: Status;
  recordedAt: Date;
}

export const QuestionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  question: { type: String },
  subject: { type: String },
  topics: { type: [String] },
  video: { type: String },
  transcript: { type: String },
  status: {
    type: String,
    enum: [Status.INCOMPLETE, Status.COMPLETE],
    default: Status.INCOMPLETE,
  },
  recordedAt: { type: Date },
});

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface QuestionModel extends Model<Question> {}

export default mongoose.model<Question, QuestionModel>(
  'Question',
  QuestionSchema
);
