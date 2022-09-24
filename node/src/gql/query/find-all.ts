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

// Part of our custom query language:
// Conditional OR and AND are converted to mongoose friendly $or and $and, recursively
// eslint-disable-next-line  @typescript-eslint/no-explicit-any
function convertFilterConditionals(object: any) {
  if (!object) {
    return object;
  }
  if ('OR' in object) {
    if ('$or' in object) {
      object['$or'].push(...object['OR']);
    } else {
      object['$or'] = object['OR'];
    }
    delete object['OR'];
  }
  if ('AND' in object) {
    if ('$and' in object) {
      object['$and'].push(...object['AND']);
    } else {
      object['$and'] = object['AND'];
    }
    object['$and'] = object['AND'];
    delete object['AND'];
  }
  const keys = Object.keys(object);
  for (let i = 0; i < keys.length; i++) {
    const value = object[keys[i]];
    if (typeof value === 'object') {
      object[keys[i]] = convertFilterConditionals(value);
    } else if (Array.isArray(value)) {
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      object[keys[i]] = value.map((val: any) => {
        return convertFilterConditionals(val);
      });
    }
  }
  return object;
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
      Object.keys(filter).map((key) => {
        if (typeof filter[key] === 'string') {
          try {
            filter[key] = {
              $in: [filter[key], mongoose.Types.ObjectId(filter[key])],
            };
          } catch (err) {}
        }
      });
      filter = convertFilterConditionals(filter);
      // Enforce that the document has not been deleted
      if (Object.keys(filter).length > 0) {
        filter = {
          $and: [filter, { $or: [{ deleted: false }, { deleted: null }] }],
        };
      } else {
        filter = {
          $or: [{ deleted: false }, { deleted: null }],
        };
      }

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
