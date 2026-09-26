import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { Template } from '../src/models/Template';
import { seedDatabase, seedTemplatesData } from '../src/utils/seedDatabase';

async function runSeed() {
  try {
    console.log('🌱 Connecting to MongoDB to seed templates...');
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB.');

    await Template.deleteMany({});
    console.log('🧹 Cleared existing templates.');

    await seedDatabase(true);

    const templates = await Template.find({});
    console.log(`🎉 Successfully seeded ${templates.length} poster templates!`);

    for (const t of templates) {
      console.log(`   - [${t.occasionType}] ${t.title} (ID: ${t._id})`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Template seeding error:', error);
    process.exit(1);
  }
}

runSeed();
