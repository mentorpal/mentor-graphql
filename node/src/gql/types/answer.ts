/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLID,
  GraphQLString,
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLList,
  GraphQLFloat,
} from 'graphql';
import { AnswerMedia, Answer } from '../../models/Answer';
import { toAbsoluteUrl } from '../../utils/static-urls';
import DateType from './date';
import removeMarkdown from 'remove-markdown';
import QuestionType from './question';
import { isValidObjectId } from 'mongoose';
import {
  ExternalVideoIdsObjectType,
  externalVideoIdsDefault,
} from '../mutation/api/update-answers';
import { DataLoaders } from '../data-loaders/context';
export const PreviousAnswerVersionType = new GraphQLObjectType({
  name: 'PreviousAnswerVersionType',
  fields: {
    versionControlId: { type: GraphQLString },
    transcript: { type: GraphQLString },
    webVideoHash: { type: GraphQLString },
    videoDuration: { type: GraphQLFloat },
    vttText: { type: GraphQLString },
    dateVersioned: { type: GraphQLString },
  },
});

export const AnswerMediaType = new GraphQLObjectType({
  name: 'AnswerMedia',
  fields: {
    type: { type: GraphQLString },
    tag: { type: GraphQLString },
    needsTransfer: { type: GraphQLBoolean },
    url: {
      type: GraphQLString,
      args: {
        browserSupportsVbg: { type: GraphQLBoolean },
      },
      resolve: function (
        media: AnswerMedia,
        args: {
          browserSupportsVbg: boolean;
        }
      ) {
        return args.browserSupportsVbg && media.transparentVideoUrl
          ? toAbsoluteUrl(media.transparentVideoUrl)
          : media.url
            ? toAbsoluteUrl(media.url)
            : '';
      },
    },
    transparentVideoUrl: {
      type: GraphQLString,
      resolve: function (media: AnswerMedia) {
        return media.transparentVideoUrl
          ? toAbsoluteUrl(media.transparentVideoUrl)
          : '';
      },
    },
    hash: { type: GraphQLString },
    stringMetadata: { type: GraphQLString },
    vttText: { type: GraphQLString },
    duration: { type: GraphQLFloat },
  },
});

export const AnswerType = new GraphQLObjectType({
  name: 'Answer',
  fields: () => ({
    _id: { type: GraphQLID },
    question: {
      type: QuestionType,
      resolve: async function (
        answer: Answer,
        _,
        context: {
          dataLoaders: DataLoaders;
        }
      ) {
        if (!isValidObjectId(`${answer.question}`)) {
          return answer.question;
        }

        return context.dataLoaders.loaders.questionLoader.load(
          answer.question.toString()
        );
      },
    },
    hasEditedTranscript: { type: GraphQLBoolean },
    transcript: {
      type: GraphQLString,
      resolve: function (answer: Answer) {
        return removeMarkdown(answer.transcript || '');
      },
    },
    externalVideoIds: {
      type: ExternalVideoIdsObjectType,
      resolve: function (answer: Answer) {
        return answer.externalVideoIds || externalVideoIdsDefault;
      },
    },
    markdownTranscript: {
      type: GraphQLString,
      resolve: function (answer: Answer) {
        return answer.transcript;
      },
    },
    status: { type: GraphQLString },
    hasUntransferredMedia: { type: GraphQLBoolean },
    media: { type: GraphQLList(AnswerMediaType) },
    webMedia: { type: AnswerMediaType },
    mobileMedia: { type: AnswerMediaType },
    vttMedia: { type: AnswerMediaType },
    createdAt: { type: DateType },
    updatedAt: { type: DateType },
    previousVersions: {
      type: GraphQLList(PreviousAnswerVersionType),
    },
    docMissing: { type: GraphQLBoolean },
  }),
});

export default AnswerType;
