/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { toUpdateProps } from '../gql/mutation/me/helpers';
import { QuestionUpdateInput } from '../gql/mutation/me/question-update';
import mongoose, { Model, Schema, Types } from 'mongoose';
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

export interface Question {
  _id: Types.ObjectId;
  question: string;
  type: string;
  subType: string;
  name: string;
  clientId: string;
  paraphrases: string[];
  mentor: Mentor['_id'];
  mentorType: string;
  minVideoLength: number;
}

export const QuestionSchema = new Schema<Question, QuestionModel>(
  {
    question: { type: String },
    type: {
      type: String,
      enum: [QuestionType.UTTERANCE, QuestionType.QUESTION],
      default: QuestionType.QUESTION,
    },
    subType: {
      type: String,
    },
    name: { type: String },
    clientId: { type: String },
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
  },
  { timestamps: true, collation: { locale: 'en', strength: 2 } }
);

export interface QuestionModel extends Model<Question> {
  paginate(
    query?: PaginateQuery<Question>,
    options?: PaginateOptions
  ): Promise<PaginatedResolveResult<Question>>;
  updateOrCreate(question: QuestionUpdateInput): Promise<Question>;
}

QuestionSchema.statics.updateOrCreate = async function (
  question: QuestionUpdateInput
) {
  const { _id, props } = toUpdateProps<Question>(question);
  return await this.findOneAndUpdate(
    { _id: _id },
    {
      $set: props,
    },
    {
      new: true,
      upsert: true,
    }
  );
};

QuestionSchema.index({ question: -1, _id: -1 });
QuestionSchema.index({ type: -1, _id: -1 });
QuestionSchema.index({ name: -1, _id: -1 });
pluginPagination(QuestionSchema);

export default mongoose.model<Question, QuestionModel>(
  'Question',
  QuestionSchema
);
