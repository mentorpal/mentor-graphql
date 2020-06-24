/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLString, GraphQLObjectType, GraphQLList } from 'graphql';
import DateType from './date';
import TopicType from './topic';
import { Topic } from 'models';
import { Question } from 'models/Question';

export const QuestionType = new GraphQLObjectType({
  name: 'Question',
  fields: {
    question: { type: GraphQLString },
    videoId: { type: GraphQLString },
    video: { type: GraphQLString },
    transcript: { type: GraphQLString },
    status: { type: GraphQLString },
    recordedAt: { type: DateType },
    topics: {
      type: GraphQLList(TopicType),
      resolve: async function (question: Question) {
        const resolveTopic = async (id: string) => {
          return await Topic.findOne({ _id: id });
        };
        return Promise.all(question.topics.map((t) => resolveTopic(t)));
      },
    },
  },
});

export default QuestionType;
