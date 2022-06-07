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
import { logger } from '../../../utils/logging';
import {
  Mentor as MentorModel,
  Question as QuestionModel,
  UploadTask as UploadTaskModel,
} from '../../../models';
import { AnswerMediaProps } from '../../../models/Answer';
import { Mentor } from '../../../models/Mentor';
import { AnswerMediaInputType } from './upload-answer';
import {
  TaskInfo,
  TaskInfoInputType,
  TaskInfoProps,
} from '../../../models/TaskInfo';

export const UploadTaskStatusUpdateInputType = new GraphQLInputObjectType({
  name: 'UploadTaskStatusUpdateInputType',
  fields: {
    transcript: { type: GraphQLString },
    originalMedia: { type: AnswerMediaInputType },
    webMedia: { type: AnswerMediaInputType },
    mobileMedia: { type: AnswerMediaInputType },
    vttMedia: { type: AnswerMediaInputType },
    trimUploadTask: { type: TaskInfoInputType },
    transcodeWebTask: { type: TaskInfoInputType },
    transcodeMobileTask: { type: TaskInfoInputType },
    transcribeTask: { type: TaskInfoInputType },
  },
});

export interface UploadTaskStatusUpdateInput {
  transcript: string;
  originalMedia: AnswerMediaProps;
  webMedia: AnswerMediaProps;
  mobileMedia: AnswerMediaProps;
  vttMedia: AnswerMediaProps;
  trimUploadTask: TaskInfo;
  transcodeWebTask: TaskInfo;
  transcodeMobileTask: TaskInfo;
  transcribeTask: TaskInfo;
}

export const uploadTaskStatusUpdate = {
  type: GraphQLBoolean,
  args: {
    mentorId: { type: GraphQLNonNull(GraphQLID) },
    questionId: { type: GraphQLNonNull(GraphQLID) },
    uploadTaskStatusInput: {
      type: GraphQLNonNull(UploadTaskStatusUpdateInputType),
    },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      mentorId: string;
      questionId: string;
      uploadTaskStatusInput: UploadTaskStatusUpdateInput;
    }
  ): Promise<boolean> => {
    const { mentorId, questionId } = args;
    const {
      transcript,
      originalMedia,
      webMedia,
      mobileMedia,
      vttMedia,
      trimUploadTask,
      transcodeWebTask,
      transcodeMobileTask,
      transcribeTask,
    } = args.uploadTaskStatusInput;
    logger.info('uploadTaskStatusUpdate', args);
    const numberTaskInputs =
      Number(Boolean(transcodeWebTask)) +
      Number(Boolean(transcodeMobileTask)) +
      Number(Boolean(transcribeTask)) +
      Number(Boolean(trimUploadTask));
    if (numberTaskInputs > 1) {
      throw new Error('Please only input one task to update at a time.');
    }
    if (!(await QuestionModel.exists({ _id: questionId }))) {
      throw new Error(`no question found for id '${questionId}'`);
    }
    const mentor: Mentor = await MentorModel.findById(mentorId);
    if (!mentor) {
      throw new Error(`no mentor found for id '${mentorId}'`);
    }
    const uploadTask = await UploadTaskModel.findOne({
      mentor: mentor._id,
      question: questionId,
    });
    if (!uploadTask) {
      return false;
    }
    const webTaskArg = transcodeWebTask;
    const mobileTaskArg = transcodeMobileTask;
    const transcribeTaskArg = transcribeTask;
    const trimUploadTaskArg = trimUploadTask;
    const updates: Record<string, string | TaskInfoProps | AnswerMediaProps> =
      {};

    if (transcript) {
      updates['transcript'] = transcript;
    }
    if (originalMedia) {
      updates['originalMedia'] = originalMedia;
    }
    if (webMedia) {
      updates['webMedia'] = webMedia;
    }
    if (mobileMedia) {
      updates['mobileMedia'] = mobileMedia;
    }
    if (vttMedia) {
      updates['vttMedia'] = vttMedia;
    }

    if (webTaskArg) {
      updates['transcodeWebTask'] = {
        task_name:
          webTaskArg.task_name || uploadTask.transcodeWebTask?.task_name,
        task_id: webTaskArg.task_id || uploadTask.transcodeWebTask?.task_id,
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
        task_id:
          mobileTaskArg.task_id || uploadTask.transcodeMobileTask?.task_id,
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
        task_id:
          transcribeTaskArg.task_id || uploadTask.transcribeTask?.task_id,
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
        task_id:
          trimUploadTaskArg.task_id || uploadTask.trimUploadTask?.task_id,
        status: trimUploadTaskArg.status || uploadTask.trimUploadTask?.status,
        transcript:
          trimUploadTaskArg.transcript || uploadTask.trimUploadTask?.transcript,
        media: trimUploadTaskArg.media || uploadTask.trimUploadTask?.media,
      };
    }
    const updatedTask = await UploadTaskModel.findOneAndUpdate(
      {
        mentor: mentor._id,
        question: questionId,
      },
      {
        $set: updates,
      },
      {
        new: true,
      }
    );
    return Boolean(updatedTask);
  },
};

export default uploadTaskStatusUpdate;
