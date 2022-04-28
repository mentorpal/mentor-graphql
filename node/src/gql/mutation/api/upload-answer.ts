/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLBoolean,
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLInputObjectType,
} from 'graphql';
import {
  Answer as AnswerModel,
  Mentor as MentorModel,
  Question as QuestionModel,
} from 'models';
import { AnswerMediaProps, Status } from 'models/Answer';
import { Mentor } from 'models/Mentor';
import { mediaNeedsTransfer } from 'utils/static-urls';

export interface UploadAnswer {
  transcript: string;
  webMedia: AnswerMediaProps;
  mobileMedia: AnswerMediaProps;
  vttMedia: AnswerMediaProps;
  hasEditedTranscript: boolean;
}

export const AnswerMediaInputType = new GraphQLInputObjectType({
  name: 'AnswerMediaInputType',
  fields: {
    type: { type: GraphQLString },
    tag: { type: GraphQLString },
    url: { type: GraphQLString },
    needsTransfer: { type: GraphQLBoolean },
  },
});

export const UploadAnswerType = new GraphQLInputObjectType({
  name: 'UploadAnswerType',
  fields: () => ({
    transcript: { type: GraphQLString },
    webMedia: { type: AnswerMediaInputType },
    mobileMedia: { type: AnswerMediaInputType },
    vttMedia: { type: AnswerMediaInputType },
    hasEditedTranscript: { type: GraphQLBoolean },
  }),
});

export const answerUpload = {
  type: GraphQLBoolean,
  args: {
    mentorId: { type: GraphQLNonNull(GraphQLID) },
    questionId: { type: GraphQLNonNull(GraphQLID) },
    answer: { type: GraphQLNonNull(UploadAnswerType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      mentorId: string;
      questionId: string;
      answer: UploadAnswer;
    }
  ): Promise<boolean> => {
    if (!(await QuestionModel.exists({ _id: args.questionId }))) {
      throw new Error(`no question found for id '${args.questionId}'`);
    }
    const mentor: Mentor = await MentorModel.findOneAndUpdate(
      {
        _id: args.mentorId,
      },
      {
        $set: {
          isDirty: true,
        },
      }
    );
    if (!mentor) {
      throw new Error(`no mentor found for id '${args.mentorId}'`);
    }
    const argWebMedia = args.answer.webMedia;
    const argMobileMedia = args.answer.mobileMedia;
    const argVttMedia = args.answer.vttMedia;
    let answer = await AnswerModel.findOne({
      mentor: mentor._id,
      question: args.questionId,
    });
    const hasEditedTranscript =
      args.answer.hasEditedTranscript !== undefined
        ? args.answer.hasEditedTranscript
        : answer
        ? answer.hasEditedTranscript
        : false;

    // any = Boolean, String, Answer
    const updates: Record<string, string | boolean | AnswerMediaProps> = {
      ...args.answer,
      status: Status.INCOMPLETE, // with partial updates we cant tell here
      hasEditedTranscript: hasEditedTranscript,
      transcript:
        args.answer.transcript != undefined
          ? args.answer.transcript
          : answer
          ? answer.transcript
          : '',
    };
    if (argWebMedia) {
      argWebMedia.needsTransfer = mediaNeedsTransfer(argWebMedia.url);
      updates['webMedia'] = argWebMedia;
    }
    if (argMobileMedia) {
      argMobileMedia.needsTransfer = mediaNeedsTransfer(argMobileMedia.url);
      updates['mobileMedia'] = argMobileMedia;
    }
    if (argVttMedia) {
      argVttMedia.needsTransfer = mediaNeedsTransfer(argVttMedia.url);
      updates['vttMedia'] = argVttMedia;
    }
    const hasUntransferredMedia =
      Boolean(argWebMedia?.needsTransfer) ||
      Boolean(argMobileMedia?.needsTransfer) ||
      Boolean(argVttMedia?.needsTransfer);
    updates['hasUntransferredMedia'] = hasUntransferredMedia;
    answer = await AnswerModel.findOneAndUpdate(
      {
        mentor: mentor._id,
        question: args.questionId,
      },
      {
        $set: updates,
      },
      {
        upsert: true,
        new: true,
      }
    );
    return Boolean(answer);
  },
};

export default answerUpload;
