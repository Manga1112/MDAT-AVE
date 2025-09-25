import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import Job from '../src/models/Job.js';

dotenv.config();

async function main() {
  if (!env.mongoUri) {
    console.error('MONGODB_URI missing');
    process.exit(1);
  }
  await mongoose.connect(env.mongoUri, { dbName: 'automation_hub' });
  console.log('Connected to MongoDB');

  const samples = [
    {
      title: 'Software Development Engineer (SDE)',
      department: 'IT',
      jdText: `We are seeking an SDE with strong foundation in data structures, algorithms, system design, and cloud.
Must have: JavaScript/TypeScript, Node.js, React, REST APIs, databases (MongoDB/PostgreSQL).
Good to have: Docker, Kubernetes, CI/CD, AWS/GCP/Azure.
Responsibilities: build scalable services, write clean tests, collaborate with product/design, review code, and deploy features.`,
      requirements: ['JavaScript', 'Node.js', 'React', 'MongoDB', 'REST APIs', 'Testing'],
      status: 'open',
    },
    {
      title: 'Data Analyst',
      department: 'IT',
      jdText: `Looking for a Data Analyst who can derive insights from structured and unstructured data.
Must have: SQL, Python (pandas, numpy), data visualization (Tableau/Power BI), statistics.
Good to have: ETL pipelines, dbt, warehouse experience (BigQuery/Snowflake/Redshift).
Responsibilities: build dashboards, analyze trends, A/B testing, communicate findings.`,
      requirements: ['SQL', 'Python', 'Pandas', 'Data Viz', 'Statistics'],
      status: 'open',
    },
    {
      title: 'BPO Associate',
      department: 'HR',
      jdText: `Hiring BPO Associates for customer interaction via phone, email, and chat.
Must have: excellent communication, CRM tools, issue resolution, empathy.
Good to have: prior BPO experience, shift flexibility.
Responsibilities: handle customer queries, escalate issues, maintain SLAs and documentation.`,
      requirements: ['Communication', 'CRM', 'Customer Support'],
      status: 'open',
    },
  ];

  for (const s of samples) {
    const exists = await Job.findOne({ title: s.title, department: s.department });
    if (!exists) {
      await Job.create(s);
      console.log(`Inserted job: ${s.title}`);
    } else {
      console.log(`Job already exists: ${s.title}`);
    }
  }

  await mongoose.disconnect();
  console.log('Done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
