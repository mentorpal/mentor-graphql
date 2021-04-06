/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Schema, Document, Model } from 'mongoose';
import { Question as QuestionModel } from 'models';
import { PaginatedResolveResult } from './PaginatedResolveResult';
import { Question } from './Question';

const mongoPaging = require('mongo-cursor-pagination');
mongoPaging.config.COLLATION = { locale: 'en', strength: 2 };

export interface Category extends Document {
  id: string;
  name: string;
  description: string;
}

const CategorySchema = new Schema({
  id: { type: String },
  name: { type: String },
  description: { type: String },
});

export interface Topic extends Document {
  id: string;
  name: string;
  description: string;
}

const TopicSchema = new Schema({
  id: { type: String },
  name: { type: String },
  description: { type: String },
});

export interface SubjectQuestion extends Document {
  question: Question['_id'];
  category: Category['id'];
  topics: Topic['id'][];
}

export const SubjectQuestionSchema = new Schema({
  question: { type: mongoose.Types.ObjectId, ref: 'Question' },
  category: { type: String },
  topics: { type: [String] },
});

export interface Subject extends Document {
  name: string;
  description: string;
  isRequired: boolean;
  categories: Category[];
  topics: Topic[];
  questions: SubjectQuestion[];
}

export const SubjectSchema = new Schema({
  name: { type: String },
  description: { type: String },
  isRequired: { type: Boolean },
  categories: { type: [CategorySchema] },
  topics: { type: [TopicSchema] },
  questions: { type: [SubjectQuestionSchema] },
});

export interface SubjectModel extends Model<Subject> {
  paginate(
    query?: any,
    options?: any,
    callback?: any
  ): Promise<PaginatedResolveResult<Subject>>;
  getQuestions(
    subject: string | Subject,
    topicId?: string,
    mentorId?: string
  ): SubjectQuestion[];
}

SubjectSchema.statics.getQuestions = async function (
  s: string | Subject,
  topicId?: string,
  mentorId?: string
) {
  const subject: Subject = typeof s === 'string' ? await this.findById(s) : s;
  if (!subject) {
    throw new Error(`subject ${s} not found`);
  }
  let sQuestions: SubjectQuestion[] = subject.questions;
  const questions = await QuestionModel.find({
    _id: { $in: sQuestions.map((q) => q.question) },
  });
  if (topicId) {
    sQuestions = sQuestions.filter((sq) => sq.topics.includes(topicId));
  }
  if (mentorId !== undefined) {
    sQuestions = sQuestions.filter((sq) =>
      questions.find(
        (q) =>
          `${q._id}` === `${sq.question}` &&
          (!q.mentor || `${q.mentor}` === `${mentorId}`)
      )
    );
  }
  return sQuestions.map((sq) => ({
    question: questions.find((q) => `${q._id}` === `${sq.question}`),
    category: subject.categories.find((c) => c.id === sq.category),
    topics: subject.topics.filter((t) => sq.topics.includes(t.id)),
  }));
};

SubjectSchema.index({ name: -1, _id: -1 });
SubjectSchema.index({ isRequired: -1, _id: -1 });
SubjectSchema.plugin(mongoPaging.mongoosePlugin);

export default mongoose.model<Subject, SubjectModel>('Subject', SubjectSchema);
