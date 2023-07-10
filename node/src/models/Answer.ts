/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/

import mongoose, { Document, Model, Schema } from 'mongoose';
import { Question } from './Question';
import { Mentor } from './Mentor';
import {
  PaginatedResolveResult,
  PaginateOptions,
  PaginateQuery,
  pluginPagination,
} from './Paginatation';
import { IExternalVideoIds } from '../gql/mutation/api/update-answers';

export enum Status {
  NONE = 'NONE',
  INCOMPLETE = 'INCOMPLETE',
  COMPLETE = 'COMPLETE',
  SKIP = 'SKIP',
}

export interface AnswerMediaProps {
  type: string;
  tag: string;
  url: string;
  transparentVideoUrl: string;
  hash: string;
  stringMetadata: string;
  duration?: number;
  needsTransfer: boolean;
}
export interface AnswerMedia extends AnswerMediaProps, Document {}

export const AnswerMediaSchema = new Schema({
  type: { type: String },
  tag: { type: String },
  url: { type: String },
  transparentVideoUrl: { type: String },
  stringMetadata: { type: String, default: '' },
  hash: { type: String, default: '' },
  duration: { type: Number, require: false, default: -1 },
  needsTransfer: { type: Boolean, default: false },
});

export const ExternalVideoIdsSchema = new Schema({
  wistiaId: { type: String },
});

export interface Answer extends Document {
  mentor: Mentor['_id'];
  question: Question['_id'] | Question;
  hasEditedTranscript: boolean;
  transcript: string;
  status: Status;
  media: AnswerMedia[];
  webMedia: AnswerMedia;
  mobileMedia: AnswerMedia;
  vttMedia: AnswerMedia;
  hasUntransferredMedia: boolean;
  externalVideoIds: IExternalVideoIds;
}

export interface AnswerModel extends Model<Answer> {
  paginate(
    query?: PaginateQuery<Question>,
    options?: PaginateOptions
  ): Promise<PaginatedResolveResult<Answer>>;
}

export const AnswerSchema = new Schema<Answer, AnswerModel>(
  {
    mentor: { type: mongoose.Types.ObjectId, ref: 'Mentor' },
    question: { type: mongoose.Types.ObjectId, ref: 'Question' },
    hasEditedTranscript: { type: Boolean, default: false },
    transcript: { type: String },
    status: {
      type: String,
      enum: Status,
      default: Status.NONE,
    },
    webMedia: { type: AnswerMediaSchema },
    mobileMedia: { type: AnswerMediaSchema },
    vttMedia: { type: AnswerMediaSchema },
    media: { type: [AnswerMediaSchema] },
    hasUntransferredMedia: { type: Boolean, default: false },
    externalVideoIds: { type: ExternalVideoIdsSchema },
  },
  { timestamps: true, collation: { locale: 'en', strength: 2 } }
);

AnswerSchema.index({ question: -1, mentor: -1 }, { unique: true });
pluginPagination(AnswerSchema);

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AnswerModel extends Model<Answer> {}

export default mongoose.model<Answer, AnswerModel>('Answer', AnswerSchema);
