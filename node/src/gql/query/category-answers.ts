/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/

import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLNonNull,
} from 'graphql';
import { Organization } from '../../models/Organization';
import { User } from '../../models/User';
import { canViewMentor } from '../../utils/check-permissions';
import { Mentor as MentorModel } from '../../models';
import { Status } from '../../models/Answer';

const categoryAnswerResponse = new GraphQLObjectType({
  name: 'categoryAnswerResponse',
  fields: {
    answerText: { type: GraphQLString },
    questionText: { type: GraphQLString },
  },
});

export const categoryAnswers = {
  type: new GraphQLList(categoryAnswerResponse),
  args: {
    category: { type: new GraphQLNonNull(GraphQLString) },
    mentor: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: async (
    _: GraphQLObjectType,
    args: { category: string; mentor: string },
    context: { user: User; org: Organization }
  ) => {
    const mentor = await MentorModel.findById(args.mentor);
    if (!(await canViewMentor(mentor, context.user, context.org))) {
      throw new Error(
        `mentor is private and you do not have permission to access`
      );
    }
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
        questionText:
          a.question.question ||
          questions.find(
            (q) => JSON.stringify(q.question._id) == JSON.stringify(a.question)
          )?.question.question,
        answerText: a.transcript,
      };
    });
  },
};

export default categoryAnswers;
