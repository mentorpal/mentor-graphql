/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLObjectType, GraphQLID, GraphQLScalarType } from 'graphql';
import { Types } from 'mongoose';
import { HasFindOne } from '../types/mongoose-type-helpers';
import { User } from '../../models/User';

export interface ArgsConfig {
  [name: string]: {
    description: string;
    type: GraphQLScalarType | GraphQLObjectType;
  };
}

function toObjectIdOrThrow(id: string, argName: string): Types.ObjectId {
  try {
    return new Types.ObjectId(`${id}`);
  } catch (err) {
    throw new Error(`failed to parse arg '${argName}': ${err.message}`);
  }
}

export function findOne<T>(config: {
  type: GraphQLObjectType;
  model: HasFindOne<T>;
  typeName: string;
  argsConfig?: ArgsConfig;
  disableAutoIdArg?: boolean;
  disableExceptionOnNotFound?: boolean;
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  checkIfInvalid?: (val: any, context: any) => Promise<void>;
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
}): any {
  const {
    argsConfig,
    disableAutoIdArg,
    disableExceptionOnNotFound,
    model,
    type,
    typeName,
  } = config;
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  const argsConfEffective: any = {
    ...(disableAutoIdArg
      ? {}
      : {
          id: {
            description: `id of the ${typeName}`,
            type: GraphQLID,
          },
        }),
    ...(argsConfig || {}),
  };
  return {
    type,
    args: argsConfEffective,
    resolve: async (
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      parent: any,
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      args: any,
      context: { user: User }
    ): Promise<T> => {
      console.log('findOne start');
      console.time('findOne');
      const mArgs = Object.getOwnPropertyNames(args).reduce(
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        (acc: any, cur: string) => {
          if (cur === 'id') {
            acc._id = toObjectIdOrThrow(args[cur], cur);
          } else {
            acc[cur] =
              argsConfEffective[cur] &&
              argsConfEffective[cur].type === GraphQLID
                ? toObjectIdOrThrow(args[cur], cur)
                : args[cur];
          }
          return acc;
        },
        {}
      );
      const filter = Object.assign({}, mArgs, {
        $or: [{ deleted: false }, { deleted: null }],
      });
      const item = await model.findOne(filter).exec();
      if (!item && !disableExceptionOnNotFound) {
        throw new Error(
          `${typeName} not found for args "${JSON.stringify(args)}"`
        );
      }
      if (config.checkIfInvalid !== undefined) {
        await config.checkIfInvalid(item, context);
      }
      console.timeEnd('findOne');
      return item;
    },
  };
}

export default findOne;
