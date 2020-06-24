/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLString, GraphQLObjectType } from 'graphql';
import MentorType from 'gql/types/mentor';
import { Mentor as MentorModel } from 'models';
import { Mentor } from 'models/Mentor';
import { User } from 'models/User';

export const updateMentor = {
  type: MentorType,
  args: {
    mentor: { type: GraphQLString },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { mentor: string },
    context: { user: User }
  ): Promise<Mentor> => {
    if (!args.mentor) {
      throw new Error('missing required param mentor');
    }
    const mentor: Mentor = JSON.parse(decodeURI(args.mentor));
    if (`${context.user._id}` !== `${mentor.id}`) {
      throw new Error('you do not have permission to update this mentor');
    }
    if (!mentor.videoId.match(/^[a-z\-]+$/)) {
      throw new Error('videoId must match [a-z]');
    }
    // TODO: ensure videoId is unique

    return await MentorModel.findOneAndUpdate(
      {
        id: mentor.id,
      },
      {
        $set: {
          ...mentor,
        },
      },
      {
        new: true, // return the updated doc rather than pre update
        upsert: true,
      }
    );
  },
};

export default updateMentor;
