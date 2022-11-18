/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/

import mongoose, { Document, Model, Schema } from 'mongoose';
import {
  PaginatedResolveResult,
  PaginateOptions,
  PaginateQuery,
  pluginPagination,
} from './Paginatation';
import { User, UserRole } from './User';
import { Config, SettingSchema } from './Setting';
import { toUpdateProps } from '../gql/mutation/me/helpers';

export interface OrgMemberProps {
  user: User['_id'];
  role: string;
}
export interface OrgMember extends OrgMemberProps, Document {}
export const OrgMemberSchema = new Schema({
  user: { type: mongoose.Types.ObjectId, ref: 'User' },
  role: {
    type: String,
    enum: [UserRole.USER, UserRole.CONTENT_MANAGER, UserRole.ADMIN],
    default: UserRole.USER,
  },
});

export interface OrganizationProps {
  uuid: string;
  name: string;
  subdomain: string;
  members: OrgMemberProps[];
  isPrivate: boolean;
  config: Config;
}
export interface Organization extends OrganizationProps, Document {}
export const OrganizationSchema = new Schema<Organization, OrganizationModel>(
  {
    uuid: { type: String },
    name: { type: String },
    subdomain: { type: String },
    members: { type: [OrgMemberSchema] },
    isPrivate: { type: Boolean },
    config: { type: SettingSchema },
  },
  { timestamps: true, collation: { locale: 'en', strength: 2 } }
);

export interface OrganizationModel extends Model<Organization> {
  paginate(
    query?: PaginateQuery<Organization>,
    options?: PaginateOptions
  ): Promise<PaginatedResolveResult<Organization>>;
  updateOrCreate(organization: Partial<Organization>): Promise<Organization>;
}

OrganizationSchema.statics.updateOrCreate = async function (
  organization: Partial<Organization>
) {
  const { _id, props } = toUpdateProps<Organization>(organization);
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

OrganizationSchema.index({ question: -1, _id: -1 });
OrganizationSchema.index({ type: -1, _id: -1 });
OrganizationSchema.index({ name: -1, _id: -1 });
pluginPagination(OrganizationSchema);

export default mongoose.model<Organization, OrganizationModel>(
  'Organization',
  OrganizationSchema
);
