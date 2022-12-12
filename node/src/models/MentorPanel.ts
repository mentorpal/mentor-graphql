/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  PaginatedResolveResult,
  PaginateOptions,
  PaginateQuery,
  pluginPagination,
} from './Paginatation';
import { Mentor } from './Mentor';
import { Organization } from './Organization';
import { Subject } from './Subject';

export interface MentorPanel extends Document {
  org: Organization['_id'];
  subject: Subject['_id'];
  mentors: Mentor['_id'][];
  title: string;
  subtitle: string;
}

export interface MentorPanelModel extends Model<MentorPanel> {
  paginate(
    query?: PaginateQuery<MentorPanel>,
    options?: PaginateOptions
  ): Promise<PaginatedResolveResult<MentorPanel>>;
}

export const MentorPanelSchema = new Schema<MentorPanel, MentorPanelModel>(
  {
    org: { type: Schema.Types.ObjectId, ref: 'Organization' },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject' },
    mentors: { type: [{ type: Schema.Types.ObjectId, ref: 'Mentor' }] },
    title: { type: String },
    subtitle: { type: String },
  },
  { timestamps: true, collation: { locale: 'en', strength: 2 } }
);

MentorPanelSchema.index({ subject: -1, _id: -1 });
pluginPagination(MentorPanelSchema);

export default mongoose.model<MentorPanel, MentorPanelModel>(
  'MentorPanel',
  MentorPanelSchema
);
