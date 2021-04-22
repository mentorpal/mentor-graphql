/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLBoolean,
} from 'graphql';
import {
  Subject as SubjectModel,
  Topic as TopicModel,
  Question as QuestionModel,
} from 'models';
import { User } from 'models/User';
import { Subject } from 'models/Subject';
import SubjectType from 'gql/types/subject';
import {
  QuestionUpdateInput,
  QuestionUpdateInputType,
} from './update-question';
import { idOrNew } from './helpers';

export interface SubjectUpdateInput {
  _id: string;
  name: string;
  description: string;
  isRequired: boolean;
  topicsOrder: string[];
  questions: QuestionUpdateInput[];
}

export const SubjectUpdateInputType = new GraphQLInputObjectType({
  name: 'SubjectUpdateInputType',
  fields: () => ({
    _id: { type: GraphQLID },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    isRequired: { type: GraphQLBoolean },
    topicsOrder: { type: GraphQLList(GraphQLString) },
    questions: { type: GraphQLList(QuestionUpdateInputType) },
  }),
});

export const updateSubject = {
  type: SubjectType,
  args: { subject: { type: GraphQLNonNull(SubjectUpdateInputType) } },
  resolve: async (
    _root: GraphQLObjectType,
    args: { subject: SubjectUpdateInput },
    context: { user: User }
  ): Promise<Subject> => {
    const subjectUpdate = args.subject;
    for (const [i, questionUpdate] of (
      subjectUpdate.questions || []
    ).entries()) {
      for (const [i, topicUpdate] of (questionUpdate.topics || []).entries()) {
        topicUpdate._id = idOrNew(topicUpdate._id);
        const t = await TopicModel.findOneAndUpdate(
          {
            _id: topicUpdate._id,
          },
          {
            $set: {
              ...topicUpdate,
            },
          },
          {
            new: true,
            upsert: true,
          }
        );
        questionUpdate.topics[i] = t;
      }
      const question: any = { ...questionUpdate };
      if (questionUpdate.topics) {
        question._id = idOrNew(questionUpdate._id);
        question.topics = questionUpdate.topics.map((t) => t._id);
      }
      const q = await QuestionModel.findOneAndUpdate(
        {
          _id: question._id,
        },
        {
          $set: {
            ...question,
          },
        },
        {
          new: true,
          upsert: true,
        }
      );
      subjectUpdate.questions[i] = q;
    }

    const subject: any = { ...subjectUpdate };
    if (subjectUpdate.questions) {
      subject._id = idOrNew(subjectUpdate._id);
      subject.topics = subjectUpdate.questions.map((q) => q._id);
    }

    return await SubjectModel.findOneAndUpdate(
      {
        _id: subject._id,
      },
      {
        $set: {
          ...subject,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );
  },
};

export default updateSubject;
