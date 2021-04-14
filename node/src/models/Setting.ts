/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface Config {
  cmi5Enabled: boolean;
  cmi5Endpoint: string;
  cmi5Fetch: string;
  mentorsDefault: string[];
  styleHeaderLogo: string;
  urlClassifier: string;
  urlGraphql: string;
  urlVideo: string;
}

type ConfigKey = keyof Config;
export const ConfigKeys: ConfigKey[] = [
  'cmi5Enabled',
  'cmi5Endpoint',
  'cmi5Fetch',
  'mentorsDefault',
  'styleHeaderLogo',
  'urlClassifier',
  'urlGraphql',
  'urlVideo',
];

export interface Setting {
  key: string;
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  value: any;
}

export const DEFAULT_CONFIG: Config = {
  cmi5Enabled: false,
  cmi5Endpoint: '',
  cmi5Fetch: '',
  mentorsDefault: [],
  urlClassifier: '/classifier',
  urlGraphql: '/graphql',
  urlVideo: '/video',
  styleHeaderLogo: '',
};

export interface SettingDoc extends Setting, Document {}

export const SettingSchema = new Schema<SettingDoc>({
  key: { type: String, unique: true },
  value: { type: Schema.Types.Mixed },
});

SettingSchema.statics.getConfig = async function (args: {
  defaults?: Partial<Config>;
}) {
  return (await this.find({ key: { $in: ConfigKeys } })).reduce(
    (acc: Config, cur: Setting) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (acc as any)[cur.key] = cur.value;
      return acc;
    },
    args?.defaults || DEFAULT_CONFIG
  );
};

SettingSchema.statics.saveConfig = async function (
  config: Partial<Config>
): Promise<void> {
  await Promise.all(
    Object.getOwnPropertyNames(config).map((key) => {
      return this.findOneAndUpdate(
        { key },
        {
          $set: { value: config[key as keyof Config] as string },
        },
        {
          upsert: true,
        }
      );
    })
  );
};

export interface SettingModel extends Model<SettingDoc> {
  getConfig(args?: { defaults?: Partial<Config> }): Promise<Config>;
  saveConfig(config: Config): Promise<void>;
}

export default mongoose.model<SettingDoc, SettingModel>(
  'Setting',
  SettingSchema
);
