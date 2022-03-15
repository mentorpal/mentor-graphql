/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/

import { Mentor as MentorModel } from 'models';
import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLNonNull,
} from 'graphql';
import { Status } from 'models/Answer';

const categoryAnswerResponse = new GraphQLObjectType({
  name: 'categoryAnswerResponse',
  fields: {
    answerText: { type: GraphQLString },
    questionText: { type: GraphQLString },
  },
});

export const categoryAnswers = {
  type: GraphQLList(categoryAnswerResponse),
  args: {
    category: { type: GraphQLNonNull(GraphQLString) },
    mentor: { type: GraphQLNonNull(GraphQLID) },
  },
  resolve: async (
    _: GraphQLObjectType,
    args: { category: string; mentor: string }
  ) => {
    const mentor = await MentorModel.findOne({
      _id: args.mentor,
    });
    const answers = await MentorModel.getAnswers({
      mentor: mentor,
      status: Status.COMPLETE,
      categoryId: args.category,
    });
    const questions = await MentorModel.getQuestions({
      mentor: mentor,
      categoryId: args.category,
    });
    return answers.map((a) => {
      return {
        questionText: questions.find(
          (q) => JSON.stringify(q.question._id) == JSON.stringify(a.question)
        )?.question.question,
        answerText: a.transcript,
      };
    });
  },
};

export default categoryAnswers;
