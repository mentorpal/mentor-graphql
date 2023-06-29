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
} from 'graphql';
import {
  Answer as AnswerModel,
  Mentor as MentorModel,
  Question as QuestionModel,
} from '../../../models';
import { AnswerMedia, AnswerMediaProps, Status } from '../../../models/Answer';
import { Mentor, MentorDirtyReason } from '../../../models/Mentor';
import { AnswerMediaType } from 'gql/types/answer';


export const answerUploadTanscriptVtts = {
  type: GraphQLBoolean,
  args: {
    mentorId: { type: GraphQLNonNull(GraphQLID) },
    questionId: { type: GraphQLNonNull(GraphQLID) },
    transcript: { type: GraphQLNonNull(GraphQLString) },
    vttMedia: {type: GraphQLNonNull(AnswerMediaType)}
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      mentorId: string;
      questionId: string;
      transcript: string;
      vttMedia: AnswerMedia;
    }
  ): Promise<boolean> => {
    const {mentorId, questionId, transcript, vttMedia} = args;
    if (!(await QuestionModel.exists({ _id: questionId }))) {
      throw new Error(`no question found for id '${questionId}'`);
    }
    const mentor: Mentor = await MentorModel.findOneAndUpdate(
      {
        _id: mentorId,
      },
      {
        $set: {
          isDirty: true,
          dirtyReason: MentorDirtyReason.ANSWERS_ADDED,
        },
      }
    );
    if (!mentor) {
      throw new Error(`no mentor found for id '${args.mentorId}'`);
    }

    const updates: Record<
      string,
      string | boolean | AnswerMediaProps
    > = {
      status: Status.NONE,
      hasEditedTranscript: false,
      transcript: transcript,
      vttMedia: vttMedia,
    };
    updates['hasUntransferredMedia'] = false;
    const answer = await AnswerModel.findOneAndUpdate(
      {
        mentor: mentor._id,
        question: questionId,
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

export default answerUploadTanscriptVtts;
