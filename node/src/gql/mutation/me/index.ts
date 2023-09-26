/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLObjectType } from 'graphql';
import { User } from '../../../models/User';
import mentorImport from './mentor-import';
import deleteMentorPanel from './mentor-panel-delete';
import addOrUpdateMentorPanel from './mentor-panel-add-or-update';
import addOrUpdateOrganization from './organization-add-or-update';
import updateConfig from './config-update';
import updateMentorDetails from './mentor-details-update';
import updateMentorPrivacy from './mentor-update-privacy';
import updateMentorSubjects from './mentor-subjects-update';
import updateMentorKeywords from './mentor-keywords-update';
import updateAnswerUrl from './mentor-answer-url-update';
import updateOrgConfig from './organization-config-update';
import updateAnswer from './answer-update';
import updateQuestion from './question-update';
import updateKeyword from './keyword-update';
import subjectUpdate from './subject-update';
import subjectAddOrUpdateQuestions from './subject-add-or-update-questions';
import uploadTaskDelete from './upload-task-delete';
import updateUserPermissions from './user-permissions-update';
import importTaskDelete from './import-task-delete';
import firstTimeTrackingUpdate from './first-time-tracking-update';
import addQuestionToRecordQueue from './add-question-to-record-queue';
import removeQuestionFromRecordQueue from './remove-question-from-record-queue';
import setRecordQueue from './set-record-queue';
import userQuestionSetDismissed from './userQuestion-setDismissed';
import setMentorAdvanced from './mentor-set-advanced';
import disableUser from './user-disable';
import mentorTrainTaskAddOrUpdate from './mentor-train-task-add-or-update';
import updateMentorPublicApproval from './mentor-public-approval';
import mentorConfigCreateUpdate from './create-mentor-config';
import setMentorConfigLock from './set-mentor-config-lock';

export const Me: GraphQLObjectType = new GraphQLObjectType({
  name: 'MeMutation',
  fields: () => ({
    mentorImport,
    deleteMentorPanel,
    addOrUpdateMentorPanel,
    addOrUpdateOrganization,
    updateConfig,
    updateMentorDetails,
    updateMentorPrivacy,
    updateMentorSubjects,
    updateMentorKeywords,
    updateOrgConfig,
    updateAnswer,
    updateQuestion,
    updateKeyword,
    updateSubject: subjectUpdate,
    subjectAddOrUpdateQuestions,
    uploadTaskDelete,
    updateUserPermissions,
    importTaskDelete,
    firstTimeTrackingUpdate,
    addQuestionToRecordQueue,
    removeQuestionFromRecordQueue,
    setRecordQueue,
    userQuestionSetDismissed,
    setMentorAdvanced,
    disableUser,
    updateAnswerUrl,
    mentorTrainTaskAddOrUpdate,
    updateMentorPublicApproval,
    mentorConfigCreateUpdate,
    setMentorConfigLock,
  }),
});

export const me = {
  type: Me,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve: (_: any, args: any, context: { user: User }): { user: User } => {
    if (!context.user) {
      throw new Error('Only authenticated users');
    }
    return {
      user: context.user,
    };
  },
};

export default me;
