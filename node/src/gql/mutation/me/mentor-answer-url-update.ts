/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
} from 'graphql';
import { Answer as AnswerModel, Mentor as MentorModel } from '../../../models';
import { User } from '../../../models/User';
import { Answer } from '../../../models/Answer';
import { canEditMentor } from '../../../utils/check-permissions';
import { AnswerType } from '../../types/answer';

export const mentorAnswerUrlUpdate = {
  type: AnswerType,
  args: {
    mentorId: { type: GraphQLNonNull(GraphQLID) },
    questionId: { type: GraphQLNonNull(GraphQLID) },
    webUrl: { type: GraphQLString },
    webTransUrl: { type: GraphQLString },
    mobileUrl: { type: GraphQLString },
    mobileTransUrl: { type: GraphQLString },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      mentorId: string;
      questionId: string;
      webUrl: string;
      webTransUrl: string;
      mobileUrl: string;
      mobileTransUrl: string;
    },
    context: { user: User }
  ): Promise<Answer> => {
    if (context.user?.isDisabled) {
      throw new Error('Your account has been disabled');
    }
    const mentor = args.mentorId
      ? await MentorModel.findById(args.mentorId)
      : await MentorModel.findOne({
          user: context.user._id,
        });
    if (!mentor) {
      throw new Error('invalid mentor');
    }
    if (!(await canEditMentor(mentor, context.user))) {
      throw new Error('you do not have permission to edit this mentor');
    }
    if (!mentor.isAdvanced) {
      throw new Error('only advanced mentors can edit video urls directly');
    }
    let answer = await AnswerModel.findOne({
      mentor: args.mentorId,
      question: args.questionId,
    });
    if (!answer) {
      throw new Error('no answer found');
    }

    const update_args: any = {};
    const vttMediaNeedsTransfer = answer.vttMedia?.needsTransfer;
    let webMediaNeedsTransfer = answer.webMedia?.needsTransfer;
    let mobileMediaNeedsTransfer = answer.mobileMedia?.needsTransfer;
    if (args.webUrl) {
      webMediaNeedsTransfer = false;
      update_args['webMedia.url'] = args.webUrl;
    }
    if (args.webTransUrl) {
      update_args['webMedia.transparentVideoUrl'] = args.webTransUrl;
    }
    if (args.mobileUrl) {
      mobileMediaNeedsTransfer = false;
      update_args['mobileMedia.url'] = args.mobileUrl;
    }
    if (args.mobileTransUrl) {
      update_args['mobileMedia.transparentVideoUrl'] = args.mobileTransUrl;
    }
    update_args['hasUntransferredMedia'] =
      vttMediaNeedsTransfer ||
      webMediaNeedsTransfer ||
      mobileMediaNeedsTransfer;
    answer = await AnswerModel.findByIdAndUpdate(
      answer._id,
      {
        $set: update_args,
      },
      {
        new: true,
      }
    );
    return answer;
  },
};

export default mentorAnswerUrlUpdate;
