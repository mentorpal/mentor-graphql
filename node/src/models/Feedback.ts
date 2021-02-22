/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Document, Model, Schema } from 'mongoose';
import { PaginatedResolveResult } from './PaginatedResolveResult';
import { Mentor } from './Mentor';
import { Answer } from './Answer';

const mongoPaging = require('mongo-cursor-pagination');
mongoPaging.config.COLLATION = { locale: 'en', strength: 2 };

enum Grade {
  GOOD = 'GOOD',
  BAD = 'BAD',
  NEUTRAL = 'NEUTRAL',
}

export interface Feedback extends Document {
  mentor: Mentor['_id'];
  question: string;
  classifierAnswer: Answer['_id'];
  graderAnswer: Answer['_id'];
  confidence: number;
  grade: string;
}

export const FeedbackSchema = new Schema({
  mentor: { type: mongoose.Types.ObjectId, ref: 'Mentor' },
  question: { type: String },
  classifierAnswer: { type: mongoose.Types.ObjectId, ref: 'Answer' },
  graderAnswer: { type: mongoose.Types.ObjectId, ref: 'Answer' },
  confidence: { type: mongoose.Types.Decimal128 },
  grade: {
    type: String,
    enum: [Grade.GOOD, Grade.BAD, Grade.NEUTRAL],
    default: Grade.NEUTRAL,
  },
});

export interface FeedbackModel extends Model<Feedback> {
  paginate(
    query?: any,
    options?: any,
    callback?: any
  ): Promise<PaginatedResolveResult<Feedback>>;
}

FeedbackSchema.index({ mentor: -1, _id: -1 });
FeedbackSchema.index({ question: -1, _id: -1 });
FeedbackSchema.index({ classifierAnswer: -1, _id: -1 });
FeedbackSchema.index({ confidence: -1, _id: -1 });
FeedbackSchema.index({ grade: -1, _id: -1 });
FeedbackSchema.plugin(mongoPaging.mongoosePlugin);

export default mongoose.model<Feedback, FeedbackModel>(
  'Feedback',
  FeedbackSchema
);
