/**
 * Migration Script: PostgreSQL (Prisma) -> MongoDB (Mongoose)
 * 
 * Safely migrates existing records from PostgreSQL to MongoDB if a PostgreSQL instance
 * is accessible.
 * 
 * Requirements:
 * - Reads from PostgreSQL without mutating or deleting existing records.
 * - Upserts users into MongoDB by unique email to prevent duplicates upon rerunning.
 * - Maps PostgreSQL user IDs to MongoDB ObjectIds and preserves all relational references.
 * - Preserves timestamps, entryDate, moods, feelings arrays, and weather metrics.
 */

require('dotenv').config();
const { connectDB, disconnectDB } = require('./src/config/db');
const { User, MoodEntry, Reminder } = require('./src/models');

async function migrateData() {
  console.log('🚀 Starting Data Migration: PostgreSQL -> MongoDB');

  let prisma = null;
  try {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
  } catch (err) {
    console.log('ℹ️  Prisma client not available or not installed. Skipping direct PostgreSQL transfer.');
    return;
  }

  try {
    await connectDB();

    console.log('📡 Testing connection to PostgreSQL...');
    let pgUsers = [];
    try {
      pgUsers = await prisma.user.findMany();
      console.log(`✅ Found ${pgUsers.length} user(s) in PostgreSQL.`);
    } catch (pgErr) {
      console.warn(`⚠️ PostgreSQL is not reachable (${pgErr.message}). Fresh MongoDB configuration will be used.`);
      return;
    }

    if (pgUsers.length === 0) {
      console.log('ℹ️ No user records found in PostgreSQL to migrate.');
      return;
    }

    // Mapping from PostgreSQL UUID -> MongoDB ObjectId
    const userIdMap = new Map();

    // 1. Migrate Users
    console.log('👤 Migrating users to MongoDB...');
    for (const pgUser of pgUsers) {
      let mongoUser = await User.findOne({ email: pgUser.email.toLowerCase() });

      if (!mongoUser) {
        mongoUser = await User.create({
          name: pgUser.name,
          email: pgUser.email.toLowerCase(),
          passwordHash: pgUser.passwordHash,
          avatar: pgUser.avatar,
          createdAt: pgUser.createdAt,
          updatedAt: pgUser.updatedAt
        });
        console.log(`   + Created user: ${mongoUser.email} [Mongo ID: ${mongoUser._id}]`);
      } else {
        console.log(`   * Existing user preserved: ${mongoUser.email} [Mongo ID: ${mongoUser._id}]`);
      }

      userIdMap.set(pgUser.id, mongoUser._id);
    }

    // 2. Migrate Mood Entries
    console.log('📊 Migrating mood entries to MongoDB...');
    const pgMoodEntries = await prisma.moodEntry.findMany();
    let moodMigrated = 0;

    for (const pgEntry of pgMoodEntries) {
      const mongoUserId = userIdMap.get(pgEntry.userId);
      if (!mongoUserId) {
        console.warn(`   ⚠️ Skipping entry ${pgEntry.id}: user ${pgEntry.userId} not mapped.`);
        continue;
      }

      // Check for existing entry for this user and entryDate
      const existing = await MoodEntry.findOne({
        userId: mongoUserId,
        entryDate: pgEntry.entryDate
      });

      if (!existing) {
        await MoodEntry.create({
          userId: mongoUserId,
          mood: pgEntry.mood,
          sleepHours: pgEntry.sleepHours,
          feelings: pgEntry.feelings || [],
          reflection: pgEntry.reflection,
          temperature: pgEntry.temperature,
          weatherCondition: pgEntry.weatherCondition,
          precipitation: pgEntry.precipitation,
          entryDate: pgEntry.entryDate,
          createdAt: pgEntry.createdAt,
          updatedAt: pgEntry.updatedAt
        });
        moodMigrated++;
      }
    }
    console.log(`✅ Migrated ${moodMigrated} new mood entry/entries (${pgMoodEntries.length} evaluated).`);

    // 3. Migrate Reminders
    console.log('⏰ Migrating reminders to MongoDB...');
    const pgReminders = await prisma.reminder.findMany();
    let remindersMigrated = 0;

    for (const pgRem of pgReminders) {
      const mongoUserId = userIdMap.get(pgRem.userId);
      if (!mongoUserId) continue;

      const existing = await Reminder.findOne({ userId: mongoUserId });
      if (!existing) {
        await Reminder.create({
          userId: mongoUserId,
          enabled: pgRem.enabled,
          reminderTime: pgRem.reminderTime,
          timezone: pgRem.timezone || 'UTC',
          createdAt: pgRem.createdAt,
          updatedAt: pgRem.updatedAt
        });
        remindersMigrated++;
      }
    }
    console.log(`✅ Migrated ${remindersMigrated} reminder(s).`);

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
    await disconnectDB();
  }
}

if (require.main === module) {
  migrateData();
}

module.exports = { migrateData };
