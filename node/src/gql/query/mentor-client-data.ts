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
import { Question, QuestionType } from '../../models/Question';
import SettingModel, { Config } from '../../models/Setting';
import { Category, SubjectQuestion, Topic } from '../../models/Subject';
import OrganizationModel, { Organization } from '../../models/Organization';
import { User } from '../../models/User';
import { isAnswerComplete, Mentor } from '../../models/Mentor';
import {
  canViewMentor,
  canViewOrganization,
} from '../../utils/check-permissions';
import { toAbsoluteUrl } from '../../utils/static-urls';
import {
  ExternalVideoIdsObjectType,
  IExternalVideoIds,
  externalVideoIdsDefault,
} from '../mutation/api/update-answers';
import { UseDefaultTopics, userIsManagerOrAdmin } from '../mutation/me/helpers';

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
  isDirty: boolean;
  isPublicApproved: boolean;
  directLinkPrivate: boolean;
}

export interface AnswerClientData {
  _id: string;
  name: string;
  utteranceType: string;
  transcript: string;
  webMedia: AnswerMedia;
  mobileMedia: AnswerMedia;
  vttMedia: AnswerMedia;
  externalVideoIds: IExternalVideoIds;
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
    isDirty: { type: GraphQLBoolean },
    isPublicApproved: { type: GraphQLBoolean },
    directLinkPrivate: { type: GraphQLBoolean },
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
    utteranceType: { type: GraphQLString },
    externalVideoIds: { type: ExternalVideoIdsObjectType },
  }),
});

export const TopicQuestionsType = new GraphQLObjectType({
  name: 'TopicQuestionsType',
  fields: () => ({
    topic: { type: GraphQLID },
    questions: { type: GraphQLList(GraphQLString) },
  }),
});

async function getQuestions(
  mentor: Mentor,
  sQuestions: SubjectQuestion[]
): Promise<Question[]> {
  return await QuestionModel.find({
    _id: { $in: sQuestions.map((sq) => sq.question) },
    type: QuestionType.QUESTION,
    $or: [
      { mentor: mentor._id },
      { mentor: { $exists: false } },
      { mentor: null },
    ],
  });
}

async function getCompletedQuestions(
  mentor: Mentor,
  sQuestions: SubjectQuestion[],
  questions: Question[],
  categories: Category[]
): Promise<SubjectQuestion[]> {
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
  const questionIds = answers.map((a) => `${a.question}`);
  const completedQuestions = sQuestions.filter((sq) =>
    questionIds.includes(`${sq.question}`)
  );
  // Add category default topics
  const subjectQuestionsWithUpdatedTopics: SubjectQuestion[] =
    completedQuestions.map((sQuestion) => {
      if (!sQuestion.category) {
        return sQuestion;
      }
      const shouldAddDefaultTopics =
        sQuestion.useDefaultTopics === UseDefaultTopics.TRUE ||
        (sQuestion.useDefaultTopics === UseDefaultTopics.DEFAULT &&
          sQuestion.topics.length === 0);
      if (!shouldAddDefaultTopics) {
        return sQuestion;
      }
      const category = categories.find((c) => c.id === sQuestion.category);
      if (!category) {
        return sQuestion;
      }
      sQuestion.topics = [...sQuestion.topics, ...category.defaultTopics];
      return sQuestion;
    });
  return subjectQuestionsWithUpdatedTopics;
}

interface LeftHomePageData {
  time: string;
  targetMentors: string[];
}

function verifyDirectLinkSecure(
  mentor: Mentor,
  leftHomePageData: string,
  user?: User
): boolean {
  const userOwnsMentor = user?.mentorIds.includes(mentor._id);
  if (
    !mentor.directLinkPrivate ||
    userIsManagerOrAdmin(user?.userRole || '') ||
    userOwnsMentor
  ) {
    return true;
  }

  if (!leftHomePageData) {
    return false;
  }

  const homePageData: LeftHomePageData = JSON.parse(leftHomePageData);
  if (!homePageData.time || !homePageData.targetMentors) {
    return false;
  }
  if (!homePageData.targetMentors.includes(`${mentor._id}`)) {
    return false;
  }
  const leftHomePageTime = new Date(homePageData.time);
  const currentTime = new Date();
  const timeDiff = currentTime.getTime() - leftHomePageTime.getTime();
  const secondsDiff = timeDiff / 1000;
  const hoursDiff = secondsDiff / 3600;
  return hoursDiff <= 5;
}

export const mentorData = {
  type: MentorClientDataType,
  args: {
    mentor: { type: GraphQLNonNull(GraphQLID) },
    subject: { type: GraphQLID },
    orgAccessCode: { type: GraphQLString },
    leftHomePageData: { type: GraphQLString },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      mentor: string;
      subject?: string;
      orgAccessCode?: string;
      leftHomePageData?: string;
    },
    context: { user?: User; org: Organization }
  ): Promise<MentorClientData> => {
    const mentor = await MentorModel.findById(args.mentor);
    if (!mentor) {
      throw new Error(`mentor ${args.mentor} not found`);
    }
    if (!(await canViewMentor(mentor, context.user, context.org))) {
      throw new Error(
        `mentor is private and you do not have permission to access`
      );
    }
    if (!verifyDirectLinkSecure(mentor, args.leftHomePageData, context.user)) {
      throw new Error('mentor can only be accessed via homepage');
    }

    let config: Config;
    if (
      context.org &&
      canViewOrganization(context.org, context.user, args.orgAccessCode)
    ) {
      config = await OrganizationModel.getConfig(context.org);
    } else {
      config = await SettingModel.getConfig();
    }

    let topicQuestions: TopicQuestions[] = [];
    let sQuestions: SubjectQuestion[] = [];
    let questions: Question[] = [];
    let topics: Topic[] = [];
    // use a single subject, either specified or default
    if (
      (args.subject && mentor.subjects.includes(args.subject)) ||
      (mentor.defaultSubject && mentor.subjects.includes(mentor.defaultSubject))
    ) {
      const subject = await SubjectModel.findById(
        args.subject || mentor.defaultSubject
      );
      // get topics in subject order
      topics = subject.topics;
      // get recorded questions in subject order
      const sqs = subject.questions;
      questions = await getQuestions(mentor, sqs);
      sQuestions = await getCompletedQuestions(
        mentor,
        sqs,
        questions,
        subject.categories
      );
    }
    // no specified or default subject, use all subjects
    else {
      const subjects = await SubjectModel.find({
        _id: { $in: mentor.subjects },
      });
      const allCategories = subjects.map((s) => s.categories).flat();
      // get topics in alphabetical order
      topics = subjects.reduce((acc, cur) => {
        const newTopics = cur.topics.filter(
          (ct) => !acc.find((t) => t._id === ct._id)
        );
        return [...acc, ...newTopics];
      }, []);
      topics.sort((a, b) => {
        return a.name.localeCompare(b.name);
      });
      // get recorded questions in alphabetical order
      const sqs = subjects.reduce((acc, cur) => [...acc, ...cur.questions], []);
      questions = await getQuestions(mentor, sqs);
      sQuestions = await getCompletedQuestions(
        mentor,
        sqs,
        questions,
        allCategories
      );
      sQuestions.sort((a, b) => {
        const qa = questions.find((q) => `${q._id}` === `${a.question}`);
        const qb = questions.find((q) => `${q._id}` === `${b.question}`);
        return (
          qa.question.localeCompare(qb.question) *
          (config.questionSortOrder ? 1 : -1)
        );
      });
    }

    if (config.questionSortOrder === 'Alphabetical') {
      topics.sort((a, b) => {
        return a.name.localeCompare(b.name);
      });
      sQuestions.sort((a, b) => {
        const qa = questions.find((q) => `${q._id}` === `${a.question}`);
        const qb = questions.find((q) => `${q._id}` === `${b.question}`);
        return qa.question.localeCompare(qb.question);
      });
    }
    if (config.questionSortOrder === 'Reverse-Alphabetical') {
      topics.sort((a, b) => {
        return a.name.localeCompare(b.name) * -1;
      });
      sQuestions.sort((a, b) => {
        const qa = questions.find((q) => `${q._id}` === `${a.question}`);
        const qb = questions.find((q) => `${q._id}` === `${b.question}`);
        return qa.question.localeCompare(qb.question) * -1;
      });
    }

    // get questions in topic in order
    const topicQuestionRecord: Record<string, string[]> = {};
    for (const topic of topics) {
      topicQuestionRecord[topic.id] = [];
      const topicQuestions = sQuestions.filter((sq) =>
        sq.topics.includes(topic.id)
      );
      for (const tQuestion of topicQuestions) {
        if (!topicQuestionRecord[topic.id].includes(`${tQuestion.question}`)) {
          topicQuestionRecord[topic.id].push(`${tQuestion.question}`);
        }
      }
    }
    topicQuestions = Object.keys(topicQuestionRecord)
      .filter((key) => topicQuestionRecord[key].length > 0) // don't return empty topics
      .map((key) => ({
        topic: topics.find((t) => `${t.id}` === key)?.name,
        questions: topicQuestionRecord[key].map(
          (tq) => questions.find((q) => `${q._id}` === tq)?.question
        ),
      }));

    const utteranceQuestions = await QuestionModel.find({
      type: QuestionType.UTTERANCE,
    });
    let utteranceAnswers = await AnswerModel.find({
      mentor: mentor._id,
      question: { $in: utteranceQuestions.map((q) => q.id) },
    });
    utteranceAnswers = utteranceAnswers.filter((a) =>
      isAnswerComplete(
        a,
        utteranceQuestions.find((q) => `${q._id}` === `${a.question}`),
        mentor
      )
    );
    const utterances: AnswerClientData[] = utteranceAnswers.map((u) => ({
      _id: u.id,
      name: utteranceQuestions.find((q) => `${q.id}` === `${u.question}`)?.name,
      transcript: u.transcript,
      webMedia: u.webMedia,
      mobileMedia: u.mobileMedia,
      vttMedia: u.vttMedia,
      externalVideoIds: u.externalVideoIds || externalVideoIdsDefault,
      utteranceType:
        utteranceQuestions.find((q) => `${q.id}` === `${u.question}`)
          ?.subType || '',
    }));

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
      topicQuestions,
      utterances,
      isDirty: mentor.isDirty,
      isPublicApproved: mentor.isPublicApproved,
      directLinkPrivate: mentor.directLinkPrivate,
    };
  },
};

export default mentorData;
