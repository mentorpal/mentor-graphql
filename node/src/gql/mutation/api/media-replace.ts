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
  GraphQLList,
} from 'graphql';
import { Answer as AnswerModel } from 'models';
import { AnswerMedia } from 'models/Answer';
import { AnswerMediaInputType } from './upload-answer';

export const mediaReplace = {
  type: GraphQLBoolean,
  args: {
    mentorId: { type: GraphQLNonNull(GraphQLID) },
    questionId: { type: GraphQLNonNull(GraphQLID) },
    media: { type: GraphQLNonNull(GraphQLList(AnswerMediaInputType)) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      mentorId: string;
      questionId: string;
      media: AnswerMedia;
    }
  ): Promise<boolean> => {
    let answer = await AnswerModel.findOne({
      mentor: args.mentorId,
      question: args.questionId,
    });
    if (!answer) {
      throw new Error('no answer found');
    }
    const hasUntransferredMedia = answer.media.some((m) => m.needsTransfer);
    answer = await AnswerModel.findByIdAndUpdate(
      answer._id,
      {
        $set: { media: args.media, hasUntransferredMedia },
      },
      {
        new: true,
      }
    );
    return Boolean(answer);
  },
};

export default mediaReplace;
