/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { Mentor as MentorModel } from '../../models';
import { Mentor } from '../../models/Mentor';
import { Organization } from '../../models/Organization';
import { User } from '../../models/User';
import { canViewMentor } from '../../utils/check-permissions';
import { MentorType } from '../types/mentor';
import findByParentField from './find-by-parent-field';
import findOne from './find-one';

export const mentorFindOne = findOne({
  model: MentorModel,
  type: MentorType,
  typeName: 'mentor',
  checkIfInvalid: async (
    mentor: Mentor,
    context: { user: User; org: Organization }
  ) => {
    console.time('canViewMentor');
    if (!(await canViewMentor(mentor, context.user, context.org))) {
      console.timeEnd('canViewMentor');
      throw new Error(
        `mentor is private and you do not have permission to access`
      );
    }
    console.timeEnd('canViewMentor');
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mentorFieldWithName(field = 'mentor'): any {
  return findByParentField(MentorType, MentorModel, field);
}

export const mentorField = mentorFieldWithName();

export default mentorFindOne;
