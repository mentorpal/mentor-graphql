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

export interface Subject extends Document {
  name: string;
  description: string;
  questions: [Question];
}

export const SubjectSchema = new Schema({
  name: { type: String },
  description: { type: String },
  questions: { type: [QuestionSchema] },
});

export interface SubjectModel extends Model<Subject> {
  paginate(
    query?: any,
    options?: any,
    callback?: any
  ): Promise<PaginatedResolveResult<Subject>>;
}

SubjectSchema.index({ name: -1, _id: -1 });
SubjectSchema.plugin(mongoPaging.mongoosePlugin);

export default mongoose.model<Subject, SubjectModel>('Subject', SubjectSchema);
