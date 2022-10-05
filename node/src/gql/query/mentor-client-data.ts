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
import { Answer, AnswerMedia } from '../../models/Answer';
import { Question, QuestionType } from '../../models/Question';
import { Subject, SubjectQuestion, Topic } from '../../models/Subject';
import { User } from '../../models/User';
import { isAnswerComplete, Mentor } from '../../models/Mentor';
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

export interface AllMentorTopicsHold {
  mentor: string;
  topics: Topic[];
}

function extractMentorInfoFromBatch(
  mentor: Mentor,
  subjectArg: string,
  allAnswers: Answer[],
  allSubjects: Subject[],
  allTopics: AllMentorTopicsHold[],
  allQuestions: Question[],
  allUtterances: Answer[],
  allUtteranceQuestions: Question[]
) {
  const answersForThisMentor = allAnswers.filter(
    (answer) => `${answer.mentor}` == `${mentor._id}`
  );
  const utterancesThisMentor = allUtterances.filter(
    (utterance) => `${utterance.mentor}` == `${mentor._id}`
  );
  const subjectIdsForThisMentor: string[] = subjectArg
    ? [subjectArg]
    : mentor.defaultSubject
    ? [mentor.defaultSubject]
    : mentor.subjects;
  const subjectsForThisMentor = allSubjects.filter((subject) =>
    subjectIdsForThisMentor.find(
      (subjectIdForMentor) => `${subjectIdForMentor}` == `${subject._id}`
    )
  );
  const subjectQuestionDocsThisMentor = subjectsForThisMentor.reduce(
    (subjectIds: SubjectQuestion[], acc) => {
      subjectIds.push(...acc.questions);
      return subjectIds;
    },
    []
  );
  const subjectQuestionIdsThisMentor: string[] =
    subjectQuestionDocsThisMentor.map((subjectQDoc) => subjectQDoc._id);
  const questionDocsThisMentor: Question[] = allQuestions.filter((question) =>
    subjectQuestionIdsThisMentor.find(
      (subjectQId) => `${subjectQId}` == `${question._id}`
    )
  );
  const topics = allTopics.find(
    (topicHold) => `${topicHold.mentor}` == `${mentor._id}`
  ).topics;
  const qIds = answersForThisMentor.map((a) => `${a.question}`);
  const sQs = subjectQuestionDocsThisMentor.filter((sq) =>
    qIds.includes(`${sq.question}`)
  );
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
        const tq = questionDocsThisMentor.filter((q) =>
          topicQuestions[key]?.includes(`${q.id}`)
        );
        return {
          topic: t.name,
          questions: tq.map((q) => q.question).sort(),
        };
      }),
    utterances: utterancesThisMentor.map((u) => ({
      _id: u.id,
      name: allUtteranceQuestions.find((q) => `${q.id}` === `${u.question}`)
        ?.name,
      transcript: u.transcript,
      webMedia: u.webMedia,
      mobileMedia: u.mobileMedia,
      vttMedia: u.vttMedia,
    })),
  };
}

export const mentorData = {
  type: GraphQLList(MentorClientDataType),
  args: {
    mentors: { type: GraphQLNonNull(GraphQLList(GraphQLID)) },
    subject: { type: GraphQLID },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { mentors: string[]; subject?: string },
    context: { user: User }
  ): Promise<MentorClientData[]> => {
    const mentors = await MentorModel.find({ _id: { $in: args.mentors } });
    if (mentors.length !== args.mentors.length) {
      throw new Error('mentor not found');
    }
    mentors.forEach((mentor) => {
      if (!hasAccessToMentor(mentor, context.user)) {
        throw new Error(
          `mentor is private and you do not have permission to access`
        );
      }
    });

    const idsForAllMentors: string[] = mentors.map((mentor) => mentor._id);
    const subjectIdsForAllMentors = args.subject
      ? [args.subject]
      : mentors.reduce((subjectAcc: string[], mentor) => {
          if (mentor.defaultSubject) {
            subjectAcc.push(mentor.defaultSubject);
          } else {
            subjectAcc.push(...mentor.subjects);
          }
          return subjectAcc;
        }, []);

    const subjectsForAllMentors = await SubjectModel.find({
      _id: { $in: subjectIdsForAllMentors },
    });

    const topicsForAllMentors: AllMentorTopicsHold[] = await Promise.all(
      mentors.map(async (mentor) => {
        const subjectIdsForThisMentor: string[] = args.subject
          ? [args.subject]
          : mentor.defaultSubject
          ? [mentor.defaultSubject]
          : mentor.subjects;
        const subjectsForThisMentor = subjectsForAllMentors.filter((subject) =>
          subjectIdsForThisMentor.find(
            (subjectIdForMentor) => `${subjectIdForMentor}` == `${subject._id}`
          )
        );
        const mentorTopics = await MentorModel.getTopics(
          { mentor, defaultSubject: true, subjectId: args.subject },
          subjectsForThisMentor
        );
        return { mentor: mentor._id, topics: mentorTopics };
      })
    );

    const subjectQuestionsForAllMentors = subjectsForAllMentors.reduce(
      (subjectQAcc: SubjectQuestion[], subject) => {
        subjectQAcc.push(...subject.questions);
        return subjectQAcc;
      },
      []
    );

    const questionDocsForAllMentors = await QuestionModel.find({
      _id: { $in: subjectQuestionsForAllMentors.map((sq) => sq.question) },
      type: QuestionType.QUESTION,
      $or: [
        { mentor: { $in: idsForAllMentors } },
        { mentor: { $exists: false } },
        { mentor: null },
      ],
    });

    let answersForAllMentors = await AnswerModel.find({
      mentor: { $in: idsForAllMentors },
      question: { $in: questionDocsForAllMentors.map((q) => q.id) },
    });
    answersForAllMentors = answersForAllMentors.filter((a) =>
      isAnswerComplete(
        a,
        questionDocsForAllMentors.find((q) => `${q._id}` === `${a.question}`),
        mentors.find((mentor) => mentor._id == a.mentor)
      )
    );

    const allUtteranceQuestions = await QuestionModel.find({
      type: QuestionType.UTTERANCE,
    });
    let utterancesForAllMentors = await AnswerModel.find({
      mentor: { $in: idsForAllMentors },
      question: { $in: allUtteranceQuestions.map((q) => q.id) },
    });
    utterancesForAllMentors = utterancesForAllMentors.filter((a) =>
      isAnswerComplete(
        a,
        questionDocsForAllMentors.find((q) => `${q._id}` === `${a.question}`),
        mentors.find((mentor) => mentor._id == a.mentor)
      )
    );

    const results: MentorClientData[] = mentors.map((mentor) =>
      extractMentorInfoFromBatch(
        mentor,
        args.subject || '',
        answersForAllMentors,
        subjectsForAllMentors,
        topicsForAllMentors,
        questionDocsForAllMentors,
        utterancesForAllMentors,
        allUtteranceQuestions
      )
    );

    return results;
  },
};

export default mentorData;
