var ObjectID = require("mongodb").ObjectID;

function toDict(a) {
  const d = {};
  for (const i in a) {
    d[a[i]._id] = a[i];
  }
  return d;
}

async function collectionToDict(db, collection) {
  return toDict(await db.collection(collection).find({}).toArray());
}

function mapTopic(tid, topics, subjectTopics) {
  const topic = topics[tid];
  if (!topic) {
    return "";
  }
  const tidstr = `${tid}`;
  const subjectTopic = subjectTopics[tidstr];
  if (subjectTopic) {
    return tidstr;
  }
  subjectTopics[tidstr] = {
    id: tidstr,
    name: topic.name || "",
    description: topic.description || "",
  };
  return tidstr;
}

function getUpdatesForSubject(s, questions, topics) {
  const subjectUpdates = {
    questions: [],
    topics: [],
    categories: [],
  };
  const subjectTopics = {};
  for (const qi in s.questions || []) {
    const qid = s.questions[qi];
    const q = questions[qid];
    if (!q) {
      continue;
    }
    const questionUpdate = {
      question: qid,
      topics: [],
    };
    subjectUpdates.questions.push(questionUpdate);
    for (const ti in q.topics || []) {
      const tid = q.topics[ti];
      const subjectTopicId = mapTopic(tid, topics, subjectTopics);
      if (!subjectTopicId) {
        continue;
      }
      questionUpdate.topics.push(subjectTopicId);
    }
  }
  for (const tid in subjectTopics) {
    subjectUpdates.topics.push(subjectTopics[tid]);
  }
  return subjectUpdates;
}

module.exports = {
  async up(db, client) {
    console.log(`migrate up`);
    const subjects = await collectionToDict(db, "subjects");
    const questions = await collectionToDict(db, "questions");
    const topics = await collectionToDict(db, "topics");
    // console.log(`subjects=${JSON.stringify(subjects, null, 2)}`);
    // console.log(`questions=${JSON.stringify(questions, null, 2)}`);
    // console.log(`topics=${JSON.stringify(topics, null, 2)}`);
    const subjectUpdates = {};
    const subjectIds = Object.getOwnPropertyNames(subjects);
    for (const i in subjectIds) {
      const sid = subjectIds[i];
      const s = subjects[sid];
      const updates = {
        $set: getUpdatesForSubject(s, questions, topics),
      };
      subjectUpdates[sid] = updates;
    }
    for (const si in subjectIds) {
      const sid = subjectIds[si];
      const updates = subjectUpdates[sid];
      // console.log(`await db.collection("subjects").updateOne({ _id: ${sid} }, ${JSON.stringify(updates, null, 2)})`)
      await db
        .collection("subjects")
        .updateOne({ _id: ObjectID(`${sid}`) }, updates);
    }
    await db.collection("questions").updateMany({}, { $unset: { topics: "" } });
    await db.collection("subjects").updateMany({}, { $unset: { topicsOrder: "" } });
  },

  async down(db, client) {
    console.log(`migrate down`);
    // for any future migration, this needs to reverse the migrate up to previous rev
    // for this one, there is no downgrade
  },
};
