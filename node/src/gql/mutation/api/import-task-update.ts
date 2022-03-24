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
} from 'graphql';
import { ImportTask as ImportTaskModel } from 'models';
import {
  AnswerMediaMigrateUpdateProps,
  GraphQLUpdateProps,
  s3VideoMigrateProps,
} from 'models/ImportTask';
import {
  AnswerMediaMigrationInputType,
  GraphQLUpdateInputType,
  S3VideoMigrationInputType,
} from './import-task-create';

export const importTaskUpdate = {
  type: GraphQLBoolean,
  args: {
    mentor: { type: GraphQLNonNull(GraphQLID) },
    graphQLUpdate: { type: GraphQLUpdateInputType },
    s3VideoMigrateUpdate: { type: S3VideoMigrationInputType },
    answerMediaMigrateUpdate: { type: AnswerMediaMigrationInputType },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      mentor: string;
      graphQLUpdate: GraphQLUpdateProps;
      s3VideoMigrateUpdate: s3VideoMigrateProps;
      answerMediaMigrateUpdate: AnswerMediaMigrateUpdateProps;
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
      if (args.s3VideoMigrateUpdate.status) {
        importTask.s3VideoMigrate.status = args.s3VideoMigrateUpdate.status;
      }
      if (args.s3VideoMigrateUpdate.answerMediaMigrations) {
        importTask.s3VideoMigrate.answerMediaMigrations =
          args.s3VideoMigrateUpdate.answerMediaMigrations;
      }
    }

    if (args.answerMediaMigrateUpdate) {
      const question = args.answerMediaMigrateUpdate.question;
      const answerMigrationTasks =
        importTask.s3VideoMigrate.answerMediaMigrations;
      const answerMigrationTaskIndex = answerMigrationTasks.findIndex(
        (task) => task.question === question
      );
      if (answerMigrationTaskIndex === -1) {
        throw new Error(
          `Failed to find answer media migration task for question id: ${question}`
        );
      }
      importTask.s3VideoMigrate.answerMediaMigrations[
        answerMigrationTaskIndex
      ].status = args.answerMediaMigrateUpdate.status;
      importTask.s3VideoMigrate.answerMediaMigrations[
        answerMigrationTaskIndex
      ].errorMessage = args.answerMediaMigrateUpdate.errorMessage;
    }

    // automatically sets the status for the migration depending on the status of all the media transfers
    importTask.s3VideoMigrate.status = !importTask.s3VideoMigrate
      .answerMediaMigrations.length
      ? importTask.s3VideoMigrate.status
      : Boolean(
          importTask.s3VideoMigrate.answerMediaMigrations.find(
            (migration) =>
              migration.status !== 'DONE' && migration.status !== 'FAILED'
          )
        )
      ? 'IN_PROGRESS'
      : 'DONE';

    const save = await ImportTaskModel.findOneAndUpdate(
      { mentor: args.mentor },
      {
        graphQLUpdate: importTask.graphQLUpdate,
        s3VideoMigrate: importTask.s3VideoMigrate,
      }
    );
    return Boolean(save);
  },
};

export default importTaskUpdate;
