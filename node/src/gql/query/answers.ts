/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { PaginatedResolveResult } from '../types/connection';
import { Answer as AnswerModel, Mentor as MentorModel } from '../../models';
import { Answer } from '../../models/Answer';
import { Organization } from '../../models/Organization';
import { User } from '../../models/User';
import { canViewMentor } from '../../utils/check-permissions';
import AnswerType from '../types/answer';
import findAll from './find-all';
import { getUsersManagedOrgs } from '../mutation/me/helpers';

export const answers = findAll({
  nodeType: AnswerType,
  model: AnswerModel,
  filterInvalid: async (
    paginationResults: PaginatedResolveResult,
    context: { user: User; org: Organization }
  ) => {
    const mentorIds = Array.from(
      new Set(paginationResults.results.map((a: Answer) => a.mentor))
    );
    const mentors = await MentorModel.find({ _id: { $in: mentorIds } });
    const userOrgs = await getUsersManagedOrgs(context.user);
    const newAnswerResults: Answer[] = paginationResults.results.filter(
      async (a: Answer) => {
        const mentor = mentors.find((m) => `${m._id}` === `${a.mentor}`);
        if (!mentor) {
          return false;
        }
        return await canViewMentor(mentor, context.user, context.org, userOrgs);
      }
    );
    return {
      ...paginationResults,
      results: newAnswerResults,
    };
  },
});

export default answers;
