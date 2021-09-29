/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/

import mongoose, { Document, Model, Schema } from 'mongoose';
import { Question } from './Question';
import { Mentor } from './Mentor';
import { AnswerMedia, AnswerMediaSchema } from './Answer';

export enum UploadStatus {
  NONE = 'NONE',
  // TRANSCRIBE_IN_PROGRESS = 'TRANSCRIBE_IN_PROGRESS',
  // TRANSCRIBE_FAILED = 'TRANSCRIBE_FAILED',
  // UPLOAD_IN_PROGRESS = 'UPLOAD_IN_PROGRESS',
  // UPLOAD_FAILED = 'UPLOAD_FAILED',
  QUEUING = 'QUEUING',
  TRIM_IN_PROGRESS = 'TRIM_IN_PROGRESS',
  PROCESSING = 'PROCESSING', //Encapsulates the 4 stages
  TRANSFER_IN_PROGRESS = 'TRANSFER_IN_PROGRESS',
  TRANSFER_FAILED = 'TRANSFER_FAILED',
  CANCEL_IN_PROGRESS = 'CANCEL_IN_PROGRESS',
  CANCELLED = 'CANCELLED',
  DONE = 'DONE',
}

export enum TaskFlagStatuses {
  NONE = 'NONE',
  QUEUED = 'QUEUED',
  IN_PROGRESS = 'IN_PROGRESS',
  CANCELLING = 'CANCELLING',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
  DONE = 'DONE',
}

export interface UploadTask extends Document {
  mentor: Mentor['_id'];
  question: Question['_id'];
  taskId: string[];
  transferringFlag: TaskFlagStatuses;
  uploadFlag: TaskFlagStatuses;
  transcribingFlag: TaskFlagStatuses;
  transcodingFlag: TaskFlagStatuses;
  finalizationFlag: TaskFlagStatuses;
  transcript: string;
  media: AnswerMedia[];
}

export const UploadTaskSchema = new Schema<UploadTask, UploadTaskModel>(
  {
    mentor: { type: mongoose.Types.ObjectId, ref: 'Mentor' },
    question: { type: mongoose.Types.ObjectId, ref: 'Question' },
    taskId: { type: [String] },
    transferringFlag: {
      type: String,
      enum: Object.values(TaskFlagStatuses),
      default: TaskFlagStatuses.NONE,
    },
    uploadFlag: {
      type: String,
      enum: Object.values(TaskFlagStatuses),
      default: TaskFlagStatuses.NONE,
    },
    transcribingFlag: {
      type: String,
      enum: Object.values(TaskFlagStatuses),
      default: TaskFlagStatuses.NONE,
    },
    transcodingFlag: {
      type: String,
      enum: Object.values(TaskFlagStatuses),
      default: TaskFlagStatuses.NONE,
    },
    finalizationFlag: {
      type: String,
      enum: Object.values(TaskFlagStatuses),
      default: TaskFlagStatuses.NONE,
    },
    transcript: { type: String },
    media: { type: [AnswerMediaSchema] },
  },
  { timestamps: true, collation: { locale: 'en', strength: 2 } }
);

UploadTaskSchema.index({ question: -1, mentor: -1 }, { unique: true });

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UploadTaskModel extends Model<UploadTask> {}

export default mongoose.model<UploadTask, UploadTaskModel>(
  'UploadTask',
  UploadTaskSchema
);
