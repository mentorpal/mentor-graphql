/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Schema, Document, Model } from 'mongoose';
import { Answer as AnswerModel, Subject as SubjectModel } from 'models';
import { PaginatedResolveResult } from './PaginatedResolveResult';
import { Answer, Status } from './Answer';
import { QuestionType } from './Question';
import { Subject, SubjectQuestion, Topic } from './Subject';
import { User } from './User';

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
  ): SubjectQuestion[];
  getAnswers(
    mentor: string | Mentor,
    subjectId?: string,
    topicId?: string,
    status?: Status,
    type?: QuestionType
  ): Answer[];
}

export const MentorSchema = new Schema<Mentor, MentorModel>(
  {
    name: { type: String },
    firstName: { type: String },
    title: { type: String },
    defaultSubject: { type: Schema.Types.ObjectId, ref: 'Subject' },
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

// Return subjects in alphabetical order
MentorSchema.statics.getSubjects = async function (
  m: string | Mentor
): Promise<Subject[]> {
  const mentor: Mentor = typeof m === 'string' ? await this.findById(m) : m;
  if (!mentor) {
    throw new Error(`mentor ${m} not found`);
  }
  return await SubjectModel.find(
    {
      _id: { $in: mentor.subjects },
    },
    null,
    { sort: { name: 1 } }
  );
};

// Return topics for all subjects or for one subject
//  - one subject: sorted in subject order
//  - all subjects: sorted alphabetically
MentorSchema.statics.getTopics = async function (
  m: string | Mentor,
  subjectId?: string
): Promise<Topic[]> {
  const mentor: Mentor = typeof m === 'string' ? await this.findById(m) : m;
  if (!mentor) {
    throw new Error(`mentor ${m} not found`);
  }
  const topics: Topic[] = [];
  if (subjectId) {
    if (mentor.subjects.includes(subjectId)) {
      const subject = await SubjectModel.findById(subjectId);
      topics.push(...subject.topics);
    }
  } else {
    const subjects: Subject[] = await this.getSubjects(mentor);
    for (const s of subjects) {
      topics.push(...s.topics);
    }
    topics.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }
  const topicsIds = [...new Set(topics.map((t) => `${t.id}`))];
  return topicsIds.map((tId) => topics.find((t) => `${t.id}` === tId));
};

MentorSchema.statics.getQuestions = async function (
  m: string | Mentor,
  subjectId?: string,
  topicId?: string,
  type?: QuestionType
): Promise<SubjectQuestion[]> {
  const mentor: Mentor = typeof m === 'string' ? await this.findById(m) : m;
  if (!mentor) {
    throw new Error(`mentor ${m} not found`);
  }
  let sQuestions = [];
  if (subjectId) {
    if (mentor.subjects.includes(subjectId)) {
      sQuestions.push(
        ...(await SubjectModel.getQuestions(subjectId, topicId, mentor._id))
      );
    }
  } else {
    const subjects: Subject[] = await this.getSubjects(mentor);
    for (const subject of subjects) {
      sQuestions.push(
        ...(await SubjectModel.getQuestions(subject, topicId, mentor._id))
      );
    }
  }
  if (type) {
    sQuestions = sQuestions.filter((sq) => sq.question.type === type);
  }
  return sQuestions;
};

MentorSchema.statics.getAnswers = async function (
  m: string | Mentor,
  subjectId?: string,
  topicId?: string,
  status?: Status,
  type?: QuestionType
) {
  const mentor: Mentor = typeof m === 'string' ? await this.findById(m) : m;
  if (!mentor) {
    throw new Error(`mentor ${m} not found`);
  }
  const sQuestions = await this.getQuestions(mentor, subjectId, topicId, type);
  const questionIds = sQuestions.map(
    (sq: { question: { _id: string } }) => sq.question._id
  );
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
  let answerResult = questionIds.map((qid: string) => {
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
