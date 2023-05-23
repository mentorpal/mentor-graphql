/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  Mentor,
  OrgViewPermissionType,
  OrgEditPermissionType,
} from '../models/Mentor';
import OrganizationModel, { Organization } from '../models/Organization';
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

export async function canEditMentorPanel(
  user: User,
  mentorPanelOrg?: string
): Promise<boolean> {
  if (canEditContent(user)) {
    return true;
  }
  if (mentorPanelOrg) {
    const org = await OrganizationModel.findById(mentorPanelOrg);
    if (
      org &&
      org.members.find(
        (m) =>
          equals(m.user, user._id) &&
          (m.role === UserRole.CONTENT_MANAGER || m.role === UserRole.ADMIN)
      )
    ) {
      return true;
    }
  }
  return false;
}

export function canViewMentor(
  mentor: Mentor,
  user: User,
  org?: Organization
): boolean {
  if (!mentor) {
    return false;
  }
  const orgPerm = mentor.orgPermissions?.find((op) => equals(op.org, org?._id));
  if (orgPerm && orgPerm.viewPermission === OrgViewPermissionType.HIDDEN) {
    return false;
  }
  if (mentor.isPrivate) {
    if (orgPerm && orgPerm.viewPermission === OrgViewPermissionType.SHARE) {
      return true;
    }
    if (!user) {
      return false;
    }
    const userRole = user.userRole;
    return (
      equals(mentor.user, user._id) ||
      user.mentorIds.includes(mentor.user) ||
      userRole === UserRole.CONTENT_MANAGER ||
      userRole === UserRole.ADMIN ||
      userRole === UserRole.SUPER_CONTENT_MANAGER ||
      userRole === UserRole.SUPER_ADMIN
    );
  }
  return true;
}

export async function canEditMentor(
  mentor: Mentor,
  user: User
): Promise<boolean> {
  if (!mentor || !user) {
    return false;
  }
  const ops = mentor.orgPermissions?.filter(
    (op) =>
      op.editPermission === OrgEditPermissionType.MANAGE ||
      op.editPermission === OrgEditPermissionType.ADMIN
  );
  if (ops) {
    const orgs = await OrganizationModel.find({
      _id: { $in: ops.map((op) => op.org) },
    });
    for (const org of orgs) {
      if (
        org.members.find(
          (m) =>
            equals(m.user, user._id) &&
            (m.role === UserRole.ADMIN || m.role === UserRole.CONTENT_MANAGER)
        )
      ) {
        return true;
      }
    }
  }
  const userRole = user.userRole;
  return (
    equals(mentor.user, user._id) ||
    user.mentorIds.includes(mentor.user) ||
    userRole === UserRole.CONTENT_MANAGER ||
    userRole === UserRole.ADMIN ||
    userRole === UserRole.SUPER_CONTENT_MANAGER ||
    userRole === UserRole.SUPER_ADMIN
  );
}

export async function canEditMentorPrivacy(
  mentor: Mentor,
  user: User
): Promise<boolean> {
  if (!mentor || !user) {
    return false;
  }
  const ops = mentor.orgPermissions?.filter(
    (op) => op.editPermission === OrgEditPermissionType.ADMIN
  );
  if (ops) {
    const orgs = await OrganizationModel.find({
      _id: { $in: ops.map((op) => op.org) },
    });
    for (const org of orgs) {
      if (
        org.members.find(
          (m) => equals(m.user, user._id) && m.role === UserRole.ADMIN
        )
      ) {
        return true;
      }
    }
  }
  const userRole = user.userRole;
  return (
    equals(mentor.user, user._id) ||
    user.mentorIds.includes(mentor.user) ||
    userRole === UserRole.CONTENT_MANAGER ||
    userRole === UserRole.ADMIN ||
    userRole === UserRole.SUPER_CONTENT_MANAGER ||
    userRole === UserRole.SUPER_ADMIN
  );
}

export function canViewOrganization(
  org: Organization,
  user: User,
  orgAccessCode?: string
): boolean {
  if (!org) {
    return false;
  }
  if (org.isPrivate) {
    if (orgAccessCode && org.accessCodes.includes(orgAccessCode)) {
      return true;
    }
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
