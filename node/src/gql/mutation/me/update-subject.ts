/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose from 'mongoose';
import { GraphQLString, GraphQLObjectType, GraphQLNonNull } from 'graphql';
import {
  Subject as SubjectModel,
  Topic as TopicModel,
  Question as QuestionModel,
} from 'models';
import { User } from 'models/User';
import SubjectType, { SubjectGQL } from 'gql/types/subject';
import { Subject } from 'models/Subject';

export const updateSubject = {
  type: SubjectType,
  args: {
    subject: { type: GraphQLNonNull(GraphQLString) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { subject: string },
    context: { user: User }
  ): Promise<Subject> => {
    const subjectUpdate: SubjectGQL = JSON.parse(decodeURI(args.subject));
    for (const [i, question] of subjectUpdate.questions.entries()) {
      for (const [i, topic] of question.topics.entries()) {
        const t = await TopicModel.findOneAndUpdate(
          {
            _id: topic._id || mongoose.Types.ObjectId(),
          },
          {
            $set: {
              name: topic.name,
              description: topic.description,
            },
          },
          {
            new: true,
            upsert: true,
          }
        );
        question.topics[i] = t;
      }
      const q = await QuestionModel.findOneAndUpdate(
        {
          _id: question._id || mongoose.Types.ObjectId(),
        },
        {
          $set: {
            question: question.question,
            topics: question.topics.map((t) => t._id),
            paraphrases: question.paraphrases,
            type: question.type,
            name: question.name,
          },
        },
        {
          new: true,
          upsert: true,
        }
      );
      subjectUpdate.questions[i] = q;
    }
    return await SubjectModel.findOneAndUpdate(
      {
        _id: subjectUpdate._id || mongoose.Types.ObjectId(),
      },
      {
        $set: {
          name: subjectUpdate.name,
          description: subjectUpdate.description,
          isRequired: subjectUpdate.isRequired,
          questions: subjectUpdate.questions.map((q) => q._id),
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
