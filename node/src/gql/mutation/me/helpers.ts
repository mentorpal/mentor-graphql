/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { ManagedOrg, User, UserRole } from '../../../models/User';
import OrganizationModel from '../../../models/Organization';
import { Types } from 'mongoose';
import { equals } from '../../../utils/check-permissions';

interface IdAndProps<T> {
  _id: Types.ObjectId;
  props: Partial<T>;
}

interface HasId {
  _id?: Types.ObjectId;
}

export function toUpdateProps<T extends HasId>(
  update: Partial<T>,
  idKeyName = '_id'
): IdAndProps<T> {
  return {
    _id: idOrNew(update._id),
    props: Object.getOwnPropertyNames(update).reduce(
      (acc: Partial<T>, cur: string) => {
        if (cur !== idKeyName) {
          acc[cur as keyof T] = update[cur as keyof T];
        }
        return acc;
      },
      {}
    ),
  };
}

// check if id is a valid ObjectID:
//  - if valid, return it
//  - if invalid, create a valid object id
export function idOrNew(id: string | Types.ObjectId): Types.ObjectId {
  if (!Boolean(id)) {
    return new Types.ObjectId();
  }
  return isId(id) ? new Types.ObjectId(id) : new Types.ObjectId();
}

export function isId(id: string | Types.ObjectId): boolean {
  return Boolean(id.toString().match(/^[0-9a-fA-F]{24}$/));
}

export enum UseDefaultTopics {
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  DEFAULT = 'DEFAULT',
}

export function userIsManagerOrAdmin(role: string) {
  return (
    role === UserRole.CONTENT_MANAGER ||
    role === UserRole.ADMIN ||
    role === UserRole.SUPER_CONTENT_MANAGER ||
    role === UserRole.SUPER_ADMIN
  );
}

export async function getUsersManagedOrgs(user?: User): Promise<ManagedOrg[]> {
  if (!user) {
    return [];
  }
  const orgs = await OrganizationModel.find({
    members: {
      $elemMatch: {
        user: user._id,
        role: { $in: [UserRole.ADMIN, UserRole.CONTENT_MANAGER] },
      },
    },
  });
  return orgs.map((org) => ({
    orgId: org._id.toString(),
    role:
      org.members.find((m) => equals(m.user, user._id))?.role || 'NOT_FOUND',
  }));
}

export async function asyncFilter<T>(
  array: T[],
  predicate: (value: T) => Promise<boolean>
): Promise<T[]> {
  const results = await Promise.all(array.map(predicate));
  return array.filter((_, index) => results[index]);
}
