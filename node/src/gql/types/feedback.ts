/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLID,
  GraphQLFloat,
} from 'graphql';
import { Answer as AnswerModel, Mentor as MentorModel } from 'models';
import { Feedback } from 'models/Feedback';
import AnswerType from './answer';
import MentorType from './mentor';

export const FeedbackType = new GraphQLObjectType({
  name: 'Feedback',
  fields: () => ({
    _id: { type: GraphQLID },
    question: { type: GraphQLString },
    confidence: { type: GraphQLFloat },
    grade: { type: GraphQLString },
    mentor: {
      type: MentorType,
      resolve: async function (feedback: Feedback) {
        return MentorModel.findOne({ _id: feedback.mentor });
      },
    },
    classifierAnswer: {
      type: AnswerType,
      resolve: async function (feedback: Feedback) {
        return AnswerModel.findOne({ _id: feedback.classifierAnswer });
      },
    },
    graderAnswer: {
      type: AnswerType,
      resolve: async function (feedback: Feedback) {
        return AnswerModel.findOne({ _id: feedback.graderAnswer });
      },
    },
  }),
});

export default FeedbackType;
