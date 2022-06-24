/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/

import mongoose, { Document, Model, Schema } from 'mongoose';
import { User } from './User';

export interface FirstTimeTracking extends Document {
  user: User['_id'];
  myMentorSplash: boolean;
}

export const FirstTimeTrackingSchema = new Schema<
  FirstTimeTracking,
  FirstTimeTrackingModel
>(
  {
    user: { type: mongoose.Types.ObjectId, ref: 'User' },
    myMentorSplash: Boolean,
  },
  { timestamps: true, collation: { locale: 'en', strength: 2 } }
);

FirstTimeTrackingSchema.index({ user: -1 }, { unique: true });

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FirstTimeTrackingModel extends Model<FirstTimeTracking> {}

export default mongoose.model<FirstTimeTracking, FirstTimeTrackingModel>(
  'FirstTimeTracking',
  FirstTimeTrackingSchema
);
