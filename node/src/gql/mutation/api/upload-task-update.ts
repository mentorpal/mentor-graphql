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
  Mentor as MentorModel,
  Question as QuestionModel,
  UploadTask as UploadTaskModel,
} from 'models';
import { AnswerMediaProps } from 'models/Answer';
import { Mentor } from 'models/Mentor';
import { UploadStatus } from 'models/UploadTask';
import { AnswerMediaInputType } from './upload-answer';

export interface UploadTask {
  taskId: string;
  uploadStatus: UploadStatus;
  transcript: string;
  media: AnswerMediaProps[];
}

export const UploadTaskInputType = new GraphQLInputObjectType({
  name: 'UploadTaskInputType',
  fields: {
    taskId: { type: GraphQLNonNull(GraphQLString) },
    uploadStatus: { type: GraphQLNonNull(GraphQLString) },
    transcript: { type: GraphQLString },
    media: { type: GraphQLList(AnswerMediaInputType) },
  },
});

export const uploadTaskUpdate = {
  type: GraphQLBoolean,
  args: {
    mentorId: { type: GraphQLNonNull(GraphQLID) },
    questionId: { type: GraphQLNonNull(GraphQLID) },
    status: { type: GraphQLNonNull(UploadTaskInputType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      mentorId: string;
      questionId: string;
      status: UploadTask;
    }
  ): Promise<boolean> => {
    if (!(await QuestionModel.exists({ _id: args.questionId }))) {
      throw new Error(`no question found for id '${args.questionId}'`);
    }
    const mentor: Mentor = await MentorModel.findById(args.mentorId);
    if (!mentor) {
      throw new Error(`no mentor found for id '${args.mentorId}'`);
    }
    const task = await UploadTaskModel.findOneAndUpdate(
      {
        mentor: mentor._id,
        question: args.questionId,
      },
      {
        $set: args.status,
      },
      {
        upsert: true,
        new: true,
      }
    );
    return Boolean(task);
  },
};

export default uploadTaskUpdate;
