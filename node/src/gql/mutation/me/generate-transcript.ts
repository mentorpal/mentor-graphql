/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLString, GraphQLObjectType } from 'graphql';
import { Mentor as MentorModel } from 'models';
import { User } from 'models/User';
import { Question } from 'models/Question';

export const generateTranscript = {
  type: GraphQLString,
  args: {
    mentorId: { type: GraphQLString },
    questionId: { type: GraphQLString },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { mentorId: string; questionId: string },
    context: { user: User }
  ): Promise<string> => {
    if (!args.mentorId) {
      throw new Error('missing required param mentorId');
    }
    if (!args.questionId) {
      throw new Error('missing required param questionId');
    }
    if (`${context.user._id}` !== `${args.mentorId}`) {
      throw new Error('you do not have permission to update this mentor');
    }
    const mentor = await MentorModel.findOne({ _id: args.mentorId });
    const question = mentor.questions.find(
      (q: Question) => q.id === args.questionId
    );
    if (!question) {
      throw new Error(`no question with id ${args.questionId}`);
    }
    if (!question.video) {
      throw new Error(`no video to generate a transcript from`);
    }
    //TODO
    return 'this is a placeholder text';
  },
};

export default generateTranscript;
