/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { toUpdateProps } from '../gql/mutation/me/helpers';
import mongoose, { Document, Model, Schema } from 'mongoose';
import {
  PaginatedResolveResult,
  PaginateOptions,
  PaginateQuery,
  pluginPagination,
} from './Paginatation';

export interface Keyword extends Document {
  name: string;
  type: string;
}

export const KeywordSchema = new Schema<Keyword, KeywordModel>(
  {
    name: { type: String },
    type: { type: String },
  },
  { timestamps: true, collation: { locale: 'en', strength: 2 } }
);

export interface KeywordModel extends Model<Keyword> {
  paginate(
    query?: PaginateQuery<Keyword>,
    options?: PaginateOptions
  ): Promise<PaginatedResolveResult<Keyword>>;
  updateOrCreate(keyword: Keyword): Promise<Keyword>;
}

KeywordSchema.statics.updateOrCreate = async function (keyword: Keyword) {
  const { _id, props } = toUpdateProps<Keyword>(keyword);
  return await this.findOneAndUpdate(
    { _id: _id },
    {
      $set: props,
    },
    {
      new: true,
      upsert: true,
    }
  );
};

KeywordSchema.index({ type: -1, _id: -1 });
KeywordSchema.index({ name: -1, _id: -1 });
pluginPagination(KeywordSchema);

export default mongoose.model<Keyword, KeywordModel>('Keyword', KeywordSchema);
