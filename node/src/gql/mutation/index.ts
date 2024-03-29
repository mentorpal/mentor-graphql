/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLObjectType } from 'graphql';
import api from './api';
import me from './me';
import login from './login';
import loginGoogle from './login-google';
import logout from './logout';
import updateMentorTraining from './update-mentor-training';
import userQuestionCreate from './userQuestion-create';
import userQuestionSetFeedback from './userQuestion-setFeedback';
import userQuestionSetAnswer from './userQuestion-setAnswer';
import mentorPreviewed from './mentor-previewed';
import refreshAccessToken from './refresh-access-token';

export default new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    api,
    me,
    login,
    loginGoogle,
    logout,
    updateMentorTraining,
    userQuestionCreate,
    userQuestionSetFeedback,
    userQuestionSetAnswer,
    mentorPreviewed,
    refreshAccessToken,
  },
});
