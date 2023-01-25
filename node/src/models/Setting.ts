/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface Setting {
  key: string;
  value: any; // eslint-disable-line  @typescript-eslint/no-explicit-any
}

export interface Config {
  cmi5Enabled: boolean;
  cmi5Endpoint: string;
  cmi5Fetch: string;
  classifierLambdaEndpoint: string;
  uploadLambdaEndpoint: string;
  graphqlLambdaEndpoint: string;
  subjectRecordPriority: string[];
  filterEmailMentorAddress: string;
  videoRecorderMaxLength: number;
  googleClientId: string;
  virtualBackgroundUrls: string[];
  defaultVirtualBackground: string;
  urlGraphql: string;
  urlVideo: string;
  urlDocSetup: string;
  urlVideoIdleTips: string;
  // style settings
  styleHeaderTitle: string;
  styleHeaderText: string;
  styleHeaderColor: string;
  styleHeaderTextColor: string;
  styleHeaderLogo: string;
  styleHeaderLogoUrl: string;
  styleHeaderLogoOffset: number;
  styleHeaderLogoHeight: number;
  styleHeaderLogoWidth: number;
  homeFooterColor: string;
  homeFooterTextColor: string;
  homeFooterImages: string[];
  homeFooterLinks: string[];
  homeBannerColor: string;
  homeBannerButtonColor: string;
  homeCarouselColor: string;
  // popup settings
  walkthroughDisabled: boolean;
  walkthroughTitle: string;
  urlVideoMentorpalWalkthrough: string;
  disclaimerDisabled: boolean;
  disclaimerTitle: string;
  disclaimerText: string;
  termsOfServiceDisabled: boolean;
  termsOfServiceText: string;
  displayGuestPrompt: boolean;
  guestPromptTitle: string;
  guestPromptText: string;
  guestPromptInputType: string;
  // client settings
  questionSortOrder: boolean;
  mentorsDefault: string[];
  postSurveyLink: string;
  postSurveyTimer: number;
  minTopicQuestionSize: number;
  // home settings
  activeMentors: string[];
  activeMentorPanels: string[];
  featuredMentors: string[];
  featuredMentorPanels: string[];
  featuredSubjects: string[];
  featuredKeywordTypes: string[];
  defaultSubject: string;
}

type ConfigKey = keyof Config;
export const ConfigKeys: ConfigKey[] = [
  'cmi5Enabled',
  'cmi5Endpoint',
  'cmi5Fetch',
  'classifierLambdaEndpoint',
  'uploadLambdaEndpoint',
  'graphqlLambdaEndpoint',
  'subjectRecordPriority',
  'filterEmailMentorAddress',
  'videoRecorderMaxLength',
  'googleClientId',
  'virtualBackgroundUrls',
  'defaultVirtualBackground',
  'urlGraphql',
  'urlVideo',
  'urlDocSetup',
  'urlVideoIdleTips',
  // style settings
  'styleHeaderTitle',
  'styleHeaderText',
  'styleHeaderColor',
  'styleHeaderTextColor',
  'styleHeaderLogo',
  'styleHeaderLogoUrl',
  'homeFooterColor',
  'homeFooterTextColor',
  'homeFooterImages',
  'homeFooterLinks',
  'homeBannerColor',
  'homeBannerButtonColor',
  'homeCarouselColor',
  'styleHeaderLogoOffset',
  'styleHeaderLogoHeight',
  'styleHeaderLogoWidth',
  // popup settings
  'walkthroughDisabled',
  'walkthroughTitle',
  'urlVideoMentorpalWalkthrough',
  'disclaimerDisabled',
  'disclaimerTitle',
  'disclaimerText',
  'termsOfServiceDisabled',
  'termsOfServiceText',
  'displayGuestPrompt',
  'guestPromptTitle',
  'guestPromptText',
  'guestPromptInputType',
  // client settings
  'questionSortOrder',
  'mentorsDefault',
  'postSurveyLink',
  'postSurveyTimer',
  'minTopicQuestionSize',
  // home settings
  'activeMentors',
  'activeMentorPanels',
  'featuredMentors',
  'featuredMentorPanels',
  'featuredSubjects',
  'featuredKeywordTypes',
  'defaultSubject',
];

export function getDefaultConfig(): Config {
  return {
    cmi5Enabled: false,
    cmi5Endpoint: '',
    cmi5Fetch: '',
    classifierLambdaEndpoint: '',
    uploadLambdaEndpoint: '',
    graphqlLambdaEndpoint: '',
    subjectRecordPriority: [],
    filterEmailMentorAddress: 'careerfair.ai@gmail.com',
    videoRecorderMaxLength: 300, //seconds
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    virtualBackgroundUrls: [],
    defaultVirtualBackground: '',
    urlGraphql: '/graphql',
    urlVideo: '/video',
    urlDocSetup:
      'https://docs.google.com/document/d/1av1pWamFrXQ1KabMU02LtAutrTt3ppblneQeilFBU3s/edit?usp=sharing',
    urlVideoIdleTips: 'https://youtu.be/xSu1BhuFt8A',
    // style settings
    styleHeaderTitle: '',
    styleHeaderText: '',
    styleHeaderLogo: '',
    styleHeaderLogoUrl: '',
    styleHeaderColor: '#025a87',
    styleHeaderTextColor: '#ffffff',
    homeFooterColor: '#025a87',
    homeFooterTextColor: '#ffffff',
    homeFooterImages: [],
    homeFooterLinks: [],
    homeBannerColor: '#ffffff',
    homeBannerButtonColor: '#007cba',
    homeCarouselColor: '#398bb4',
    styleHeaderLogoOffset: 0,
    styleHeaderLogoHeight: 0,
    styleHeaderLogoWidth: 0,
    // popup settings
    walkthroughDisabled: false,
    walkthroughTitle: '',
    urlVideoMentorpalWalkthrough: 'https://youtu.be/EGdSl4Q8NAY',
    disclaimerDisabled: false,
    disclaimerTitle: '',
    disclaimerText: '',
    termsOfServiceDisabled: false,
    termsOfServiceText: '',
    displayGuestPrompt: false,
    guestPromptTitle: '',
    guestPromptText: '',
    guestPromptInputType: 'email',
    // client settings
    questionSortOrder: true,
    mentorsDefault: [],
    postSurveyLink:
      'https://fullerton.qualtrics.com/jfe/form/SV_1ZzDYgNPzLE2QPI',
    postSurveyTimer: 0,
    minTopicQuestionSize: 0,
    // home settings
    activeMentors: [],
    activeMentorPanels: [],
    featuredMentors: [],
    featuredMentorPanels: [],
    featuredSubjects: [],
    featuredKeywordTypes: [],
    defaultSubject: '',
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
