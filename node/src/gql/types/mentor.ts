/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLList,
  GraphQLID,
} from 'graphql';
import { Answer as AnswerModel, Mentor as MentorModel } from 'models';
import { Answer, Status } from 'models/Answer';
import { Mentor } from 'models/Mentor';
import DateType from './date';
import AnswerType from './answer';
import SubjectType from './subject';

export const MentorType = new GraphQLObjectType({
  name: 'Mentor',
  fields: () => ({
    _id: { type: GraphQLID },
    name: { type: GraphQLString },
    firstName: { type: GraphQLString },
    title: { type: GraphQLString },
    lastTrainedAt: { type: DateType },
    mentorType: { type: GraphQLString },
    subjects: {
      type: GraphQLList(SubjectType),
      resolve: async function (mentor: Mentor) {
        return await MentorModel.getSubjects(mentor);
      },
    },
    topics: {
      type: GraphQLList(SubjectType),
      args: {
        subject: { type: GraphQLID },
      },
      resolve: async function (mentor: Mentor, args: { subject: string }) {
        return await MentorModel.getTopics(mentor, args.subject);
      },
    },
    answers: {
      type: GraphQLList(AnswerType),
      args: {
        subject: { type: GraphQLID },
        topic: { type: GraphQLID },
      },
      resolve: async function (
        mentor: Mentor,
        args: { subject: string; topic: string }
      ) {
        const questions = await MentorModel.getQuestions(
          mentor,
          args.subject,
          args.topic
        );
        const questionIds = questions.map((q) => q._id);
        const answers: Answer[] = await AnswerModel.find({
          mentor: mentor._id,
          question: { $in: questionIds },
        });
        answers.sort((a: Answer, b: Answer) => {
          return (
            questionIds.indexOf(a.question._id) -
            questionIds.indexOf(b.question._id)
          );
        });
        const answersByQid = answers.reduce(
          (acc: Record<string, Answer>, cur) => {
            acc[`${cur.question}`] = cur;
            return acc;
          },
          {}
        );
        const answerResult = questionIds.map((qid) => {
          return (
            answersByQid[`${qid}`] || {
              mentor: mentor._id,
              question: qid,
              status: Status.INCOMPLETE,
              transcript: '',
              video: '',
            }
          );
        });
        return answerResult;
      },
    },
  }),
});

export default MentorType;
