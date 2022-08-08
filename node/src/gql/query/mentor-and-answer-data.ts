/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
} from 'graphql';

import { Mentor as MentorModel, Answer as AnswerModel } from '../../models';
import { Mentor } from '../../models/Mentor';
import { Answer } from '../../models/Answer';
import { MentorType } from '../types/mentor';
import { AnswerType } from '../types/answer';

export interface MentorAndAnswerDataInterface {
  mentor: Mentor;
  answers: Answer[];
}

export const MentorAndAnswerDataType = new GraphQLObjectType({
  name: 'MentorAndAnswerData',
  fields: () => ({
    mentor: { type: MentorType },
    answers: { type: GraphQLList(AnswerType) },
  }),
});

export const mentorAndAnswerData = {
  type: MentorAndAnswerDataType,
  args: {
    mentorId: { type: GraphQLNonNull(GraphQLID) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { mentorId: string }
  ): Promise<MentorAndAnswerDataInterface> => {
    const mentor = await MentorModel.findOne({ _id: args.mentorId });
    const answers = await AnswerModel.find({ mentor: args.mentorId });
    return {
      mentor: mentor,
      answers: answers,
    };
  },
};

export default mentorAndAnswerData;
