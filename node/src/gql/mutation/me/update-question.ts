/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLString, GraphQLObjectType } from 'graphql';
import MentorType from 'gql/types/mentor';
import { Mentor as MentorModel } from 'models';
import { Mentor } from 'models/Mentor';
import { Question } from 'models/Question';
import { User } from 'models/User';

export const updateQuestion = {
  type: MentorType,
  args: {
    mentorId: { type: GraphQLString },
    question: { type: GraphQLString },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { mentorId: string; question: string },
    context: { user: User }
  ): Promise<Mentor> => {
    if (!args.mentorId) {
      throw new Error('missing required param mentorId');
    }
    if (!args.question) {
      throw new Error('missing required param question');
    }
    if (`${context.user._id}` !== `${args.mentorId}`) {
      throw new Error('you do not have permission to update this mentor');
    }
    const mentor: Mentor = await MentorModel.findOne({ id: args.mentorId });
    const question: Question = JSON.parse(decodeURI(args.question));
    const isUtterance = question.videoId.startsWith('U');
    const idx = isUtterance
      ? mentor.utterances.findIndex(
          (u: Question) => u.videoId === question.videoId
        )
      : mentor.questions.findIndex(
          (q: Question) => q.videoId === question.videoId
        );
    if (isUtterance) {
      if (idx === -1) {
        mentor.utterances.push(question);
      } else {
        mentor.utterances.splice(idx, 1, question);
      }
    } else {
      if (idx === -1) {
        mentor.questions.push(question);
      } else {
        mentor.questions.splice(idx, 1, question);
      }
    }

    return await MentorModel.findOneAndUpdate(
      {
        id: context.user._id,
      },
      {
        $set: {
          questions: mentor.questions,
          utterances: mentor.utterances,
        },
      },
      {
        new: true, // return the updated doc rather than pre update
        upsert: true,
      }
    );
  },
};

export default updateQuestion;
