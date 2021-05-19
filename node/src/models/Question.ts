/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Document, Model, Schema } from 'mongoose';
import { Mentor, MentorType } from './Mentor';
import {
  PaginatedResolveResult,
  PaginateOptions,
  PaginateQuery,
  pluginPagination,
} from './Paginatation';

export enum QuestionType {
  UTTERANCE = 'UTTERANCE',
  QUESTION = 'QUESTION',
}

export interface Question extends Document {
  question: string;
  type: string;
  name: string;
  paraphrases: string[];
  mentor: Mentor['_id'];
  mentorType: string;
  minVideoLength: number;
}

export const QuestionSchema = new Schema({
  question: { type: String },
  type: {
    type: String,
    enum: [QuestionType.UTTERANCE, QuestionType.QUESTION],
    default: QuestionType.QUESTION,
  },
  name: { type: String },
  paraphrases: [{ type: String }],
  mentor: {
    type: Schema.Types.ObjectId,
    ref: 'Mentor',
  },
  mentorType: {
    type: String,
    enum: [MentorType.VIDEO, MentorType.CHAT],
  },
  minVideoLength: { type: Number },
});

export interface QuestionModel extends Model<Question> {
  paginate(
    query?: PaginateQuery<Question>,
    options?: PaginateOptions
  ): Promise<PaginatedResolveResult<Question>>;
}

QuestionSchema.index({ question: -1, _id: -1 });
QuestionSchema.index({ type: -1, _id: -1 });
QuestionSchema.index({ name: -1, _id: -1 });
pluginPagination(QuestionSchema);

export default mongoose.model<Question, QuestionModel>(
  'Question',
  QuestionSchema
);
