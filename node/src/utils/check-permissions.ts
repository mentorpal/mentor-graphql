/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { Mentor } from '../models/Mentor';
import { Organization } from '../models/Organization';
import { User, UserRole } from '../models/User';

function equals(a: string, b: string): boolean {
  return `${a}` === `${b}`;
}

export function canEditContent(user: User): boolean {
  if (!user) {
    return false;
  }
  const userRole = user.userRole;
  return (
    userRole === UserRole.CONTENT_MANAGER ||
    userRole === UserRole.ADMIN ||
    userRole === UserRole.SUPER_CONTENT_MANAGER ||
    userRole === UserRole.SUPER_ADMIN
  );
}

export function canViewMentor(mentor: Mentor, user: User): boolean {
  if (!mentor) {
    return false;
  }
  if (mentor.isPrivate) {
    if (!user) {
      return false;
    }
    const userRole = user.userRole;
    return (
      equals(mentor.user, user._id) ||
      userRole === UserRole.CONTENT_MANAGER ||
      userRole === UserRole.ADMIN ||
      userRole === UserRole.SUPER_CONTENT_MANAGER ||
      userRole === UserRole.SUPER_ADMIN
    );
  }
  return true;
}

export function canEditMentor(mentor: Mentor, user: User): boolean {
  if (!mentor || !user) {
    return false;
  }
  const userRole = user.userRole;
  return (
    equals(mentor.user, user._id) ||
    userRole === UserRole.CONTENT_MANAGER ||
    userRole === UserRole.ADMIN ||
    userRole === UserRole.SUPER_CONTENT_MANAGER ||
    userRole === UserRole.SUPER_ADMIN
  );
}

export function canViewOrganization(org: Organization, user: User): boolean {
  if (!org) {
    return false;
  }
  if (org.isPrivate) {
    if (!user) {
      return false;
    }
    if (
      user.userRole === UserRole.SUPER_ADMIN ||
      user.userRole === UserRole.SUPER_CONTENT_MANAGER
    ) {
      return true;
    }
    return Boolean(org.members.find((m) => equals(m.user, user._id)));
  }
  return true;
}

export function canEditOrganization(org: Organization, user: User): boolean {
  if (!org || !user) {
    return false;
  }
  if (
    user.userRole === UserRole.SUPER_ADMIN ||
    user.userRole === UserRole.SUPER_CONTENT_MANAGER
  ) {
    return true;
  }
  return Boolean(
    org.members.find(
      (m) =>
        equals(m.user, user._id) &&
        (m.role === UserRole.CONTENT_MANAGER || m.role === UserRole.ADMIN)
    )
  );
}
