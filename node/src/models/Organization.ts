/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import {
  PaginatedResolveResult,
  PaginateOptions,
  PaginateQuery,
  pluginPagination,
} from './Paginatation';
import { User, UserRole } from './User';
import SettingModel, { Config, getDefaultConfig } from './Setting';

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

export interface OrgConfigProps {
  key: string;
  value: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}
export interface OrgConfig extends OrgConfigProps, Document {}
export const OrgConfigSchema = new Schema({
  key: { type: String },
  value: { type: Schema.Types.Mixed },
});

export interface OrganizationProps {
  uuid: string;
  name: string;
  subdomain: string;
  isPrivate: boolean;
  accessCodes: string[];
  members: OrgMemberProps[];
  config: OrgConfigProps[];
}
export interface Organization
  extends OrganizationProps,
    Document<Types.ObjectId> {}
export const OrganizationSchema = new Schema<Organization, OrganizationModel>(
  {
    uuid: { type: String },
    name: { type: String },
    subdomain: { type: String },
    isPrivate: { type: Boolean, default: false },
    accessCodes: { type: [String], default: [] },
    members: { type: [OrgMemberSchema], default: [] },
    config: { type: [OrgConfigSchema], default: [] },
  },
  { timestamps: true, collation: { locale: 'en', strength: 2 } }
);

export interface OrganizationModel extends Model<Organization> {
  paginate(
    query?: PaginateQuery<Organization>,
    options?: PaginateOptions
  ): Promise<PaginatedResolveResult<Organization>>;
  getConfig(org: string | Organization): Promise<Config>;
  saveConfig(
    org: string | Organization,
    config: Partial<Config>
  ): Promise<Config>;
}

OrganizationSchema.statics.getConfig = async function (
  o: string | Organization
): Promise<Config> {
  const org: Organization = typeof o === 'string' ? await this.findById(o) : o;
  if (!org) {
    throw new Error(`org ${o} not found`);
  }
  const config = await SettingModel.getConfig();
  const defaultConfig = getDefaultConfig();
  let orgConfig = {
    ...defaultConfig,
    cmi5Enabled: config.cmi5Enabled,
    cmi5Endpoint: config.cmi5Endpoint,
    cmi5Fetch: config.cmi5Fetch,
    classifierLambdaEndpoint: config.classifierLambdaEndpoint,
    uploadLambdaEndpoint: config.uploadLambdaEndpoint,
    graphqlLambdaEndpoint: config.graphqlLambdaEndpoint,
    subjectRecordPriority: config.subjectRecordPriority,
    filterEmailMentorAddress: config.filterEmailMentorAddress,
    googleClientId: config.googleClientId,
    virtualBackgroundUrls: config.virtualBackgroundUrls,
    defaultVirtualBackground: config.defaultVirtualBackground,
    urlGraphql: config.urlGraphql,
    urlVideo: config.urlVideo,
    defaultSubject: config.defaultSubject,
  };
  for (const setting of org.config || []) {
    orgConfig = {
      ...orgConfig,
      [setting.key]: setting.value,
    };
  }
  return orgConfig;
};

OrganizationSchema.statics.saveConfig = async function (
  o: string | Organization,
  config: Partial<Config>
) {
  let org: Organization = typeof o === 'string' ? await this.findById(o) : o;
  if (!org) {
    throw new Error(`org ${o} not found`);
  }
  const configPush: OrgConfigProps[] = [];
  for (const [k, v] of Object.entries(config)) {
    if (org.config.findIndex((c) => c.key == k) === -1) {
      configPush.push({ key: k, value: v });
    }
  }
  if (configPush.length > 0) {
    org = await this.findOneAndUpdate(
      { _id: org._id },
      { $push: { config: { $each: configPush } } },
      {
        new: true,
        upsert: true,
      }
    );
  }

  const configUpdates: Record<string, string | number | boolean | string[]> =
    {};
  for (const [k, v] of Object.entries(config)) {
    const i = org.config.findIndex((c) => c.key == k);
    if (i !== -1 && !equals(org.config[i].value, v)) {
      configUpdates[`config.${i}.value`] = v;
    }
  }
  if (Object.keys(configUpdates).length > 0) {
    //configUpdates !== {}
    org = await this.findOneAndUpdate(
      { _id: org._id },
      { $set: configUpdates },
      {
        new: true,
        upsert: true,
      }
    );
  }
  return await this.getConfig(org);
};

OrganizationSchema.index({ name: -1, _id: -1 });
pluginPagination(OrganizationSchema);

export default mongoose.model<Organization, OrganizationModel>(
  'Organization',
  OrganizationSchema
);

function equals(
  a: string | number | boolean | string[],
  b: string | number | boolean | string[]
): boolean {
  if (typeof a == 'object' && typeof b == 'object') {
    return `${JSON.stringify(a)}` == `${JSON.stringify(b)}`;
  }
  return a == b;
}
