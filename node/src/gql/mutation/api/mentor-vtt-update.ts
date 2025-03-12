/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLID,
} from 'graphql';
import { Answer as AnswerModel } from '../../../models';

export const mentorVbgUpdate = {
  type: GraphQLBoolean,
  args: {
    mentorId: { type: new GraphQLNonNull(GraphQLID) },
    questionId: { type: new GraphQLNonNull(GraphQLString) },
    vttUrl: { type: new GraphQLNonNull(GraphQLString) },
    vttText: { type: GraphQLString },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      mentorId: string;
      questionId: string;
      vttUrl: string;
      vttText: string;
    }
  ): Promise<boolean> => {
    const { mentorId, questionId, vttUrl, vttText } = args;
    const updatedAnswer = await AnswerModel.findOneAndUpdate(
      {
        mentor: mentorId,
        question: questionId,
      },
      {
        $set: {
          vttMedia: {
            type: 'subtitles',
            tag: 'en',
            url: vttUrl,
            vttText: vttText,
            transparentVideoUrl: '',
            needsTransfer: false,
          },
        },
      }
    );
    if (!updatedAnswer) {
      throw new Error(
        `no answer found for mentor '${mentorId}' and question ${questionId}`
      );
    }
    return true;
  },
};

export default mentorVbgUpdate;
