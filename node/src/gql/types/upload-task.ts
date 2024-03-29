/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLID, GraphQLString, GraphQLObjectType } from 'graphql';
import { mentorField } from '../query/mentor';
import { questionField } from '../query/question';
import { AnswerMediaType } from './answer';
import DateType from './date';
import { TaskInfoType } from '../../models/TaskInfo';

export const UploadTaskType = new GraphQLObjectType({
  name: 'UploadTask',
  fields: () => ({
    _id: { type: GraphQLID },
    mentor: mentorField,
    question: questionField,
    trimUploadTask: { type: TaskInfoType },
    transcodeWebTask: { type: TaskInfoType },
    transcodeMobileTask: { type: TaskInfoType },
    transcribeTask: { type: TaskInfoType },
    originalMedia: { type: AnswerMediaType },
    webMedia: { type: AnswerMediaType },
    mobileMedia: { type: AnswerMediaType },
    vttMedia: { type: AnswerMediaType },
    transcript: { type: GraphQLString },
    createdAt: { type: DateType },
    updatedAt: { type: DateType },
  }),
});

export default UploadTaskType;
