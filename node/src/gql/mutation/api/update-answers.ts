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
  GraphQLList,
} from 'graphql';
import {
  Answer as AnswerModel,
  Mentor as MentorModel,
  Question as QuestionModel,
} from '../../../models';
import { AnswerMediaProps, Status } from '../../../models/Answer';
import { Mentor } from '../../../models/Mentor';
import { mediaNeedsTransfer } from '../../../utils/static-urls';
import { AnswerMediaInputType } from './upload-answer';

export const UploadAnswersType = new GraphQLInputObjectType({
  name: 'UploadAnswersType',
  fields: () => ({
    transcript: { type: GraphQLString },
    webMedia: { type: AnswerMediaInputType },
    mobileMedia: { type: AnswerMediaInputType },
    vttMedia: { type: AnswerMediaInputType },
    hasEditedTranscript: { type: GraphQLBoolean },
    questionId: { type: GraphQLID },
  }),
});

export interface UploadAnswers {
  transcript: string;
  webMedia: AnswerMediaProps;
  mobileMedia: AnswerMediaProps;
  vttMedia: AnswerMediaProps;
  hasEditedTranscript: boolean;
  questionId: string;
}

interface BulkWriteAnswer {
  questionId: string;
  updates: Record<string, string | boolean | AnswerMediaProps>;
}

export const updateAnswers = {
  type: GraphQLBoolean,
  args: {
    mentorId: { type: GraphQLNonNull(GraphQLID) },
    answers: { type: GraphQLList(UploadAnswersType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      mentorId: string;
      answers: UploadAnswers[];
    }
  ): Promise<boolean> => {
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
    const bulkWriteAnswers: BulkWriteAnswer[] = [];

    for (let i = 0; i < args.answers.length; i++) {
      const inputAnswer = args.answers[i];
      if (!(await QuestionModel.exists({ _id: inputAnswer.questionId }))) {
        throw new Error(`no question found for id '${inputAnswer.questionId}'`);
      }
      const answer = await AnswerModel.findOne({
        mentor: mentor._id,
        question: inputAnswer.questionId,
      });
      const hasEditedTranscript =
        inputAnswer.hasEditedTranscript !== undefined
          ? inputAnswer.hasEditedTranscript
          : answer
          ? answer.hasEditedTranscript
          : false;

      const argWebMedia = inputAnswer.webMedia;
      const argMobileMedia = inputAnswer.mobileMedia;
      const argVttMedia = inputAnswer.vttMedia;

      // any = Boolean, String, Answer
      const updates: Record<string, string | boolean | AnswerMediaProps> = {
        ...(argWebMedia ? { webMedia: argWebMedia } : {}),
        ...(argMobileMedia ? { mobileMedia: argMobileMedia } : {}),
        ...(argVttMedia ? { vttMedia: argVttMedia } : {}),
        status: Status.NONE, // with partial updates we cant tell here
        hasEditedTranscript: hasEditedTranscript,
        transcript:
          inputAnswer.transcript != undefined
            ? inputAnswer.transcript
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
      bulkWriteAnswers.push({
        questionId: inputAnswer.questionId,
        updates: updates,
      });
    }
    await AnswerModel.bulkWrite(
      bulkWriteAnswers.map((answerToUpdate) => {
        const updates = answerToUpdate.updates;
        return {
          updateOne: {
            filter: {
              mentor: mentor._id,
              question: answerToUpdate['questionId'],
            },
            update: { $set: updates },
            upsert: false,
          },
        };
      })
    );
    return true;
  },
};

export default updateAnswers;
