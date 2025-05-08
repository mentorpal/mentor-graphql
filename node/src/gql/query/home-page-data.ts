/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLString } from 'graphql';
import { GraphQLID } from 'graphql';
import { GraphQLObjectType, GraphQLList } from 'graphql';
import {
  Organization as OrganizationModel,
  Mentor as MentorModel,
  MentorPanel as MentorPanelModel,
  Answer as AnswerModel,
  Question as QuestionModel,
} from '../../models';
import { toAbsoluteUrl } from '../../utils/static-urls';
import requireEnv from '../../utils/require-env';
import SettingModel from '../../models/Setting';
export const HomePageMentorPanelType = new GraphQLObjectType({
  name: 'HomePageMentorPanel',
  fields: () => ({
    _id: { type: GraphQLID },
    org: { type: GraphQLID },
    subject: { type: GraphQLID },
    mentors: { type: GraphQLList(GraphQLID) },
    title: { type: GraphQLString },
    subtitle: { type: GraphQLString },
    panelUrl: { type: GraphQLString },
  }),
});

export interface HomePageMentorPanel {
  _id: string;
  org: string;
  subject: string;
  mentors: string[];
  title: string;
  subtitle: string;
  panelUrl: string;
}

export const HomePageMentorType = new GraphQLObjectType({
  name: 'HomePageMentor',
  fields: () => ({
    _id: { type: GraphQLID },
    name: { type: GraphQLString },
    title: { type: GraphQLString },
    keywords: { type: GraphQLList(GraphQLString) },
    transcript: { type: GraphQLString },
    mentorUrl: { type: GraphQLString },
    thumbnail: { type: GraphQLString },
  }),
});

export interface HomePageMentor {
  _id: string;
  name: string;
  title: string;
  keywords: string[];
  transcript: string;
  mentorUrl: string;
  thumbnail: string;
}

export const HomePageDataType = new GraphQLObjectType({
  name: 'HomePageData',
  fields: () => ({
    panels: { type: new GraphQLList(HomePageMentorPanelType) },
    mentors: { type: new GraphQLList(HomePageMentorType) },
    activeMentorIds: { type: new GraphQLList(GraphQLString) },
  }),
});

export interface HomePageData {
  panels: HomePageMentorPanel[];
  mentors: HomePageMentor[];
  activeMentorIds: string[];
}

export const homePageData = {
  type: HomePageDataType,
  args: {
    orgId: { type: GraphQLString },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { orgId?: string }
  ): Promise<HomePageData> => {
    const domain = requireEnv('DOMAIN');
    const org = args.orgId
      ? await OrganizationModel.findById(args.orgId)
      : null;
    const config = org
      ? await OrganizationModel.getConfig(org)
      : await SettingModel.getConfig();
    const activeMentors = config.activeMentors || [];
    const activeMentorPanels = config.activeMentorPanels || [];
    const _panels = await MentorPanelModel.find({
      _id: { $in: activeMentorPanels },
    });
    const panels = _panels.sort(
      (a, b) =>
        activeMentorPanels.indexOf(a._id.toString()) -
        activeMentorPanels.indexOf(b._id.toString())
    );
    const panelMentors = panels.flatMap((panel) => panel.mentors);
    const mentors = await MentorModel.find({
      _id: { $in: [...activeMentors, ...panelMentors] },
    });
    const introQuestion = await QuestionModel.findOne({
      name: '_INTRO_',
    });
    if (!introQuestion) {
      throw new Error('Intro question not found');
    }
    const mentorsIntroAnswers = await AnswerModel.find({
      mentor: { $in: activeMentors },
      question: introQuestion._id,
    });
    const homePageMentors = mentors.map((mentor) => ({
      _id: mentor._id.toString(),
      name: mentor.name,
      title: mentor.title,
      keywords: mentor.keywords,
      transcript:
        mentorsIntroAnswers.find(
          (answer) => answer.mentor.toString() === mentor._id.toString()
        )?.transcript || '',
      mentorUrl: `https://${org?.subdomain ? `${org.subdomain}.` : ''}${domain}/chat/?mentor=${mentor._id}`,
      thumbnail: mentor.thumbnail ? toAbsoluteUrl(mentor.thumbnail) : null,
    }));
    const homePageMentorPanels: HomePageMentorPanel[] = panels.map((panel) => ({
      _id: panel._id.toString(),
      org: panel.org?.toString(),
      subject: panel.subject?.toString(),
      mentors: panel.mentors.map((mentor) => mentor.toString()),
      title: panel.title,
      subtitle: panel.subtitle,
      panelUrl: `https://${org?.subdomain ? `${org.subdomain}.` : ''}${domain}/chat/?${panel.mentors.map((mentor) => `mentor=${mentor.toString()}`).join('&')}`,
    }));
    return {
      mentors: homePageMentors,
      panels: homePageMentorPanels,
      activeMentorIds: activeMentors.map((mentor) => mentor.toString()),
    };
  },
};

export default homePageData;
