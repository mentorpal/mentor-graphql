/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLID,
} from 'graphql';
import { Answer as AnswerModel } from '../../../models';
import { AnswerMedia } from '../../../models/Answer';
import { AnswerMediaInputType } from './upload-answer';

export const mediaUpdate = {
  type: GraphQLBoolean,
  args: {
    mentorId: { type: new GraphQLNonNull(GraphQLID) },
    questionId: { type: new GraphQLNonNull(GraphQLID) },
    webMedia: { type: AnswerMediaInputType },
    mobileMedia: { type: AnswerMediaInputType },
    vttMedia: { type: AnswerMediaInputType },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      mentorId: string;
      questionId: string;
      webMedia: AnswerMedia;
      mobileMedia: AnswerMedia;
      vttMedia: AnswerMedia;
    }
  ): Promise<boolean> => {
    let answer = await AnswerModel.findOne({
      mentor: args.mentorId,
      question: args.questionId,
    });
    if (!answer) {
      throw new Error('no answer found');
    }
    const hasUntransferredMedia =
      answer.webMedia?.needsTransfer ||
      answer.mobileMedia?.needsTransfer ||
      answer.vttMedia?.needsTransfer;
    const update_args: Record<string, boolean | AnswerMedia> = {
      hasUntransferredMedia: hasUntransferredMedia,
    };
    if (args.webMedia) {
      update_args['webMedia'] = args.webMedia;
    }
    if (args.mobileMedia) {
      update_args['mobileMedia'] = args.mobileMedia;
    }
    if (args.vttMedia) {
      update_args['vttMedia'] = args.vttMedia;
    }
    answer = await AnswerModel.findByIdAndUpdate(
      answer._id,
      {
        $set: update_args,
      },
      {
        new: true,
      }
    );
    return Boolean(answer);
  },
};

export default mediaUpdate;
