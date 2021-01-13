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

export const uploadVideo = {
  type: MentorType,
  args: {
    mentorId: { type: GraphQLString },
    questionId: { type: GraphQLString },
    video: { type: GraphQLString },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { mentorId: string; questionId: string; video: string },
    context: { user: User }
  ): Promise<Mentor> => {
    if (!args.mentorId) {
      throw new Error('missing required param mentorId');
    }
    if (!args.questionId) {
      throw new Error('missing required param questionId');
    }
    if (!args.video) {
      throw new Error('missing required param video');
    }
    if (`${context.user._id}` !== `${args.mentorId}`) {
      throw new Error('you do not have permission to update this mentor');
    }
    const mentor = await MentorModel.findOne({ _id: args.mentorId });
    const idx = mentor.questions.findIndex(
      (q: Question) => q.id === args.questionId
    );
    if (idx === -1) {
      throw new Error(`no question with id ${args.questionId}`);
    }
    //TODO
    mentor.questions[idx].video =
      'https://video.mentorpal.org/videos/mentors/clint/web/clintanderson_U1_1_1.mp4';
    return await MentorModel.findOneAndUpdate(
      {
        _id: args.mentorId,
      },
      {
        $set: {
          questions: mentor.questions,
        },
      },
      {
        new: true,
      }
    );
  },
};

export default uploadVideo;
