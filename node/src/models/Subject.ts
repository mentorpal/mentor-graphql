/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { Question as QuestionModel, Subject } from './index';
import {
  PaginatedResolveResult,
  PaginateOptions,
  PaginateQuery,
  pluginPagination,
} from './Paginatation';
import { Question, QuestionType } from './Question';
import {
  questionInputToUpdate,
  SubjectQuestionUpdateInput,
  SubjectUpdateInput,
} from '../gql/mutation/me/subject-update';
import { UseDefaultTopics, idOrNew } from '../gql/mutation/me/helpers';

export interface CategoryProps {
  id: string;
  name: string;
  description: string;
  defaultTopics: string[];
}

export interface Category extends CategoryProps, Document<Types.ObjectId> {
  id: string;
}

const CategorySchema = new Schema({
  id: { type: String },
  name: { type: String },
  description: { type: String },
  defaultTopics: [{ type: String, default: '' }],
});

export interface TopicProps {
  id: string;
  name: string;
  description: string;
  categoryParent: string;
}

export interface Topic extends TopicProps, Document {
  id: string;
}

const TopicSchema = new Schema({
  id: { type: String },
  name: { type: String },
  description: { type: String },
  categoryParent: { type: String, default: '' },
});

export interface SubjectQuestionProps {
  question: Question['_id'];
  category: Category['id'];
  topics: Topic['id'][];
  useDefaultTopics?: UseDefaultTopics;
}

export interface SubjectQuestion extends SubjectQuestionProps, Document {}

export interface HydratedSubjectQuestion
  extends Omit<SubjectQuestionProps, 'question' | 'category' | 'topics'> {
  question: Question;
  category: Category;
  topics: Topic[];
}

export const SubjectQuestionSchema = new Schema({
  question: { type: mongoose.Types.ObjectId, ref: 'Question' },
  category: { type: String },
  topics: { type: [String] },
  useDefaultTopics: {
    type: String,
    enum: UseDefaultTopics,
    default: UseDefaultTopics.DEFAULT,
  },
});

export interface Subject extends Document<Types.ObjectId> {
  name: string;
  type: string;
  description: string;
  isRequired: boolean;
  isArchived: boolean;
  deleted: boolean;
  categories: Category[];
  topics: Topic[];
  questions: SubjectQuestion[];
}

export interface SubjectInsert {
  name: string;
  type: string;
  description: string;
  isRequired: boolean;
  isArchived: boolean;
  deleted: boolean;
  categories: CategoryProps[];
  topics: TopicProps[];
  questions: SubjectQuestionProps[];
}

export type SubjectUpdate = Partial<SubjectInsert>;

export const SubjectSchema = new Schema<Subject, SubjectModel>(
  {
    name: { type: String },
    type: { type: String, default: 'SUBJECT' },
    description: { type: String },
    isRequired: { type: Boolean },
    isArchived: { type: Boolean },
    deleted: { type: Boolean },
    categories: { type: [CategorySchema] },
    topics: { type: [TopicSchema] },
    questions: { type: [SubjectQuestionSchema] },
  },
  { timestamps: true, collation: { locale: 'en', strength: 2 } }
);

export interface SubjectModel extends Model<Subject> {
  paginate(
    query?: PaginateQuery<Subject>,
    options?: PaginateOptions
  ): Promise<PaginatedResolveResult<Subject>>;
  getQuestions(
    subject: string | Subject,
    topicId?: string,
    mentorId?: string,
    type?: QuestionType,
    categoryID?: string
  ): SubjectQuestion[];
  addOrUpdateQuestions(
    subject: string | Subject,
    questions: SubjectQuestionUpdateInput[]
  ): Promise<SubjectQuestionProps[]>;
  updateOrCreate(subject: SubjectUpdateInput): Promise<Subject>;
}

SubjectSchema.statics.getQuestions = async function (
  s: string | Subject,
  topicId?: string,
  mentorId?: string,
  type?: QuestionType,
  categoryID?: string
): Promise<HydratedSubjectQuestion[]> {
  const subject: Subject = typeof s === 'string' ? await this.findById(s) : s;
  if (!subject) {
    throw new Error(`subject ${s} not found`);
  }
  let sQuestions: SubjectQuestion[] = subject.questions;
  if (topicId) {
    sQuestions = sQuestions.filter((sq) => sq.topics.includes(topicId));
  }
  if (categoryID) {
    sQuestions = sQuestions.filter((sq) => sq.category == categoryID);
  }
  console.log(sQuestions);
  const questions = await QuestionModel.find({
    _id: { $in: sQuestions.map((q) => q.question) },
    ...(type ? { type } : {}),
  });
  console.log('starting filter');
  if (mentorId !== undefined) {
    sQuestions = sQuestions.filter((sq) =>
      questions.find(
        (q) =>
          `${q._id}` === `${sq.question}` &&
          (!q.mentor || `${q.mentor}` === `${mentorId}`)
      )
    );
  }
  console.log('ending filter');
  return sQuestions.map((sq) => ({
    question: questions.find((q) => `${q._id}` === `${sq.question}`),
    category: subject.categories.find((c) => c.id === sq.category),
    topics: subject.topics.filter((t) => sq.topics.includes(t.id)),
    useDefaultTopics: sq.useDefaultTopics,
  }));
};

SubjectSchema.statics.updateOrCreate = async function (
  subject: SubjectUpdateInput
) {
  // don't include questions that have no question text
  const questions = subject.questions.filter((q) => q.question.question);
  const subjectTopics = subject.topics.map((t) => t.id);
  const subjectUpdate: SubjectUpdate = {
    ...subject,
    questions: await Promise.all(
      questions.map((qi) => questionInputToUpdate(qi, subjectTopics))
    ),
  };
  return await this.findOneAndUpdate(
    { _id: idOrNew(subject._id) },
    {
      $set: subjectUpdate,
    },
    {
      new: true,
      upsert: true,
    }
  );
};

SubjectSchema.statics.addOrUpdateQuestions = async function (
  s: string | Subject,
  qs: SubjectQuestionUpdateInput[]
) {
  const subject: Subject = typeof s === 'string' ? await this.findById(s) : s;
  if (!subject) {
    throw new Error(`subject ${s} not found`);
  }
  // don't include questions that have no question text
  qs = qs.filter((q) => q.question.question);
  if (qs.length === 0) {
    return subject;
  }
  const questions: SubjectQuestionProps[] = subject.questions;
  const topics = subject.topics.map((t) => t.id);
  const questionUpdates = await Promise.all(
    qs.map((qi) => questionInputToUpdate(qi, topics))
  );
  for (const qu of questionUpdates) {
    const idx = questions.findIndex(
      (q) => `${q.question}` === `${qu.question}`
    );
    if (idx === -1) {
      questions.push(qu);
    } else {
      questions[idx] = qu;
    }
  }
  await this.findOneAndUpdate(
    { _id: subject._id },
    {
      $set: { questions },
    },
    {
      new: true,
      upsert: true,
    }
  );
  return questionUpdates;
};

SubjectSchema.pre(/find.*/, function (next) {
  this.$where = {
    ...this.$where,
    deleted: { $ne: true },
  };
  next();
});

SubjectSchema.index({ name: -1, _id: -1 });
SubjectSchema.index({ isRequired: -1, _id: -1 });
pluginPagination(SubjectSchema);

export default mongoose.model<Subject, SubjectModel>('Subject', SubjectSchema);
