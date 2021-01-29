/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLList,
  GraphQLBoolean,
  GraphQLID,
} from 'graphql';
import {
  Answer as AnswerModel,
  Question as QuestionModel,
  Subject as SubjectModel,
} from 'models';
import { Answer, Status } from 'models/Answer';
import { Mentor } from 'models/Mentor';
import { Subject } from 'models/Subject';
import mongoose from 'mongoose';
import DateType from './date';
import AnswerType from './answer';
import QuestionType from './question';
import SubjectType from './subject';

export const MentorType = new GraphQLObjectType({
  name: 'Mentor',
  fields: () => ({
    _id: { type: GraphQLID },
    name: { type: GraphQLString },
    firstName: { type: GraphQLString },
    title: { type: GraphQLString },
    isBuilt: { type: GraphQLBoolean },
    lastTrainedAt: { type: DateType },
    answers: {
      type: GraphQLList(AnswerType),
      resolve: async function (parent: {
        _id: mongoose.Types.ObjectId;
        subjects: Subject['_id'][];
      }) {
        const questionIds = (
          (await SubjectModel.find({
            _id: { $in: parent.subjects },
          })) || []
        ).reduce((acc: mongoose.Types.ObjectId[], cur) => {
          return [...acc, ...(cur.questions || [])];
        }, []);
        const answers = await AnswerModel.find({
          mentor: parent._id,
          question: { $in: questionIds },
        });
        const answersByQid = answers.reduce(
          (acc: Record<string, Answer>, cur) => {
            acc[`${cur.question}`] = cur;
            return acc;
          },
          {}
        );
        const answerResult = questionIds.map((qid, i) => {
          return (
            answersByQid[`${qid}`] || {
              mentor: parent._id,
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
    subjects: {
      type: GraphQLList(SubjectType),
      resolve: async function (mentor: Mentor) {
        const resolveSubjects = async (id: string) => {
          return await SubjectModel.findOne({ _id: id });
        };
        return Promise.all(
          mentor.subjects.map((s: string) => resolveSubjects(s))
        );
      },
    },
    questions: {
      type: GraphQLList(QuestionType),
      resolve: async function (mentor: Mentor) {
        return mentor.questions;
      },
    },
  }),
});

export default MentorType;
