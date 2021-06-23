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
  TRANSCRIBE_IN_PROGRESS = 'TRANSCRIBE_IN_PROGRESS',
  TRANSCRIBE_FAILED = 'TRANSCRIBE_FAILED',
  UPLOAD_IN_PROGRESS = 'UPLOAD_IN_PROGRESS',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  CANCEL_IN_PROGRESS = 'CANCEL_IN_PROGRESS',
  CANCELLED = 'CANCELLED',
  DONE = 'DONE',
}

export interface UploadTask extends Document {
  mentor: Mentor['_id'];
  question: Question['_id'];
  taskId: string;
  uploadStatus: UploadStatus;
  transcript: string;
  media: AnswerMedia[];
}

export const UploadTaskSchema = new Schema(
  {
    mentor: { type: mongoose.Types.ObjectId, ref: 'Mentor' },
    question: { type: mongoose.Types.ObjectId, ref: 'Question' },
    taskId: { type: String },
    uploadStatus: {
      type: String,
      enum: Object.values(UploadStatus),
      default: UploadStatus.NONE,
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
