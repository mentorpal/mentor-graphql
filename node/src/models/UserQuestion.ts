/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Document, Model, Schema } from 'mongoose';
import {
  PaginateOptions,
  PaginatedResolveResult,
  pluginPagination,
} from './Paginatation';
import { Mentor } from './Mentor';
import { Answer } from './Answer';

export enum Feedback {
  GOOD = 'GOOD',
  BAD = 'BAD',
  NEUTRAL = 'NEUTRAL',
}

export enum ClassifierAnswerType {
  CLASSIFIER = 'CLASSIFIER',
  OFF_TOPIC = 'OFF_TOPIC',
  EXACT_MATCH = 'EXACT',
  PARAPHRASE = 'PARAPHRASE',
}

export interface UserQuestion extends Document {
  mentor: Mentor['_id'];
  question: string;
  confidence: number;
  feedback: string;
  classifierAnswer: Answer['_id'];
  classifierAnswerType: string;
  graderAnswer: Answer['_id'];
}

export const UserQuestionSchema = new Schema(
  {
    mentor: { type: mongoose.Types.ObjectId, ref: 'Mentor' },
    question: { type: String },
    confidence: { type: Number },
    classifierAnswer: { type: mongoose.Types.ObjectId, ref: 'Answer' },
    graderAnswer: { type: mongoose.Types.ObjectId, ref: 'Answer' },
    classifierAnswerType: {
      type: String,
      enum: [
        ClassifierAnswerType.CLASSIFIER,
        ClassifierAnswerType.OFF_TOPIC,
        ClassifierAnswerType.EXACT_MATCH,
        ClassifierAnswerType.PARAPHRASE,
      ],
      default: ClassifierAnswerType.CLASSIFIER,
    },
    feedback: {
      type: String,
      enum: [Feedback.GOOD, Feedback.BAD, Feedback.NEUTRAL],
      default: Feedback.NEUTRAL,
    },
  },
  { timestamps: true, collation: { locale: 'en', strength: 2 } }
);

export interface UserQuestionModel extends Model<UserQuestion> {
  paginate(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query?: any,
    options?: PaginateOptions
  ): Promise<PaginatedResolveResult<UserQuestion>>;
}

UserQuestionSchema.index({ mentor: -1, _id: -1 });
UserQuestionSchema.index({ question: -1, _id: -1 });
UserQuestionSchema.index({ confidence: -1, _id: -1 });
UserQuestionSchema.index({ feedback: -1, _id: -1 });
UserQuestionSchema.index({ classifierAnswer: -1, _id: -1 });
UserQuestionSchema.index({ graderAnswer: -1, _id: -1 });
pluginPagination(UserQuestionSchema);

export default mongoose.model<UserQuestion, UserQuestionModel>(
  'UserQuestion',
  UserQuestionSchema
);
