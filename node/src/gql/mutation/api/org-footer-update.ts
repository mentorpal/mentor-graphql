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
  GraphQLInt,
} from 'graphql';
import SettingModel from '../../../models/Setting';
import OrganizationModel from '../../../models/Organization';

export const orgFooterUpdate = {
  type: GraphQLBoolean,
  args: {
    orgId: { type: GraphQLID },
    imgPath: { type: GraphQLNonNull(GraphQLString) },
    imgIdx: { type: GraphQLNonNull(GraphQLInt) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      orgId: string;
      imgPath: string;
      imgIdx: number;
    }
  ): Promise<boolean> => {
    const config = args.orgId
      ? await OrganizationModel.getConfig(args.orgId)
      : await SettingModel.getConfig();
    if (!config) {
      return false;
    }
    const footerImages = config.homeFooterImages || [];
    const footerLinks = config.homeFooterLinks || [];
    if (args.imgIdx >= footerImages.length) {
      footerImages.push(args.imgPath);
      footerLinks.push('');
    } else {
      footerImages[args.imgIdx] = args.imgPath;
    }
    if (args.orgId) {
      await OrganizationModel.saveConfig(args.orgId, {
        ...config,
        homeFooterImages: footerImages,
        homeFooterLinks: footerLinks,
      });
    } else {
      await SettingModel.saveConfig({
        ...config,
        homeFooterImages: footerImages,
        homeFooterLinks: footerLinks,
      });
    }
    return true;
  },
};

export default orgFooterUpdate;
