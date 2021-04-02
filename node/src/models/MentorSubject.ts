/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  Subject as SubjectModel,
  Topic as TopicModel,
  Question as QuestionModel,
  MentorSubject,
} from 'models';
import { PaginatedResolveResult } from './PaginatedResolveResult';
import { Mentor } from './Mentor';
import { Question } from './Question';
import { Subject } from './Subject';
import { Topic } from './Topic';

const mongoPaging = require('mongo-cursor-pagination');
mongoPaging.config.COLLATION = { locale: 'en', strength: 2 };

export interface MentorSubject extends Document {
  mentor: Mentor['_id'];
  subject: Subject['_id'];
  questions: Question['_id'][];
}

export const MentorSubjectSchema = new Schema({
  mentor: {
    type: Schema.Types.ObjectId,
    ref: 'Mentor',
    required: '{PATH} is required!',
  },
  subject: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: '{PATH} is required!',
  },
  questions: [{ type: mongoose.Types.ObjectId, ref: 'Question' }],
});

export interface MentorSubjectModel extends Model<MentorSubject> {
  paginate(
    query?: any,
    options?: any,
    callback?: any
  ): Promise<PaginatedResolveResult<MentorSubject>>;
  getTopics(mentorSubject: string | MentorSubject): Topic[];
  getQuestions(
    mentorSubject: string | MentorSubject,
    topicId?: string
  ): Question[];
}

MentorSubjectSchema.statics.getTopics = async function (
  ms: string | MentorSubject
) {
  const mentorSubject: MentorSubject =
    typeof ms === 'string' ? await MentorSubject.findById(ms) : ms;
  const subject: Subject = await SubjectModel.findById(mentorSubject.subject);
  const questions: Question[] = await this.getQuestions(mentorSubject);
  const topicIds: string[] = questions.reduce(
    (acc: string[], val: Question) => [...acc, ...val.topics],
    []
  );
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

MentorSubjectSchema.statics.getQuestions = async function (
  ms: string | MentorSubject,
  topicId?: string
) {
  const mentorSubject: MentorSubject =
    typeof ms === 'string' ? await MentorSubject.findById(ms) : ms;
  const subject: Subject = await SubjectModel.findById(mentorSubject.subject);
  let questions: Question[] = [];
  if (topicId) {
    questions = await QuestionModel.find({
      $and: [{ _id: { $in: mentorSubject.questions } }, { topics: topicId }],
    });
  } else {
    questions = await QuestionModel.find({
      _id: { $in: mentorSubject.questions },
    });
  }
  questions.push(...(await SubjectModel.getQuestions(subject, topicId)));
  return questions;
};

MentorSubjectSchema.index({ mentor: -1, subject: -1 }, { unique: true });
MentorSubjectSchema.plugin(mongoPaging.mongoosePlugin);

export default mongoose.model<MentorSubject, MentorSubjectModel>(
  'MentorSubject',
  MentorSubjectSchema
);
