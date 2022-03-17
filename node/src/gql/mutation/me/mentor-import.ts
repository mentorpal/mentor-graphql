/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { MentorType } from 'gql/types/mentor';
import { Mentor as MentorModel } from 'models';
import { Mentor } from 'models/Mentor';
import { AnswerMediaProps, Status } from 'models/Answer';
import { SubjectUpdateInput, SubjectUpdateInputType } from './subject-update';
import {
  QuestionUpdateInput,
  QuestionUpdateInputType,
} from './question-update';
import {
  ExportedMentorInfo,
  ExportedMentorInfoInputType,
} from 'gql/query/mentor-export';

export interface MentorImportJson {
  id: string;
  mentorInfo: ExportedMentorInfo;
  subjects: SubjectUpdateInput[];
  questions: QuestionUpdateInput[];
  answers: AnswerUpdateInput[];
}

export const MentorImportJsonType = new GraphQLInputObjectType({
  name: 'MentorImportJsonType',
  fields: () => ({
    id: { type: GraphQLString },
    mentorInfo: { type: ExportedMentorInfoInputType },
    subjects: { type: GraphQLList(SubjectUpdateInputType) },
    questions: { type: GraphQLList(QuestionUpdateInputType) },
    answers: { type: GraphQLList(AnswerUpdateInputType) },
  }),
});

export interface AnswerUpdateInput {
  question: QuestionUpdateInput;
  hasEditedTranscript: boolean;
  transcript: string;
  status: Status;
  hasUntransferredMedia: boolean;
  media: AnswerMediaProps[];
}

export const AnswerUpdateInputType = new GraphQLInputObjectType({
  name: 'AnswerUpdateInputType',
  fields: () => ({
    question: { type: GraphQLNonNull(QuestionUpdateInputType) },
    hasEditedTranscript: { type: GraphQLBoolean },
    transcript: { type: GraphQLNonNull(GraphQLString) },
    status: { type: GraphQLNonNull(GraphQLString) },
    hasUntransferredMedia: { type: GraphQLBoolean },
    media: { type: GraphQLList(AnswerMediaUpdateInputType) },
  }),
});

export const AnswerMediaUpdateInputType = new GraphQLInputObjectType({
  name: 'AnswerMediaUpdateInputType',
  fields: {
    type: { type: GraphQLString },
    tag: { type: GraphQLString },
    url: { type: GraphQLString },
    needsTransfer: { type: GraphQLBoolean },
  },
});

export const importMentor = {
  type: MentorType,
  args: {
    mentor: { type: GraphQLNonNull(GraphQLID) },
    json: { type: GraphQLNonNull(MentorImportJsonType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { mentor: string; json: MentorImportJson }
  ): Promise<Mentor> => {
    return await MentorModel.import(args.mentor, args.json);
  },
};

export default importMentor;
