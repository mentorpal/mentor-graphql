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
} from 'graphql';
import {
  Mentor as MentorModel,
  Organization as OrganizationModel,
  Question as QuestionModel,
  MentorTrainStatus as MentorTrainStatusModel,
} from '../../models';
import { Status } from '../../models/Answer';
import { Mentor } from '../../models/Mentor';
import { QuestionType } from '../../models/Question';
import DateType from './date';
import AnswerType from './answer';
import SubjectType, { SubjectQuestionType, TopicType } from './subject';
import { toAbsoluteUrl } from '../../utils/static-urls';
import { QuestionType as QuestionGQLType } from './question';
import { TrainStatus } from '../../models/MentorTrainTask';

export const OrgPermissionType = new GraphQLObjectType({
  name: 'OrgPermissionType',
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
    dirtyReason: { type: GraphQLString },
    isPrivate: { type: GraphQLBoolean },
    isArchived: { type: GraphQLBoolean },
    isAdvanced: { type: GraphQLBoolean },
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
    orgPermissions: {
      type: GraphQLList(OrgPermissionType),
      resolve: async (mentor: Mentor) => {
        if (!mentor.orgPermissions) {
          return [];
        }
        const orgs = await OrganizationModel.find({
          _id: { $in: mentor.orgPermissions.map((op) => op.org) },
        });
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
        const mostRecentTrainTask = await MentorTrainStatusModel.findOne(
          { mentor: mentor._id },
          {},
          { sort: { createdAt: -1 } }
        );
        if (!mostRecentTrainTask) {
          return TrainStatus.NONE;
        }
        return mostRecentTrainTask.status;
      },
    },
    keywords: { type: GraphQLList(GraphQLString) },
    recordQueue: {
      type: GraphQLList(QuestionGQLType),
      resolve: async (mentor: Mentor) => {
        return await QuestionModel.find({ _id: { $in: mentor.recordQueue } });
      },
    },
    thumbnail: {
      type: GraphQLString,
      resolve: function (mentor: Mentor) {
        return mentor.thumbnail ? toAbsoluteUrl(mentor.thumbnail) : '';
      },
    },
    subjects: {
      type: GraphQLList(SubjectType),
      resolve: async function (mentor: Mentor) {
        return await MentorModel.getSubjects(mentor);
      },
    },
    topics: {
      type: GraphQLList(TopicType),
      args: {
        subject: { type: GraphQLID },
        useDefaultSubject: { type: GraphQLBoolean },
      },
      resolve: async function (
        mentor: Mentor,
        args: { subject: string; useDefaultSubject: boolean }
      ) {
        return await MentorModel.getTopics({
          mentor: mentor,
          defaultSubject: args.useDefaultSubject,
          subjectId: args.subject,
        });
      },
    },
    questions: {
      type: GraphQLList(SubjectQuestionType),
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
        return await MentorModel.getQuestions({
          mentor: mentor,
          defaultSubject: args.useDefaultSubject,
          subjectId: args.subject,
          topicId: args.topic,
          type: args.type as QuestionType,
        });
      },
    },
    answers: {
      type: GraphQLList(AnswerType),
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
        return await MentorModel.getAnswers({
          mentor: mentor,
          defaultSubject: args.useDefaultSubject,
          subjectId: args.subject,
          topicId: args.topic,
          status: args.status as Status,
        });
      },
    },
    utterances: {
      type: GraphQLList(AnswerType),
      args: {
        status: { type: GraphQLString },
      },
      resolve: async function (mentor: Mentor, args: { status: string }) {
        return await MentorModel.getAnswers({
          mentor: mentor,
          defaultSubject: false,
          status: args.status as Status,
          type: QuestionType.UTTERANCE,
        });
      },
    },
  }),
});

export default MentorType;
