/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  Answer as AnswerModel,
  Question as QuestionModel,
  Subject as SubjectModel,
} from 'models';
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

export const MentorSchema = new Schema(
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

// Return subjects in alphabetical order
MentorSchema.statics.getSubjects = async function (
  m: string | Mentor
): Promise<Subject[]> {
  const mentor: Mentor =
    typeof m === 'string' ? await this.findOne({ _id: m }) : m;
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
  const mentor: Mentor =
    typeof m === 'string' ? await this.findOne({ _id: m }) : m;
  const topics: Topic[] = [];
  if (subjectId) {
    if (mentor.subjects.includes(subjectId)) {
      const subject = await SubjectModel.findOne({ _id: subjectId });
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
  const mentor: Mentor =
    typeof m === 'string' ? await this.findOne({ _id: m }) : m;
  let sQuestions: SubjectQuestion[] = [];
  if (subjectId) {
    if (mentor.subjects.includes(subjectId)) {
      const subject = await SubjectModel.findOne({ _id: subjectId });
      sQuestions.push(...subject.questions);
    }
  } else {
    const subjects: Subject[] = await this.getSubjects(mentor);
    for (const subject of subjects) {
      sQuestions.push(...subject.questions);
    }
  }
  if (topicId) {
    sQuestions = sQuestions.filter((sq) => sq.topics.includes(topicId));
  }
  const questions = await QuestionModel.find({
    _id: { $in: sQuestions.map((q) => q.question) },
  });
  if (type) {
    sQuestions = sQuestions.filter((sq) =>
      questions.find((q) => `${q._id}` === `${sq.question}` && q.type === type)
    );
  }
  sQuestions = sQuestions.filter((sq) =>
    questions.find(
      (q) =>
        `${q._id}` === `${sq.question}` &&
        (!q.mentor || `${q.mentor}` === `${mentor._id}`)
    )
  );
  return sQuestions;
};

MentorSchema.statics.getAnswers = async function (
  m: string | Mentor,
  subjectId?: string,
  topicId?: string,
  status?: Status,
  type?: QuestionType
) {
  const mentor: Mentor =
    typeof m === 'string' ? await this.findOne({ _id: m }) : m;
  const sQuestions: SubjectQuestion[] = await this.getQuestions(
    mentor,
    subjectId,
    topicId,
    type
  );
  const questionIds = sQuestions.map((sq) => sq.question);
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
