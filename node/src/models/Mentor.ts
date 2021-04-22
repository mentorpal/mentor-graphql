/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Schema, Document, Model } from 'mongoose';
import { Answer as AnswerModel, Subject as SubjectModel } from 'models';
import { PaginatedResolveResult } from './PaginatedResolveResult';
import { Answer, Status } from './Answer';
import { Question, QuestionType } from './Question';
import { Subject } from './Subject';
import { User } from './User';
import { Topic } from './Topic';

const mongoPaging = require('mongo-cursor-pagination');
mongoPaging.config.COLLATION = { locale: 'en', strength: 2 };

export enum MentorType {
  VIDEO = 'VIDEO',
  CHAT = 'CHAT',
}

export interface Mentor extends Document {
  name: string;
  firstName: string;
  title: string;
  defaultSubject: Subject['_id'];
  subjects: Subject['_id'][];
  lastTrainedAt: Date;
  mentorType: string;
  user: User['_id'];
}

export const MentorSchema = new Schema(
  {
    name: { type: String },
    firstName: { type: String },
    title: { type: String },
    defaultSubject: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
    },
    subjects: { type: [{ type: Schema.Types.ObjectId, ref: 'Subject' }] },
    lastTrainedAt: { type: Date },
    mentorType: {
      type: String,
      enum: [MentorType.VIDEO, MentorType.CHAT],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: '{PATH} is required!',
      unique: true,
    },
  },
  { timestamps: true, collation: { locale: 'en', strength: 2 } }
);

export interface MentorModel extends Model<Mentor> {
  paginate(
    query?: any,
    options?: any,
    callback?: any
  ): Promise<PaginatedResolveResult<Mentor>>;

  getSubjects(mentor: string | Mentor): Subject[];
  getTopics(mentor: string | Mentor, subjectId?: string): Topic[];
  getQuestions(
    mentor: string | Mentor,
    subjectId?: string,
    topicId?: string,
    type?: QuestionType
  ): Question[];
  getAnswers(
    mentor: string | Mentor,
    subjectId?: string,
    topicId?: string,
    status?: Status,
    type?: QuestionType
  ): Answer[];
}

MentorSchema.statics.getSubjects = async function (
  m: string | Mentor
): Promise<Subject[]> {
  const mentor: Mentor =
    typeof m === 'string' ? await this.findOne({ _id: m }) : m;
  return await SubjectModel.find({ _id: { $in: mentor.subjects } }, null, {
    sort: { name: 1 },
  });
};

MentorSchema.statics.getTopics = async function (
  m: string | Mentor,
  subjectId?: string
): Promise<Topic[]> {
  const mentor: Mentor =
    typeof m === 'string' ? await this.findOne({ _id: m }) : m;
  const topics: Topic[] = [];
  if (subjectId) {
    if (mentor.subjects.includes(subjectId)) {
      topics.push(...(await SubjectModel.getTopics(subjectId)));
    }
  } else {
    const subjects: Subject[] = await SubjectModel.find({
      _id: { $in: mentor.subjects },
    });
    for (const s of subjects) {
      topics.push(...(await SubjectModel.getTopics(s)));
    }
    topics.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }
  const topicsIds = [...new Set(topics.map((t) => `${t._id}`))];
  return topicsIds.map((tId) => topics.find((t) => `${t._id}` === tId));
};

MentorSchema.statics.getQuestions = async function (
  m: string | Mentor,
  subjectId?: string,
  topicId?: string,
  type?: QuestionType
): Promise<Question[]> {
  const mentor: Mentor =
    typeof m === 'string' ? await this.findOne({ _id: m }) : m;
  let questions: Question[] = [];
  if (subjectId) {
    if (mentor.subjects.includes(subjectId)) {
      questions.push(...(await SubjectModel.getQuestions(subjectId, topicId)));
    }
  } else {
    const subjects: Subject[] = await SubjectModel.find(
      {
        _id: { $in: mentor.subjects },
      },
      null,
      { sort: { name: 1 } }
    );
    for (const s of subjects) {
      questions.push(...(await SubjectModel.getQuestions(s, topicId)));
    }
  }
  if (type) {
    questions = questions.filter((q: Question) => q.type === type);
  }
  return questions;
};

MentorSchema.statics.getAnswers = async function (
  m: string | Mentor,
  subjectId?: string,
  topicId?: string,
  status?: Status,
  type?: QuestionType
): Promise<Answer[]> {
  const mentor: Mentor =
    typeof m === 'string' ? await this.findOne({ _id: m }) : m;
  const questions = await this.getQuestions(mentor, subjectId, topicId, type);
  const questionIds = questions.map((q: Question) => q._id);
  const answers: Answer[] = await AnswerModel.find({
    mentor: mentor._id,
    question: { $in: questionIds },
  });
  answers.sort((a: Answer, b: Answer) => {
    return (
      questionIds.indexOf(a.question._id) - questionIds.indexOf(b.question._id)
    );
  });
  const answersByQid = answers.reduce((acc: Record<string, Answer>, cur) => {
    acc[`${cur.question}`] = cur;
    return acc;
  }, {});
  let answerResult: Answer[] = questionIds.map((qid: string) => {
    return (
      answersByQid[`${qid}`] || {
        mentor: mentor._id,
        question: qid,
        transcript: '',
        status: Status.INCOMPLETE,
      }
    );
  });
  if (status) {
    answerResult = answerResult.filter((a: Answer) => a.status === status);
  }
  return answerResult;
};

MentorSchema.index({ name: -1, _id: -1 });
MentorSchema.index({ firstName: -1, _id: -1 });
MentorSchema.index({ mentorType: -1, _id: -1 });
MentorSchema.plugin(mongoPaging.mongoosePlugin);

export default mongoose.model<Mentor, MentorModel>('Mentor', MentorSchema);
