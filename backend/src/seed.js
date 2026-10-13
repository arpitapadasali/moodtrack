const { connectDB, disconnectDB } = require('../src/config/db');
const { User, MoodEntry, Reminder } = require('../src/models');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('🌱 Starting MongoDB seed script...');

  try {
    await connectDB();

    // 1. Hash password for demo user
    const saltRounds = 10;
    const demoPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(demoPassword, saltRounds);

    // 2. Upsert Demo User
    const demoEmail = 'demo@moodtrack.com';
    let user = await User.findOne({ email: demoEmail });

    if (!user) {
      user = await User.create({
        name: 'Alex Morgan',
        email: demoEmail,
        passwordHash,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'
      });
      console.log(`👤 Demo User created: ${user.name} (${user.email}) [ID: ${user.id}]`);
    } else {
      user.name = 'Alex Morgan';
      user.passwordHash = passwordHash;
      user.avatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80';
      await user.save();
      console.log(`👤 Demo User updated: ${user.name} (${user.email}) [ID: ${user.id}]`);
    }

    // 3. Reset & create Default Reminder
    await Reminder.deleteMany({ userId: user._id });

    const reminder = await Reminder.create({
      userId: user._id,
      enabled: true,
      reminderTime: '21:00',
      timezone: 'UTC'
    });

    console.log(`⏰ Reminder configured: ${reminder.reminderTime} ${reminder.timezone}`);

    // 4. Clean up any existing demo entries for idempotency
    await MoodEntry.deleteMany({ userId: user._id });

    // 5. Seed 18 mood entries across a 26-day timeline with intentional missing days
    const today = new Date();

    const getDateOffset = (daysAgo) => {
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    };

    const sampleEntries = [
      {
        daysAgo: 25,
        mood: 4,
        sleepHours: 7.5,
        temperature: 21.5,
        weatherCondition: 'Clear',
        precipitation: 0.0,
        feelings: ['focused', 'optimistic', 'calm'],
        reflection: 'Kicked off the week with clear priorities and a productive morning.'
      },
      {
        daysAgo: 24,
        mood: 5,
        sleepHours: 8.0,
        temperature: 24.0,
        weatherCondition: 'Clear',
        precipitation: 0.0,
        feelings: ['energetic', 'joyful', 'grateful'],
        reflection: 'Great team sync and finished reading a chapter on mindful habit building.'
      },
      // Missing day: 23 days ago (gap)
      {
        daysAgo: 22,
        mood: 3,
        sleepHours: 6.5,
        temperature: 16.0,
        weatherCondition: 'Clouds',
        precipitation: 0.0,
        feelings: ['tired', 'neutral'],
        reflection: 'Busy day with back-to-back tasks. Need to prioritize earlier bedtime.'
      },
      {
        daysAgo: 21,
        mood: 2,
        sleepHours: 5.5,
        temperature: 11.5,
        weatherCondition: 'Rain',
        precipitation: 7.2,
        feelings: ['stressed', 'overwhelmed'],
        reflection: 'A bug delayed the delivery schedule. Practicing deep breathing exercises.'
      },
      {
        daysAgo: 20,
        mood: 3,
        sleepHours: 6.0,
        temperature: 13.0,
        weatherCondition: 'Rain',
        precipitation: 3.5,
        feelings: ['relieved', 'recovering'],
        reflection: 'Resolved the core issue. Feeling much lighter by the evening.'
      },
      // Missing day: 19 days ago (gap)
      {
        daysAgo: 18,
        mood: 4,
        sleepHours: 7.5,
        temperature: 19.5,
        weatherCondition: 'Clear',
        precipitation: 0.0,
        feelings: ['content', 'peaceful'],
        reflection: 'Pleasant autumn weather. Took a 30-minute walk through the park.'
      },
      {
        daysAgo: 17,
        mood: 5,
        sleepHours: 8.5,
        temperature: 23.0,
        weatherCondition: 'Clear',
        precipitation: 0.0,
        feelings: ['happy', 'motivated', 'inspired'],
        reflection: 'Had lunch with a mentor and gained helpful perspectives on work-life rhythm.'
      },
      {
        daysAgo: 16,
        mood: 4,
        sleepHours: 7.0,
        temperature: 18.0,
        weatherCondition: 'Clouds',
        precipitation: 0.0,
        feelings: ['productive', 'focused'],
        reflection: 'Deep focus work session. Cleaned my workspace and reorganized my notes.'
      },
      // Missing day: 15 days ago (gap)
      {
        daysAgo: 14,
        mood: 2,
        sleepHours: 5.0,
        temperature: 10.0,
        weatherCondition: 'Rain',
        precipitation: 9.0,
        feelings: ['exhausted', 'anxious'],
        reflection: 'Restless night due to construction noise. Energy levels were low all day.'
      },
      {
        daysAgo: 13,
        mood: 3,
        sleepHours: 7.5,
        temperature: 15.5,
        weatherCondition: 'Clouds',
        precipitation: 0.0,
        feelings: ['calm', 'rested'],
        reflection: 'Caught up on sleep. Took it easy today without pushing too hard.'
      },
      {
        daysAgo: 12,
        mood: 4,
        sleepHours: 7.0,
        temperature: 20.5,
        weatherCondition: 'Clear',
        precipitation: 0.0,
        feelings: ['optimistic', 'creative'],
        reflection: 'Started sketching new interface designs. Good creative flow.'
      },
      // Missing day: 11 days ago (gap)
      {
        daysAgo: 10,
        mood: 5,
        sleepHours: 8.0,
        temperature: 25.5,
        weatherCondition: 'Clear',
        precipitation: 0.0,
        feelings: ['accomplished', 'proud', 'joyful'],
        reflection: 'Completed a major personal milestone! Celebrated with a homemade dinner.'
      },
      {
        daysAgo: 9,
        mood: 4,
        sleepHours: 7.5,
        temperature: 22.0,
        weatherCondition: 'Clear',
        precipitation: 0.0,
        feelings: ['connected', 'grateful'],
        reflection: 'Phone call with family. Reminded me of what matters most.'
      },
      {
        daysAgo: 8,
        mood: 3,
        sleepHours: 6.5,
        temperature: 14.0,
        weatherCondition: 'Clouds',
        precipitation: 0.5,
        feelings: ['reflective', 'quiet'],
        reflection: 'Spent a rainy afternoon listening to podcasts and resting.'
      },
      // Missing day: 7 days ago (gap)
      {
        daysAgo: 6,
        mood: 4,
        sleepHours: 8.0,
        temperature: 21.0,
        weatherCondition: 'Clear',
        precipitation: 0.0,
        feelings: ['refreshed', 'calm'],
        reflection: 'Morning meditation felt very grounded. Smooth day overall.'
      },
      {
        daysAgo: 5,
        mood: 5,
        sleepHours: 8.5,
        temperature: 26.0,
        weatherCondition: 'Clear',
        precipitation: 0.0,
        feelings: ['energized', 'excited'],
        reflection: 'Great workout session and good momentum heading into the weekend.'
      },
      // Missing day: 4 days ago (gap)
      {
        daysAgo: 3,
        mood: 2,
        sleepHours: 5.5,
        temperature: 12.0,
        weatherCondition: 'Rain',
        precipitation: 5.0,
        feelings: ['frustrated', 'sluggish'],
        reflection: 'Felt drained. Skipped my morning routine and felt off-kilter all day.'
      },
      {
        daysAgo: 2,
        mood: 4,
        sleepHours: 7.5,
        temperature: 20.0,
        weatherCondition: 'Clear',
        precipitation: 0.0,
        feelings: ['hopeful', 'resilient'],
        reflection: 'Bounced back with good sleep and a healthy breakfast. Better mindset.'
      },
      {
        daysAgo: 1,
        mood: 5,
        sleepHours: 8.0,
        temperature: 23.5,
        weatherCondition: 'Clear',
        precipitation: 0.0,
        feelings: ['grateful', 'peaceful', 'happy'],
        reflection: 'A wonderful, restorative evening. Ready for the upcoming week.'
      },
      {
        daysAgo: 0, // Today
        mood: 4,
        sleepHours: 7.5,
        temperature: 22.0,
        weatherCondition: 'Clear',
        precipitation: 0.0,
        feelings: ['motivated', 'focused'],
        reflection: 'Logged in to start tracking consistently. Looking forward to analytics.'
      }
    ];

    console.log(`📊 Seeding ${sampleEntries.length} mood entries spanning 26 days...`);

    for (const entry of sampleEntries) {
      await MoodEntry.create({
        userId: user._id,
        mood: entry.mood,
        sleepHours: entry.sleepHours,
        feelings: entry.feelings,
        reflection: entry.reflection,
        temperature: entry.temperature,
        weatherCondition: entry.weatherCondition,
        precipitation: entry.precipitation,
        entryDate: getDateOffset(entry.daysAgo)
      });
    }

    console.log('✅ MongoDB database seeded successfully!');
    console.log(`   - 1 Demo User: ${demoEmail} (Password: ${demoPassword})`);
    console.log(`   - 1 Scheduled Reminder`);
    console.log(`   - ${sampleEntries.length} Mood Entries with intentional date gaps for analytics testing`);
  } catch (err) {
    console.error('❌ Error seeding MongoDB:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

seed();
