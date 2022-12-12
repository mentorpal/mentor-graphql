/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Document, Model, Schema } from 'mongoose';

export enum QuestionSortOrder {
  Alphabetical = 0,
  ReverseAlphabetical = 1,
}

export interface Config {
  cmi5Enabled: boolean;
  cmi5Endpoint: string;
  cmi5Fetch: string;

  classifierLambdaEndpoint: string;
  uploadLambdaEndpoint: string;
  graphqlLambdaEndpoint: string;

  urlGraphql: string;
  urlVideo: string;
  urlDocSetup: string;
  urlVideoIdleTips: string;
  urlVideoMentorpalWalkthrough: string;

  styleHeaderLogo: string;
  styleHeaderColor: string;
  styleHeaderTitle: string;
  styleHeaderText: string;
  styleHeaderTextColor: string;
  displayGuestPrompt: boolean;
  disclaimerTitle: string;
  disclaimerText: string;
  disclaimerDisabled: boolean;

  mentorsDefault: string[];
  defaultSubject: string;
  activeMentors: string[];
  activeMentorPanels: string[];
  featuredMentors: string[];
  featuredMentorPanels: string[];
  featuredSubjects: string[];
  featuredKeywordTypes: string[];

  subjectRecordPriority: string[];
  filterEmailMentorAddress: string;
  videoRecorderMaxLength: number;
  googleClientId: string;
  virtualBackgroundUrls: string[];
  defaultVirtualBackground: string;
  questionSortOrder: number;
}

type ConfigKey = keyof Config;
export const ConfigKeys: ConfigKey[] = [
  'cmi5Enabled',
  'cmi5Endpoint',
  'cmi5Fetch',
  'urlGraphql',
  'urlVideo',
  'urlDocSetup',
  'urlVideoIdleTips',
  'subjectRecordPriority',
  'urlVideoMentorpalWalkthrough',
  'classifierLambdaEndpoint',
  'uploadLambdaEndpoint',
  'graphqlLambdaEndpoint',
  'filterEmailMentorAddress',
  'videoRecorderMaxLength',
  'googleClientId',
  'mentorsDefault',
  'featuredMentors',
  'featuredMentorPanels',
  'featuredKeywordTypes',
  'featuredSubjects',
  'defaultSubject',
  'virtualBackgroundUrls',
  'defaultVirtualBackground',
  'activeMentors',
  'activeMentorPanels',
  'styleHeaderLogo',
  'styleHeaderColor',
  'styleHeaderTitle',
  'styleHeaderText',
  'styleHeaderTextColor',
  'displayGuestPrompt',
  'disclaimerTitle',
  'disclaimerText',
  'disclaimerDisabled',
  'questionSortOrder',
];

export interface Setting {
  key: string;
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  value: any;
}

export function getDefaultConfig(): Config {
  return {
    cmi5Enabled: false,
    cmi5Endpoint: '',
    cmi5Fetch: '',
    urlGraphql: '/graphql',
    urlVideo: '/video',
    urlDocSetup:
      'https://docs.google.com/document/d/1av1pWamFrXQ1KabMU02LtAutrTt3ppblneQeilFBU3s/edit?usp=sharing',
    urlVideoIdleTips: 'https://youtu.be/xSu1BhuFt8A',
    subjectRecordPriority: [],
    urlVideoMentorpalWalkthrough: 'https://youtu.be/EGdSl4Q8NAY',
    classifierLambdaEndpoint: '',
    uploadLambdaEndpoint: '',
    graphqlLambdaEndpoint: '',
    filterEmailMentorAddress: 'careerfair.ai@gmail.com',
    videoRecorderMaxLength: 300, //seconds
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    mentorsDefault: [],
    featuredMentors: [],
    featuredMentorPanels: [],
    featuredKeywordTypes: [],
    featuredSubjects: [],
    defaultSubject: '',
    virtualBackgroundUrls: [],
    defaultVirtualBackground: '',
    activeMentors: [],
    activeMentorPanels: [],
    styleHeaderLogo: '',
    styleHeaderColor: '',
    styleHeaderTitle: '',
    styleHeaderText: '',
    styleHeaderTextColor: '',
    displayGuestPrompt: false,
    disclaimerTitle: '',
    disclaimerText: '',
    disclaimerDisabled: true,
    questionSortOrder: QuestionSortOrder.Alphabetical,
  };
}

export interface SettingDoc extends Setting, Document {}

export const SettingSchema = new Schema<SettingDoc>(
  {
    key: { type: String, unique: true },
    value: { type: Schema.Types.Mixed },
  },
  { timestamps: true, collation: { locale: 'en', strength: 2 } }
);

SettingSchema.statics.getConfig = async function (args: {
  defaults?: Partial<Config>;
}) {
  return (await this.find({ key: { $in: ConfigKeys } })).reduce(
    (acc: Config, cur: Setting) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (acc as any)[cur.key] = cur.value;
      return acc;
    },
    args?.defaults || getDefaultConfig()
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
  saveConfig(config: Partial<Config>): Promise<void>;
}

export default mongoose.model<SettingDoc, SettingModel>(
  'Setting',
  SettingSchema
);
