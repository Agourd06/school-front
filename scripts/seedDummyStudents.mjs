#!/usr/bin/env node
/**
 * Bulk student seeding utility.
 * Usage:
 *   SEED_AUTH_TOKEN="..." node scripts/seedDummyStudents.mjs --count=100 --api=http://localhost:3000 --company=1
 */

import axios from 'axios';
import { randomUUID } from 'crypto';

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const prefix = `${name}=`;
  const direct = args.find((arg) => arg.startsWith(prefix));
  if (direct) return direct.slice(prefix.length);
  const flagIndex = args.indexOf(name);
  if (flagIndex !== -1 && args[flagIndex + 1]) return args[flagIndex + 1];
  return fallback;
};

const API_BASE = getArg('--api', process.env.API_URL || process.env.VITE_API_URL || 'http://localhost:3000');
const AUTH_TOKEN = process.env.SEED_AUTH_TOKEN || process.env.API_TOKEN || process.env.TOKEN;
const COMPANY_ID = getArg('--company', process.env.SEED_COMPANY_ID);
const TOTAL = Number(getArg('--count', '100'));
const DELAY_MS = Number(getArg('--delay', '200'));

if (!AUTH_TOKEN) {
  console.error('❌ Missing SEED_AUTH_TOKEN (or API_TOKEN/TOKEN) in environment.');
  process.exit(1);
}

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    Authorization: `Bearer ${AUTH_TOKEN}`,
  },
});

const firstNames = ['Liam', 'Emma', 'Noah', 'Olivia', 'Ava', 'Sophia', 'Ethan', 'Isabella', 'Mason', 'Mia', 'Lucas', 'Amelia'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Lopez', 'Wilson', 'Anderson', 'Taylor'];
const cities = ['New York', 'Paris', 'Casablanca', 'Madrid', 'London', 'Doha', 'Dubai', 'Toronto', 'Sydney', 'Lisbon'];
const countries = ['USA', 'France', 'Morocco', 'Spain', 'UK', 'Qatar', 'UAE', 'Canada', 'Australia', 'Portugal'];
const schools = ['Edusole Prep', 'Nova Academy', 'Harmony High', 'Summit International', 'Atlas College'];
const diplomaTitles = ['High School Diploma', 'Science Track', 'Literature Track', 'Mathematics Excellence'];
const linkTitles = ['Parent/Guardian', 'Sibling', 'Family Friend'];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomPhone = () => `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
const randomBirthday = () => {
  const start = new Date('2004-01-01').getTime();
  const end = new Date('2012-12-31').getTime();
  return new Date(start + Math.random() * (end - start)).toISOString().slice(0, 10);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureLinkType = async () => {
  try {
    const { data } = await client.get('/studentlinktype', { params: { page: 1, limit: 1 } });
    if (data?.data?.length) return data.data[0].id;
  } catch (error) {
    console.warn('⚠️ Unable to fetch existing link types, attempting to create one.');
  }

  const { data } = await client.post('/studentlinktype', {
    title: pick(linkTitles),
    status: 1,
    ...(COMPANY_ID ? { company_id: Number(COMPANY_ID) } : {}),
  });
  return data.id;
};

const createStudent = async (index) => {
  const first_name = pick(firstNames);
  const last_name = pick(lastNames);
  const city = pick(cities);
  const country = pick(countries);
  const email = `${first_name}.${last_name}.${index}.${randomUUID().slice(0, 8)}@edusole.test`.toLowerCase();

  const payload = {
    first_name,
    last_name,
    gender: Math.random() > 0.5 ? 'male' : 'female',
    birthday: randomBirthday(),
    email,
    phone: randomPhone(),
    address: `${Math.floor(Math.random() * 200) + 1} ${pick(['Elm', 'Oak', 'Maple', 'Cedar'])} St`,
    city,
    country,
    nationality: country,
    status: 1,
    ...(COMPANY_ID ? { company_id: Number(COMPANY_ID) } : {}),
  };

  const { data } = await client.post('/students', payload);
  return data;
};

const createContact = async (studentId, linkTypeId) => {
  const firstname = pick(firstNames);
  const lastname = pick(lastNames);
  const payload = {
    firstname,
    lastname,
    email: `${firstname}.${lastname}.${studentId}@guardian.test`.toLowerCase(),
    phone: randomPhone(),
    adress: `${Math.floor(Math.random() * 50) + 10} Guardian Ave`,
    city: pick(cities),
    country: pick(countries),
    student_id: studentId,
    studentlinktypeId: linkTypeId,
    status: 1,
    ...(COMPANY_ID ? { company_id: Number(COMPANY_ID) } : {}),
  };
  await client.post('/student-contact', payload);
};

const createDiploma = async (studentId) => {
  const payload = {
    title: pick(diplomaTitles),
    school: pick(schools),
    diplome: pick(['Baccalaureate', 'A-Level', 'IB Diploma']),
    annee: 2015 + Math.floor(Math.random() * 8),
    country: pick(countries),
    city: pick(cities),
    student_id: studentId,
    status: 1,
    ...(COMPANY_ID ? { company_id: Number(COMPANY_ID) } : {}),
  };
  await client.post('/student-diplome', payload);
};

const run = async () => {
  console.log(`🚀 Seeding ${TOTAL} students to ${API_BASE}`);
  const linkTypeId = await ensureLinkType();
  console.log(`🔗 Using link type ID: ${linkTypeId}`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < TOTAL; i += 1) {
    try {
      const student = await createStudent(i + 1);
      await createContact(student.id, linkTypeId);
      await createDiploma(student.id);
      success += 1;
      console.log(`✅ [${success}/${TOTAL}] Student ${student.first_name} ${student.last_name} (#${student.id}) created.`);
    } catch (error) {
      failed += 1;
      const message = error?.response?.data?.message ?? error.message ?? 'Unknown error';
      console.error(`❌ Failed at index ${i + 1}:`, message);
    }

    if (DELAY_MS > 0) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n🎉 Done! ${success} succeeded, ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
};

run().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});

