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
  GraphQLList,
} from 'graphql';
import {
  Answer as AnswerModel,
  Mentor as MentorModel,
  Question as QuestionModel,
} from 'models';
import { AnswerMediaProps, Status } from 'models/Answer';
import { Mentor } from 'models/Mentor';

export interface UploadAnswer {
  transcript: string;
  media: AnswerMediaProps[];
}

export const AnswerMediaInputType = new GraphQLInputObjectType({
  name: 'AnswerMediaInputType',
  fields: {
    type: { type: GraphQLString },
    tag: { type: GraphQLString },
    url: { type: GraphQLString },
  },
});

export const UploadAnswerType = new GraphQLInputObjectType({
  name: 'UploadAnswerType',
  fields: () => ({
    transcript: { type: GraphQLString },
    media: { type: GraphQLList(AnswerMediaInputType) },
  }),
});

export const updateAnswer = {
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
    const mentor: Mentor = await MentorModel.findById(args.mentorId);
    if (!mentor) {
      throw new Error(`no mentor found for id '${args.mentorId}'`);
    }
    const answer = await AnswerModel.findOneAndUpdate(
      {
        mentor: mentor._id,
        question: args.questionId,
      },
      {
        $set: {
          ...args.answer,
          status: Status.COMPLETE,
        },
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
