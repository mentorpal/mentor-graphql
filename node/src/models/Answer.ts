/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/

import mongoose, { Document, Model, Schema } from 'mongoose';
import { Question } from './Question';
import { Mentor } from './Mentor';

export enum Status {
  INCOMPLETE = 'INCOMPLETE',
  COMPLETE = 'COMPLETE',
}

export interface AnswerMediaProps {
  type: string;
  tag: string;
  url: string;
}
export interface AnswerMedia extends AnswerMediaProps, Document {}

export const AnswerMediaSchema = new Schema({
  type: { type: String },
  tag: { type: String },
  url: { type: String },
});

export interface Answer extends Document {
  mentor: Mentor['_id'];
  question: Question['_id'];
  transcript: string;
  status: Status;
  media: AnswerMedia[];
}

export const AnswerSchema = new Schema<Answer, AnswerModel>({
  mentor: { type: mongoose.Types.ObjectId, ref: 'Mentor' },
  question: { type: mongoose.Types.ObjectId, ref: 'Question' },
  transcript: { type: String },
  status: {
    type: String,
    enum: [Status.INCOMPLETE, Status.COMPLETE],
    default: Status.INCOMPLETE,
  },
  media: { type: [AnswerMediaSchema] },
});

AnswerSchema.index({ question: -1, mentor: -1 }, { unique: true });

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AnswerModel extends Model<Answer> {}

export default mongoose.model<Answer, AnswerModel>('Answer', AnswerSchema);
