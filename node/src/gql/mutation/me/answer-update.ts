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
  GraphQLInputObjectType,
} from 'graphql';
import {
  Answer as AnswerModel,
  Mentor as MentorModel,
  Question as QuestionModel,
} from 'models';
import { Status } from 'models/Answer';
import { Mentor } from 'models/Mentor';
import { User, UserRole } from 'models/User';

export interface AnswerUpdateInput {
  transcript: string;
  status: Status;
}

export const UpdateAnswerInputType = new GraphQLInputObjectType({
  name: 'UpdateAnswerInputType',
  fields: () => ({
    transcript: { type: GraphQLString },
    status: { type: GraphQLString },
  }),
});

export const updateAnswer = {
  type: GraphQLBoolean,
  args: {
    mentorId: { type: GraphQLID },
    questionId: { type: GraphQLNonNull(GraphQLID) },
    answer: { type: GraphQLNonNull(UpdateAnswerInputType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { mentorId: string; questionId: string; answer: AnswerUpdateInput },
    context: { user: User }
  ): Promise<boolean> => {
    if (!(await QuestionModel.exists({ _id: args.questionId }))) {
      throw new Error(`no question found for id '${args.questionId}'`);
    }
    let mentor: Mentor = await MentorModel.findOne({
      user: context.user._id,
    });
    if (!mentor) {
      throw new Error('you do not have a mentor');
    }
    if (args.mentorId && `${mentor._id}` !== `${args.mentorId}`) {
      if (context.user.userRole !== UserRole.ADMIN &&
        context.user.userRole !== UserRole.CONTENT_MANAGER) {
        throw new Error('you do not have permission to edit this mentor');
      }
      mentor = await MentorModel.findById(args.mentorId);
    }
    const answer = await AnswerModel.findOneAndUpdate(
      {
        mentor: mentor._id,
        question: args.questionId,
      },
      {
        $set: args.answer,
      },
      {
        upsert: true,
        new: true,
      }
    );
    return Boolean(answer);
  },
};

export default updateAnswer;
