/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { AnswerMediaType } from '../types/answer';
import {
  Mentor as MentorModel,
  Subject as SubjectModel,
  Answer as AnswerModel,
  Question as QuestionModel,
} from '../../models';
import { AnswerMedia } from '../../models/Answer';
import { QuestionType } from '../../models/Question';
import { SubjectQuestion } from '../../models/Subject';
import { User } from '../../models/User';
import { isAnswerComplete } from '../../models/Mentor';
import { hasAccessToMentor } from '../../utils/mentor-check-private';
import { toAbsoluteUrl } from '../../utils/static-urls';

export interface MentorClientData {
  _id: string;
  name: string;
  email: string;
  title: string;
  mentorType: string;
  allowContact: boolean;
  topicQuestions: TopicQuestions[];
  utterances: AnswerClientData[];
  hasVirtualBackground: boolean;
  virtualBackgroundUrl: string;
}

export interface AnswerClientData {
  _id: string;
  name: string;
  transcript: string;
  webMedia: AnswerMedia;
  mobileMedia: AnswerMedia;
  vttMedia: AnswerMedia;
}

export interface TopicQuestions {
  topic: string;
  questions: string[];
}

export const MentorClientDataType = new GraphQLObjectType({
  name: 'MentorClientDataType',
  fields: () => ({
    _id: { type: GraphQLID },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    title: { type: GraphQLString },
    allowContact: { type: GraphQLBoolean },
    mentorType: { type: GraphQLString },
    topicQuestions: { type: GraphQLList(TopicQuestionsType) },
    utterances: { type: GraphQLList(AnswerClientDataType) },
    hasVirtualBackground: { type: GraphQLBoolean },
    virtualBackgroundUrl: { type: GraphQLString },
  }),
});

export const AnswerClientDataType = new GraphQLObjectType({
  name: 'AnswerClientDataType',
  fields: () => ({
    _id: { type: GraphQLID },
    name: { type: GraphQLString },
    transcript: { type: GraphQLString },
    webMedia: { type: AnswerMediaType },
    mobileMedia: { type: AnswerMediaType },
    vttMedia: { type: AnswerMediaType },
  }),
});

export const TopicQuestionsType = new GraphQLObjectType({
  name: 'TopicQuestionsType',
  fields: () => ({
    topic: { type: GraphQLID },
    questions: { type: GraphQLList(GraphQLString) },
  }),
});

export const mentorData = {
  type: MentorClientDataType,
  args: {
    mentor: { type: GraphQLNonNull(GraphQLID) },
    subject: { type: GraphQLID },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { mentor: string; subject?: string },
    context: { user: User }
  ): Promise<MentorClientData> => {
    const mentor = await MentorModel.findById(args.mentor);
    if (!mentor) {
      throw new Error(`mentor ${args.mentor} not found`);
    }
    if (!hasAccessToMentor(mentor, context.user)) {
      throw new Error(
        `mentor is private and you do not have permission to access`
      );
    }
    const subjectIds = args.subject
      ? [args.subject]
      : mentor.defaultSubject
      ? [mentor.defaultSubject]
      : mentor.subjects;
    const subjects = await SubjectModel.find({ _id: { $in: subjectIds } });
    const topics = await MentorModel.getTopics(
      { mentor, defaultSubject: false, subjectId: args.subject },
      subjects
    );
    const sQuestions: SubjectQuestion[] = [];
    for (const subject of subjects) {
      sQuestions.push(...subject.questions);
    }
    const questions = await QuestionModel.find({
      _id: { $in: sQuestions.map((sq) => sq.question) },
      type: QuestionType.QUESTION,
      $or: [
        { mentor: mentor._id },
        { mentor: { $exists: false } },
        { mentor: null },
      ],
    });
    let answers = await AnswerModel.find({
      mentor: mentor._id,
      question: { $in: questions.map((q) => q.id) },
    });
    answers = answers.filter((a) =>
      isAnswerComplete(
        a,
        questions.find((q) => `${q._id}` === `${a.question}`),
        mentor
      )
    );

    const qIds = answers.map((a) => `${a.question}`);
    const sQs = sQuestions.filter((sq) => qIds.includes(`${sq.question}`));
    const topicQuestions: Record<string, string[]> = {};
    for (const topic of topics) {
      topicQuestions[topic.id] = [];
    }
    for (const sQuestion of sQs) {
      for (const topic of sQuestion.topics) {
        if (!topicQuestions[topic].includes(`${sQuestion.question}`)) {
          topicQuestions[topic].push(`${sQuestion.question}`);
        }
      }
    }
    const utteranceQuestions = await QuestionModel.find({
      type: QuestionType.UTTERANCE,
    });
    let utterances = await AnswerModel.find({
      mentor: mentor._id,
      question: { $in: utteranceQuestions.map((q) => q.id) },
    });
    utterances = utterances.filter((a) =>
      isAnswerComplete(
        a,
        questions.find((q) => `${q._id}` === `${a.question}`),
        mentor
      )
    );

    return {
      _id: mentor._id,
      name: mentor.name,
      title: mentor.title,
      email: mentor.email,
      hasVirtualBackground: mentor.hasVirtualBackground,
      virtualBackgroundUrl: mentor.virtualBackgroundUrl
        ? toAbsoluteUrl(mentor.virtualBackgroundUrl)
        : '',
      mentorType: mentor.mentorType,
      allowContact: mentor.allowContact,
      topicQuestions: Object.keys(topicQuestions)
        .filter((key) => topicQuestions[key].length > 0)
        .map((key) => {
          const t = topics.find((t) => `${t.id}` === key);
          const tq = questions.filter((q) =>
            topicQuestions[key]?.includes(`${q.id}`)
          );
          return {
            topic: t.name,
            questions: tq.map((q) => q.question).sort(),
          };
        }),
      utterances: utterances.map((u) => ({
        _id: u.id,
        name: utteranceQuestions.find((q) => `${q.id}` === `${u.question}`)
          ?.name,
        transcript: u.transcript,
        webMedia: u.webMedia,
        mobileMedia: u.mobileMedia,
        vttMedia: u.vttMedia,
      })),
    };
  },
};

export default mentorData;
