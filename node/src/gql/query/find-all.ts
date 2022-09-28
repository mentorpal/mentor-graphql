/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLObjectType } from 'graphql';
import {
  makeConnection,
  PaginatedResolveArgs,
  PaginatedResolveResult,
} from '../types/connection';
import { HasPaginate } from '../types/mongoose-type-helpers';
import mongoose from 'mongoose';

// Recursively attempts to convert strings to object ids
// eslint-disable-next-line  @typescript-eslint/no-explicit-any
function convertStringsToObjectIds(filter: any) {
  if (!filter) {
    return filter;
  }
  if (typeof filter === 'string') {
    try {
      return mongoose.Types.ObjectId(filter);
    } catch (err) {
      return filter;
    }
  } else if (Array.isArray(filter)) {
    for (let i = 0; i < filter.length; i++) {
      const value2 = filter[i];
      filter[i] = convertStringsToObjectIds(value2);
    }
  } else if (typeof filter === 'object') {
    const keys = Object.keys(filter);
    for (let i = 0; i < keys.length; i++) {
      filter[keys[i]] = convertStringsToObjectIds(filter[keys[i]]);
    }
  }
  return filter;
}

export function findAll<T extends PaginatedResolveResult>(config: {
  nodeType: GraphQLObjectType;
  model: HasPaginate<T>;
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  filterInvalid?: (val: PaginatedResolveResult, context: any) => Promise<T> | T;
}): any {
  const { nodeType, model } = config;
  return makeConnection({
    nodeType,
    resolve: async (resolveArgs: PaginatedResolveArgs) => {
      const { args } = resolveArgs;
      let filter = Object.assign({}, args.filter || {});

      filter = convertStringsToObjectIds(filter);

      const cursor = args.cursor;
      let next = null;
      let prev = null;
      if (cursor) {
        if (cursor.startsWith('prev__')) {
          prev = cursor.split('prev__')[1];
        } else if (cursor.startsWith('next__')) {
          next = cursor.split('next__')[1];
        } else {
          next = cursor;
        }
      }
      if (Object.keys(filter).length > 0) {
        filter = {
          $and: [filter, { $or: [{ deleted: false }, { deleted: null }] }],
        };
      } else {
        filter = {
          $or: [{ deleted: false }, { deleted: null }],
        };
      }
      const result = await model.paginate({
        query: filter,
        limit: Number(args.limit) || 100,
        paginatedField: args.sortBy || '_id',
        sortAscending: args.sortAscending,
        next: next,
        previous: prev,
      });
      if (config.filterInvalid !== undefined) {
        return config.filterInvalid(result, resolveArgs.context);
      }
      return result;
    },
  });
}

export default findAll;
