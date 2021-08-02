/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose from 'mongoose';

interface IdAndProps<T> {
  _id: string;
  props: Partial<T>;
}

interface HasId {
  _id?: string;
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
export function idOrNew(id: string): string {
  if (!Boolean(id)) {
    return `${mongoose.Types.ObjectId()}`;
  }
  return isId(id) ? id : `${mongoose.Types.ObjectId()}`;
}

export function isId(id: string): boolean {
  return Boolean(id.match(/^[0-9a-fA-F]{24}$/));
}
