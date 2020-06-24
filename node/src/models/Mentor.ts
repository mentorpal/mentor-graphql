/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Schema, Document, Model } from 'mongoose';
import { PaginatedResolveResult } from './PaginatedResolveResult';
import { Question, QuestionSchema } from './Question';

const mongoPaging = require('mongo-cursor-pagination');
mongoPaging.config.COLLATION = { locale: 'en', strength: 2 };

export interface Mentor extends Document {
  id: string;
  videoId: string;
  name: string;
  shortName: string;
  title: string;
  topics: [string];
  questions: [Question];
  utterances: [Question];
}

export const MentorSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    videoId: { type: String, required: true, unique: true },
    name: { type: String },
    shortName: { type: String },
    title: { type: String },
    topics: { type: [String] },
    questions: { type: [QuestionSchema] },
    utterances: { type: [QuestionSchema] },
  },
  { timestamps: true, collation: { locale: 'en', strength: 2 } }
);

export interface MentorModel extends Model<Mentor> {
  paginate(
    query?: any,
    options?: any,
    callback?: any
  ): Promise<PaginatedResolveResult<Mentor>>;
}

MentorSchema.index({ name: -1, _id: -1 });
MentorSchema.plugin(mongoPaging.mongoosePlugin);

export default mongoose.model<Mentor, MentorModel>('Mentor', MentorSchema);
