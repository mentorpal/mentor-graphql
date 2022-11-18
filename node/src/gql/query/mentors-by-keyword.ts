/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';

import { Mentor as MentorModel } from '../../models';
import { Mentor } from '../../models/Mentor';
import { User } from '../../models/User';
import { MentorType } from '../types/mentor';
import { canViewMentor } from '../../utils/check-permissions';

export const mentorsByKeyword = {
  type: GraphQLList(MentorType),
  args: {
    subject: { type: GraphQLID },
    keywords: { type: GraphQLList(GraphQLID) },
    sortBy: { type: GraphQLString },
    sortAscending: { type: GraphQLBoolean },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      subject: string;
      keywords: string[];
      sortBy: string;
      sortAscending: boolean;
    },
    context: { user: User }
  ): Promise<Mentor[]> => {
    const filter = args.subject ? { subjects: { $in: [args.subject] } } : {};
    let mentors = await MentorModel.find(filter);
    mentors = mentors.filter((m) => canViewMentor(m, context.user));
    if (args.sortBy) {
      mentors = mentors.sort((a, b) => {
        return (
          b.get(args.sortBy).localeCompare(a.get(args.sortBy)) *
          (args.sortAscending ? -1 : 1)
        );
      });
    }
    if (args.keywords && args.keywords.length > 0) {
      mentors = mentors.sort((a, b) => {
        const matchA = a.keywords.filter((k) =>
          args.keywords.includes(`${k}`)
        ).length;
        const matchB = b.keywords.filter((k) =>
          args.keywords.includes(`${k}`)
        ).length;
        return matchB - matchA;
      });
    }
    return mentors;
  },
};

export default mentorsByKeyword;
