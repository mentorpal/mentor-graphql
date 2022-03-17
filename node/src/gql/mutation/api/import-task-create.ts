/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLList,
} from 'graphql';
import { ImportTask as ImportTaskModel } from 'models';
import { GraphQLUpdateProps, s3VideoMigrateProps } from 'models/ImportTask';

export const GraphQLUpdateInputType = new GraphQLInputObjectType({
  name: 'GraphQLUpdateInputType',
  fields: {
    status: { type: GraphQLString },
    errorMessage: { type: GraphQLString },
  },
});

export const AnswerMediaMigrationInputType = new GraphQLInputObjectType({
  name: 'AnswerMediaMigrationInputType',
  fields: {
    question: { type: GraphQLString },
    status: { type: GraphQLString },
    errorMessage: { type: GraphQLString },
  },
});

export const S3VideoMigrationInputType = new GraphQLInputObjectType({
  name: 'S3VideoMigrationInputType',
  fields: {
    status: { type: GraphQLNonNull(GraphQLString) },
    answerMediaMigrations: { type: GraphQLList(AnswerMediaMigrationInputType) },
  },
});

export const importTaskCreate = {
  type: GraphQLBoolean,
  args: {
    mentor: { type: GraphQLNonNull(GraphQLID) },
    graphQLUpdate: { type: GraphQLNonNull(GraphQLUpdateInputType) },
    s3VideoMigrate: { type: GraphQLNonNull(S3VideoMigrationInputType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      mentor: string;
      graphQLUpdate: GraphQLUpdateProps;
      s3VideoMigrate: s3VideoMigrateProps;
    }
  ): Promise<boolean> => {
    const importTask = await ImportTaskModel.findOneAndUpdate(
      {
        mentor: args.mentor,
      },
      {
        graphQLUpdate: args.graphQLUpdate,
        s3VideoMigrate: args.s3VideoMigrate,
      },
      {
        upsert: true,
        new: true,
      }
    );
    return Boolean(importTask);
  },
};

export default importTaskCreate;
