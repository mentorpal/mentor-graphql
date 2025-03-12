/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLList,
  GraphQLID,
  GraphQLBoolean,
  GraphQLInt,
} from 'graphql';
import {
  Mentor as MentorModel,
  Organization as OrganizationModel,
  Question as QuestionModel,
  MentorTrainStatus as MentorTrainStatusModel,
  Answer as AnswerModel,
  MentorConfig as MentorConfigModel,
} from '../../models';
import { Status } from '../../models/Answer';
import { Mentor, isAnswerComplete } from '../../models/Mentor';
import { QuestionType } from '../../models/Question';
import DateType from './date';
import AnswerType from './answer';
import SubjectType, { SubjectQuestionType, TopicType } from './subject';
import { toAbsoluteUrl } from '../../utils/static-urls';
import { QuestionType as QuestionGQLType } from './question';
import { TrainStatus } from '../../models/MentorTrainTask';
import { MentorConfigType } from '../../models/MentorConfig';
import { Types } from 'mongoose';
import { validateAndConvertToObjectId } from '../mutation/me/helpers';

export const MentorOrgPermissionType = new GraphQLObjectType({
  name: 'MentorOrgPermissionType',
  fields: () => ({
    orgId: { type: GraphQLID },
    orgName: { type: GraphQLString },
    viewPermission: { type: GraphQLString },
    editPermission: { type: GraphQLString },
  }),
});

export const MentorType = new GraphQLObjectType({
  name: 'Mentor',
  fields: () => ({
    createdAt: { type: DateType },
    updatedAt: { type: DateType },
    _id: { type: GraphQLID },
    name: { type: GraphQLString },
    firstName: { type: GraphQLString },
    title: { type: GraphQLString },
    goal: { type: GraphQLString },
    email: { type: GraphQLString },
    allowContact: { type: GraphQLBoolean },
    lastTrainedAt: { type: DateType },
    lastPreviewedAt: { type: DateType },
    isDirty: { type: GraphQLBoolean },
    numAnswersComplete: {
      type: GraphQLInt,
      resolve: async function (mentor: Mentor) {
        console.time('numAnswersComplete');
        const mentorAnswers = await AnswerModel.find({ mentor: mentor._id });
        const questionIds: Types.ObjectId[] = mentorAnswers.map(
          (answer) => answer.question
        );
        const mentorQuestions = await QuestionModel.find({
          _id: { $in: questionIds },
        });
        const completeAnswers = mentorAnswers.filter((answer) =>
          isAnswerComplete(
            answer,
            mentorQuestions.find((q) => answer.question == q._id),
            mentor
          )
        );
        console.timeEnd('numAnswersComplete');
        return completeAnswers.length;
      },
    },
    dirtyReason: { type: GraphQLString },
    isPrivate: { type: GraphQLBoolean },
    isArchived: { type: GraphQLBoolean },
    isAdvanced: { type: GraphQLBoolean },
    isPublicApproved: { type: GraphQLBoolean },
    directLinkPrivate: { type: GraphQLBoolean },
    hasVirtualBackground: { type: GraphQLBoolean },
    virtualBackgroundUrl: {
      type: GraphQLString,
      resolve: function (mentor: Mentor) {
        return mentor.virtualBackgroundUrl
          ? toAbsoluteUrl(mentor.virtualBackgroundUrl)
          : '';
      },
    },
    mentorType: { type: GraphQLString },
    defaultSubject: { type: SubjectType },
    mentorConfig: {
      type: MentorConfigType,
      resolve: async (mentor: Mentor) => {
        console.time('mentorConfig');
        if (mentor.mentorConfig) {
          console.time('mentorConfig.findById');
          const config = await MentorConfigModel.findById(mentor.mentorConfig);
          console.timeEnd('mentorConfig.findById');
          return config;
        }
        console.timeEnd('mentorConfig');
        return null;
      },
    },
    lockedToConfig: { type: GraphQLBoolean },
    orgPermissions: {
      type: new GraphQLList(MentorOrgPermissionType),
      resolve: async (mentor: Mentor) => {
        console.time('orgPermissions');
        if (!mentor.orgPermissions) {
          console.timeEnd('orgPermissions');
          return [];
        }
        console.time('OrganizationModel.find');
        const orgs = await OrganizationModel.find({
          _id: { $in: mentor.orgPermissions.map((op) => op.org) },
        });
        console.timeEnd('OrganizationModel.find');
        return mentor.orgPermissions.map((op) => ({
          orgId: op.org,
          orgName: orgs.find((o) => `${o._id}` === `${op.org}`)?.name || '',
          viewPermission: op.viewPermission,
          editPermission: op.editPermission,
        }));
      },
    },
    lastTrainStatus: {
      type: GraphQLString,
      resolve: async (mentor: Mentor) => {
        console.time('lastTrainStatus');
        const mostRecentTrainTask = await MentorTrainStatusModel.findOne(
          { mentor: mentor._id },
          {},
          { sort: { createdAt: -1 } }
        );
        if (!mostRecentTrainTask) {
          console.timeEnd('lastTrainStatus');
          return TrainStatus.NONE;
        }
        console.timeEnd('lastTrainStatus');
        return mostRecentTrainTask.status;
      },
    },
    keywords: { type: new GraphQLList(GraphQLString) },
    recordQueue: {
      type: new GraphQLList(QuestionGQLType),
      resolve: async (mentor: Mentor) => {
        console.time('recordQueue');
        const questions = await QuestionModel.find({
          _id: { $in: mentor.recordQueue },
        });
        console.timeEnd('recordQueue');
        return questions;
      },
    },
    thumbnail: {
      type: GraphQLString,
      resolve: function (mentor: Mentor) {
        console.time('thumbnail');
        const thumbnail = mentor.thumbnail
          ? toAbsoluteUrl(mentor.thumbnail)
          : '';
        console.timeEnd('thumbnail');
        return thumbnail;
      },
    },
    subjects: {
      type: new GraphQLList(SubjectType),
      resolve: async function (mentor: Mentor) {
        console.time('subjects');
        const subjects = await MentorModel.getSubjects(mentor);
        console.timeEnd('subjects');
        return subjects;
      },
    },
    topics: {
      type: new GraphQLList(TopicType),
      args: {
        subject: { type: GraphQLID },
        useDefaultSubject: { type: GraphQLBoolean },
      },
      resolve: async function (
        mentor: Mentor,
        args: { subject: string; useDefaultSubject: boolean }
      ) {
        console.time('topics');
        const topics = await MentorModel.getTopics({
          mentor: mentor,
          defaultSubject: args.useDefaultSubject,
          subjectId: args.subject
            ? validateAndConvertToObjectId(args.subject)
            : undefined,
        });
        console.timeEnd('topics');
        return topics;
      },
    },
    questions: {
      type: new GraphQLList(SubjectQuestionType),
      args: {
        useDefaultSubject: { type: GraphQLBoolean },
        subject: { type: GraphQLID },
        topic: { type: GraphQLID },
        type: { type: GraphQLString },
      },
      resolve: async function (
        mentor: Mentor,
        args: {
          useDefaultSubject: boolean;
          subject: string;
          topic: string;
          type: string;
        }
      ) {
        console.time('questions');
        const questions = await MentorModel.getQuestions({
          mentor: mentor,
          defaultSubject: args.useDefaultSubject,
          subjectId: args.subject
            ? validateAndConvertToObjectId(args.subject)
            : undefined,
          topicId: args.topic,
          type: args.type as QuestionType,
        });
        console.timeEnd('questions');
        return questions;
      },
    },
    answers: {
      type: new GraphQLList(AnswerType),
      args: {
        useDefaultSubject: { type: GraphQLBoolean },
        subject: { type: GraphQLID },
        topic: { type: GraphQLID },
        status: { type: GraphQLString },
      },
      resolve: async function (
        mentor: Mentor,
        args: {
          useDefaultSubject: boolean;
          subject: string;
          topic: string;
          status: string;
        }
      ) {
        console.log('answer start');
        console.time('answers');
        const answers = await MentorModel.getAnswers({
          mentor: mentor,
          defaultSubject: args.useDefaultSubject,
          subjectId: args.subject
            ? validateAndConvertToObjectId(args.subject)
            : undefined,
          topicId: args.topic,
          status: args.status as Status,
        });
        console.timeEnd('answers');
        return answers;
      },
    },
    orphanedCompleteAnswers: {
      type: new GraphQLList(AnswerType),
      resolve: async function (mentor: Mentor) {
        console.time('orphanedCompleteAnswers');
        const answers = await MentorModel.getOrphanedCompleteAnswers(mentor);
        console.timeEnd('orphanedCompleteAnswers');
        return answers;
      },
    },
    utterances: {
      type: new GraphQLList(AnswerType),
      args: {
        status: { type: GraphQLString },
      },
      resolve: async function (mentor: Mentor, args: { status: string }) {
        console.time('utterances');
        const answers = await MentorModel.getAnswers({
          mentor: mentor,
          defaultSubject: false,
          status: args.status as Status,
          type: QuestionType.UTTERANCE,
        });
        console.timeEnd('utterances');
        return answers;
      },
    },
  }),
});

export default MentorType;
