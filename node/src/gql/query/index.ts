/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLObjectType } from 'graphql';
import answer from './answer';
import answers from './answers';
import categoryAnswers from './category-answers';
import config from './config';
import health from './health';
import keyword from './keyword';
import keywords from './keywords';
import me from './me';
import mentor from './mentor';
import mentors from './mentors';
import mentorPanel from './mentor-panel';
import mentorPanels from './mentor-panels';
import mentorExport from './mentor-export';
import mentorImportPreview from './mentor-import-preview';
import mentorClientData from './mentor-client-data';
import mentorsByKeyword from './mentors-by-keyword';
import mentorsById from './mentors-by-id';
import question from './question';
import questions from './questions';
import questionsById from './questions-by-id';
import subject from './subject';
import subjects from './subjects';
import subjectsById from './subjects-by-id';
import userQuestion from './user-question';
import userQuestions from './user-questions';
import users from './users';
import uploadTask from './upload-task';
import importTask from './import-task';

export default new GraphQLObjectType({
  name: 'Query',
  fields: {
    answer,
    answers,
    categoryAnswers,
    config,
    health,
    keyword,
    keywords,
    me,
    mentor,
    mentors,
    mentorPanel,
    mentorPanels,
    mentorExport,
    mentorImportPreview,
    mentorClientData,
    mentorsById,
    mentorsByKeyword,
    question,
    questions,
    questionsById,
    subject,
    subjects,
    subjectsById,
    userQuestion,
    userQuestions,
    users,
    uploadTask,
    importTask,
  },
});
