/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLID,
  GraphQLList,
  GraphQLString,
} from 'graphql';
import { ImportTask as ImportTaskModel } from '../../../models';
import {
  GraphQLUpdateProps,
  s3VideoMigrateProps,
} from '../../../models/ImportTask';
import {
  GraphQLUpdateInputType,
  S3VideoMigrationInputType,
} from './import-task-create';

export const importTaskUpdate = {
  type: GraphQLBoolean,
  args: {
    mentor: { type: GraphQLNonNull(GraphQLID) },
    graphQLUpdate: { type: GraphQLUpdateInputType },
    s3VideoMigrateUpdate: { type: S3VideoMigrationInputType },
    migrationErrors: { type: GraphQLList(GraphQLString) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      mentor: string;
      graphQLUpdate: GraphQLUpdateProps;
      s3VideoMigrateUpdate: s3VideoMigrateProps;
      migrationErrors: string[];
    }
  ): Promise<boolean> => {
    const importTask = await ImportTaskModel.findOne({ mentor: args.mentor });
    if (!importTask) {
      throw new Error(`Failed to find import task for mentor: ${args.mentor}`);
    }

    if (args.graphQLUpdate) {
      importTask.graphQLUpdate.status = args.graphQLUpdate.status;
      importTask.graphQLUpdate.errorMessage = args.graphQLUpdate.errorMessage;
    }

    if (args.s3VideoMigrateUpdate) {
      importTask.s3VideoMigrate.status = args.s3VideoMigrateUpdate.status;
      importTask.s3VideoMigrate.errorMessage =
        args.s3VideoMigrateUpdate.errorMessage;
    }

    const save = await ImportTaskModel.findOneAndUpdate(
      { mentor: args.mentor },
      {
        graphQLUpdate: importTask.graphQLUpdate,
        s3VideoMigrate: importTask.s3VideoMigrate,
        migrationErrors: args.migrationErrors || [],
      }
    );
    return Boolean(save);
  },
};

export default importTaskUpdate;
