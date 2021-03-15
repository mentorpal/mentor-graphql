/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Schema, Document, Model } from 'mongoose';
import { Question as QuestionModel, Topic as TopicModel } from 'models';
import { PaginatedResolveResult } from './PaginatedResolveResult';
import { Question } from './Question';
import { Topic } from './Topic';

const mongoPaging = require('mongo-cursor-pagination');
mongoPaging.config.COLLATION = { locale: 'en', strength: 2 };

export interface Subject extends Document {
  name: string;
  description: string;
  questions: Question['_id'][];
  topicsOrder: Topic['_id'][];
  isRequired: boolean;
}

export const SubjectSchema = new Schema({
  name: { type: String },
  description: { type: String },
  questions: [{ type: mongoose.Types.ObjectId, ref: 'Question' }],
  topicsOrder: [{ type: mongoose.Types.ObjectId, ref: 'Topic' }],
  isRequired: { type: Boolean },
});

export interface SubjectModel extends Model<Subject> {
  paginate(
    query?: any,
    options?: any,
    callback?: any
  ): Promise<PaginatedResolveResult<Subject>>;

  getTopics(subject: string | Subject): Topic[];
  getQuestions(subject: string | Subject, topicId?: string): Question[];
}

SubjectSchema.statics.getTopics = async function (s: string | Subject) {
  const subject: Subject =
    typeof s === 'string' ? await this.findOne({ _id: s }) : s;
  const questions = await QuestionModel.find({
    _id: { $in: subject.questions },
  });
  const topicIds: string[] = [];
  questions.forEach((q) => {
    topicIds.push(...q.topics);
  });
  const topics = await TopicModel.find({
    _id: { $in: [...new Set(topicIds)] },
  });
  topics.sort((a: Topic, b: Topic) => {
    const aOrder = subject.topicsOrder.indexOf(a._id);
    const bOrder = subject.topicsOrder.indexOf(b._id);
    if (aOrder === -1 && bOrder === -1) {
      return a.name.localeCompare(b.name);
    } else if (aOrder === -1) {
      return 1;
    } else if (bOrder === -1) {
      return -1;
    } else {
      return aOrder < bOrder ? -1 : 1;
    }
  });
  return topics;
};

SubjectSchema.statics.getQuestions = async function (
  s: string | Subject,
  topicId?: string
) {
  const subject = typeof s === 'string' ? await this.findOne({ _id: s }) : s;
  if (topicId) {
    return await QuestionModel.find(
      {
        $and: [
          { _id: { $in: subject.questions } },
          { topics: { $all: [topicId] } },
        ],
      },
      null,
      { sort: { question: -1 } }
    );
  }
  return await QuestionModel.find(
    {
      _id: { $in: subject.questions },
    },
    null,
    { sort: { question: -1 } }
  );
};

SubjectSchema.index({ name: -1, _id: -1 });
SubjectSchema.index({ isRequired: -1, _id: -1 });
SubjectSchema.plugin(mongoPaging.mongoosePlugin);

export default mongoose.model<Subject, SubjectModel>('Subject', SubjectSchema);
