/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { AnswerMediaType } from 'gql/types/answer';
import {
  Mentor as MentorModel,
  Subject as SubjectModel,
  Answer as AnswerModel,
  Question as QuestionModel,
} from 'models';
import { AnswerMedia, Status } from 'models/Answer';
import { QuestionType } from 'models/Question';
import { SubjectQuestion, Topic } from 'models/Subject';

export interface MentorClientData {
  _id: string;
  name: string;
  email: string;
  title: string;
  mentorType: string;
  topicQuestions: TopicQuestions[];
  utterances: AnswerClientData[];
}

export interface AnswerClientData {
  _id: string;
  name: string;
  transcript: string;
  media: AnswerMedia[];
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
    mentorType: { type: GraphQLString },
    topicQuestions: { type: GraphQLList(TopicQuestionsType) },
    utterances: { type: GraphQLList(AnswerClientDataType) },
  }),
});

export const AnswerClientDataType = new GraphQLObjectType({
  name: 'AnswerClientDataType',
  fields: () => ({
    _id: { type: GraphQLID },
    name: { type: GraphQLString },
    transcript: { type: GraphQLString },
    media: { type: GraphQLList(AnswerMediaType) },
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
    args: { mentor: string; subject?: string }
  ): Promise<MentorClientData> => {
    const mentor = await MentorModel.findById(args.mentor);
    if (!mentor) {
      throw new Error(`mentor ${args.mentor} not found`);
    }
    const subjectIds = args.subject
      ? [args.subject]
      : mentor.defaultSubject
      ? [mentor.defaultSubject]
      : mentor.subjects;
    const subjects = await SubjectModel.find({ _id: { $in: subjectIds } });
    const topics: Topic[] = [];
    const sQuestions: SubjectQuestion[] = [];
    for (const subject of subjects) {
      topics.push(...subject.topics);
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
    const answers = await AnswerModel.find({
      mentor: mentor._id,
      status: Status.COMPLETE,
      question: { $in: questions.map((q) => q.id) },
    });

    const qIds = answers.map((a) => `${a.question}`);
    const sQs = sQuestions.filter((sq) => qIds.includes(`${sq.question}`));
    const topicQuestions: Record<string, string[]> = {};
    for (const sQuestion of sQs) {
      for (const topic of sQuestion.topics) {
        if (!topicQuestions[topic]) {
          topicQuestions[topic] = [];
        }
        if (!topicQuestions[topic].includes(`${sQuestion.question}`)) {
          topicQuestions[topic].push(`${sQuestion.question}`);
        }
      }
    }
    const utteranceQuestions = await QuestionModel.find({
      type: QuestionType.UTTERANCE,
    });
    const utterances = await AnswerModel.find({
      mentor: mentor._id,
      status: Status.COMPLETE,
      question: { $in: utteranceQuestions.map((q) => q.id) },
    });

    return {
      _id: mentor._id,
      name: mentor.name,
      title: mentor.title,
      email: mentor.email,
      mentorType: mentor.mentorType,
      topicQuestions: Object.keys(topicQuestions).map((key) => {
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
        media: u.media,
      })),
    };
  },
};

export default mentorData;
