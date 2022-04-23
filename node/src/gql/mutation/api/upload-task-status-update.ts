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
import { logger } from 'utils/logging';
import {
  Mentor as MentorModel,
  Question as QuestionModel,
  UploadTask as UploadTaskModel,
} from 'models';
import { AnswerMediaProps } from 'models/Answer';
import { Mentor } from 'models/Mentor';
import { AnswerMediaInputType } from './upload-answer';
import { TaskInfo, TaskInfoInputType, TaskInfoProps } from 'models/TaskInfo';

export const uploadTaskStatusUpdate = {
  type: GraphQLBoolean,
  args: {
    mentorId: { type: GraphQLNonNull(GraphQLID) },
    questionId: { type: GraphQLNonNull(GraphQLID) },
    originalMedia: { type: AnswerMediaInputType },
    transcript: { type: GraphQLString },
    trimUploadTask: { type: TaskInfoInputType },
    transcodeWebTask: { type: TaskInfoInputType },
    transcodeMobileTask: { type: TaskInfoInputType },
    transcribeTask: { type: TaskInfoInputType },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      mentorId: string;
      questionId: string;
      originalMedia: AnswerMediaProps;
      transcript: string;
      trimUploadTask: TaskInfo;
      transcodeWebTask: TaskInfo;
      transcodeMobileTask: TaskInfo;
      transcribeTask: TaskInfo;
    }
  ): Promise<boolean> => {
    logger.info('uploadTaskStatusUpdate', args);
    const numberTaskInputs =
      Number(Boolean(args.transcodeWebTask)) +
      Number(Boolean(args.transcodeMobileTask)) +
      Number(Boolean(args.transcribeTask)) +
      Number(Boolean(args.trimUploadTask));
    if (numberTaskInputs > 1) {
      throw new Error('Please only input one task to update at a time.');
    }
    if (!(await QuestionModel.exists({ _id: args.questionId }))) {
      throw new Error(`no question found for id '${args.questionId}'`);
    }
    const mentor: Mentor = await MentorModel.findById(args.mentorId);
    if (!mentor) {
      throw new Error(`no mentor found for id '${args.mentorId}'`);
    }
    const uploadTask = await UploadTaskModel.findOne({
      mentor: mentor._id,
      question: args.questionId,
    });
    if (!uploadTask) {
      return false;
    }
    const webTaskArg = args.transcodeWebTask;
    const mobileTaskArg = args.transcodeMobileTask;
    const transcribeTaskArg = args.transcribeTask;
    const trimUploadTaskArg = args.trimUploadTask;
    const updates: Record<string, string | TaskInfoProps | AnswerMediaProps> =
      {};

    if (args.transcript) {
      updates['transcript'] = args.transcript;
    }
    if (args.originalMedia) {
      updates['originalMedia'] = args.originalMedia;
    }
    if (webTaskArg) {
      updates['transcodeWebTask'] = {
        task_name:
          webTaskArg.task_name || uploadTask.transcodeWebTask?.task_name,
        status: webTaskArg.status || uploadTask.transcodeWebTask?.status,
        transcript:
          webTaskArg.transcript || uploadTask.transcodeWebTask?.transcript,
        media: webTaskArg.media || uploadTask.transcodeWebTask?.media,
      };
    }
    if (mobileTaskArg) {
      updates['transcodeMobileTask'] = {
        task_name:
          mobileTaskArg.task_name || uploadTask.transcodeMobileTask?.task_name,
        status: mobileTaskArg.status || uploadTask.transcodeMobileTask?.status,
        transcript:
          mobileTaskArg.transcript ||
          uploadTask.transcodeMobileTask?.transcript,
        media: mobileTaskArg.media || uploadTask.transcodeMobileTask?.media,
      };
    }
    if (transcribeTaskArg) {
      updates['transcribeTask'] = {
        task_name:
          transcribeTaskArg.task_name || uploadTask.transcribeTask?.task_name,
        status: transcribeTaskArg.status || uploadTask.transcribeTask?.status,
        transcript:
          transcribeTaskArg.transcript || uploadTask.transcribeTask?.transcript,
        media: transcribeTaskArg.media || uploadTask.transcribeTask?.media,
      };
    }
    if (trimUploadTaskArg) {
      updates['trimUploadTask'] = {
        task_name:
          trimUploadTaskArg.task_name || uploadTask.trimUploadTask?.task_name,
        status: trimUploadTaskArg.status || uploadTask.trimUploadTask?.status,
        transcript:
          trimUploadTaskArg.transcript || uploadTask.trimUploadTask?.transcript,
        media: trimUploadTaskArg.media || uploadTask.trimUploadTask?.media,
      };
    }
    const updatedTask = await UploadTaskModel.findOneAndUpdate(
      {
        mentor: mentor._id,
        question: args.questionId,
      },
      {
        $set: updates,
      },
      {
        new: true,
      }
    );
    console.log(`Updated task: ${JSON.stringify(updatedTask)}`);
    return Boolean(updatedTask);
  },
};

export default uploadTaskStatusUpdate;
