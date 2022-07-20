/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { Document, Schema } from 'mongoose';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLInputObjectType,
} from 'graphql';
import { AnswerMediaProps, AnswerMediaSchema } from './Answer';
import { AnswerMediaInputType } from '../gql/mutation/api/upload-answer';
import { AnswerMediaType } from '../gql/types/answer';

export interface TaskInfoProps {
  task_name: string;
  task_id: string;
  status: string;
  transcript: string;
  media: AnswerMediaProps;
  payload: string;
}

export interface TaskInfo extends TaskInfoProps, Document {}

export const TaskInfoSchema = new Schema({
  task_name: { type: String },
  task_id: { type: String },
  status: { type: String },
  transcript: { type: String },
  media: { type: AnswerMediaSchema },
  payload: { type: String, default: '' },
});

export const TaskInfoInputType = new GraphQLInputObjectType({
  name: 'TaskInfoInputType',
  fields: {
    task_name: { type: GraphQLString },
    task_id: { type: GraphQLString },
    status: { type: GraphQLString },
    transcript: { type: GraphQLString },
    media: { type: AnswerMediaInputType },
    payload: { type: GraphQLString },
  },
});

export const TaskInfoType = new GraphQLObjectType({
  name: 'TaskInfo',
  fields: {
    task_name: { type: GraphQLString },
    task_id: { type: GraphQLString },
    status: { type: GraphQLString },
    media: { type: AnswerMediaType },
    transcript: { type: GraphQLString },
    payload: { type: GraphQLString },
  },
});
