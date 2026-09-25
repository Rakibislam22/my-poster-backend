import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { Template } from '../src/models/Template';

const seedTemplatesData = [
  {
    title: 'মহান বিজয় দিবস - লাল-সবুজ শ্রদ্ধাঞ্জলি',
    occasionType: 'victory_day' as const,
    thumbnailUrl: '/templates/thumbnails/victory-day-thumb.png',
    canvasDimensions: { width: 1200, height: 1600 },
    layoutConfig: {
      backgroundColor: '#005A36',
      primaryColor: '#F42A41',
      secondaryColor: '#FFD700',
      leaderSlots: [
        {
          id: 'leader-1',
          label: 'শীর্ষ নেতা ১',
          x: 220,
          y: 180,
          width: 220,
          height: 220,
          shape: 'circle' as const,
          borderColor: '#FFD700',
        },
        {
          id: 'leader-2',
          label: 'শীর্ষ নেতা ২',
          x: 980,
          y: 180,
          width: 220,
          height: 220,
          shape: 'circle' as const,
          borderColor: '#FFD700',
        },
      ],
      candidateSlot: {
        x: 600,
        y: 820,
        width: 650,
        height: 850,
        blendBottom: true,
      },
      textSlots: {
        headline: {
          label: 'প্রধান স্লোগান / শিরোনাম',
          fontFamily: 'Hind Siliguri',
          fontSize: 64,
          color: '#FFFFFF',
          align: 'center' as const,
          y: 420,
          defaultBangla: '১৬ই ডিসেম্বর মহান বিজয় দিবস উপলক্ষে বীর শহীদদের প্রতি বিনম্র শ্রদ্ধা',
          backgroundColor: '#F42A41',
        },
        candidateName: {
          label: 'প্রার্থীর নাম',
          fontFamily: 'Hind Siliguri',
          fontSize: 72,
          color: '#FFD700',
          align: 'center' as const,
          y: 1320,
          defaultBangla: 'মোঃ রাকিবুল হাসান',
        },
        designation: {
          label: 'পদবি / পরিচয়',
          fontFamily: 'Hind Siliguri',
          fontSize: 38,
          color: '#FFFFFF',
          align: 'center' as const,
          y: 1400,
          defaultBangla: 'সাধারণ সম্পাদক পদপ্রার্থী',
        },
        party: {
          label: 'সংগঠন / দলীয় শাখা',
          fontFamily: 'Hind Siliguri',
          fontSize: 32,
          color: '#E2E8F0',
          align: 'center' as const,
          y: 1460,
          defaultBangla: 'ঢাকা মহানগর উত্তর',
        },
        footerCredit: {
          label: 'প্রচারে লাইন',
          fontFamily: 'Hind Siliguri',
          fontSize: 30,
          color: '#FFFFFF',
          align: 'center' as const,
          y: 1540,
          defaultBangla: 'প্রচারে: এলাবাসী ও সর্বস্তরের জাতীয়তাবাদী কর্মীসমাজ',
          backgroundColor: '#003822',
        },
      },
    },
    isActive: true,
  },
  {
    title: 'নির্বাচনী প্রচারণা ও দোয়া প্রার্থী',
    occasionType: 'campaign' as const,
    thumbnailUrl: '/templates/thumbnails/campaign-thumb.png',
    canvasDimensions: { width: 1200, height: 1600 },
    layoutConfig: {
      backgroundColor: '#0F2027',
      primaryColor: '#203A43',
      secondaryColor: '#FFCC00',
      leaderSlots: [
        {
          id: 'leader-1',
          label: 'প্রতিষ্ঠাতা / প্রধান নেতা',
          x: 200,
          y: 150,
          width: 180,
          height: 180,
          shape: 'circle' as const,
          borderColor: '#FFFFFF',
        },
        {
          id: 'leader-2',
          label: 'দলীয় চেয়ারপারসন / সভানেত্রী',
          x: 600,
          y: 130,
          width: 220,
          height: 220,
          shape: 'circle' as const,
          borderColor: '#FFCC00',
        },
        {
          id: 'leader-3',
          label: 'ভারপ্রাপ্ত চেয়ারম্যান / সাধারণ সম্পাদক',
          x: 1000,
          y: 150,
          width: 180,
          height: 180,
          shape: 'circle' as const,
          borderColor: '#FFFFFF',
        },
      ],
      candidateSlot: {
        x: 600,
        y: 800,
        width: 700,
        height: 900,
        blendBottom: true,
      },
      textSlots: {
        headline: {
          label: 'নির্বাচনী বার্তা',
          fontFamily: 'Hind Siliguri',
          fontSize: 56,
          color: '#FFFFFF',
          align: 'center' as const,
          y: 380,
          defaultBangla: 'আসন্ন নির্বাচনে আপনাদের মূল্যবান সমর্থন ও দোয়া প্রার্থী',
          backgroundColor: '#E53E3E',
        },
        candidateName: {
          label: 'প্রার্থীর নাম',
          fontFamily: 'Hind Siliguri',
          fontSize: 76,
          color: '#FFD700',
          align: 'center' as const,
          y: 1310,
          defaultBangla: 'আলহাজ্ব মোঃ সারোয়ার হোসেন',
        },
        designation: {
          label: 'প্রার্থিতা পদ',
          fontFamily: 'Hind Siliguri',
          fontSize: 42,
          color: '#FFFFFF',
          align: 'center' as const,
          y: 1395,
          defaultBangla: 'মেয়র পদপ্রার্থী',
        },
        party: {
          label: 'দলীয় প্রতীক / মনোনয়ন',
          fontFamily: 'Hind Siliguri',
          fontSize: 34,
          color: '#A0AEC0',
          align: 'center' as const,
          y: 1455,
          defaultBangla: 'গণমানুষের আস্থার প্রতীক',
        },
        footerCredit: {
          label: 'প্রচারে লাইন',
          fontFamily: 'Hind Siliguri',
          fontSize: 32,
          color: '#FFFFFF',
          align: 'center' as const,
          y: 1540,
          defaultBangla: 'প্রচারে: সচেতন নাগরিক সমাজ ও সর্বস্তরের জনগণ',
          backgroundColor: '#1A202C',
        },
      },
    },
    isActive: true,
  },
  {
    title: 'শোক প্রস্তাব ও বিনম্র শ্রদ্ধাঞ্জলি',
    occasionType: 'condolence' as const,
    thumbnailUrl: '/templates/thumbnails/condolence-thumb.png',
    canvasDimensions: { width: 1200, height: 1600 },
    layoutConfig: {
      backgroundColor: '#171923',
      primaryColor: '#2D3748',
      secondaryColor: '#CBD5E0',
      leaderSlots: [
        {
          id: 'leader-1',
          label: 'নেতৃত্ব',
          x: 600,
          y: 140,
          width: 190,
          height: 190,
          shape: 'circle' as const,
          borderColor: '#CBD5E0',
        },
      ],
      candidateSlot: {
        x: 600,
        y: 680,
        width: 550,
        height: 650,
        blendBottom: false,
      },
      textSlots: {
        headline: {
          label: 'শোক বাণী',
          fontFamily: 'Hind Siliguri',
          fontSize: 60,
          color: '#E2E8F0',
          align: 'center' as const,
          y: 320,
          defaultBangla: 'আমরা গভীরভাবে শোকাহত ও মর্মাহত - বিনম্র শ্রদ্ধা',
          backgroundColor: '#000000',
        },
        candidateName: {
          label: 'মরহুমের নাম',
          fontFamily: 'Hind Siliguri',
          fontSize: 70,
          color: '#FFFFFF',
          align: 'center' as const,
          y: 1120,
          defaultBangla: 'মরহুম কাজী শামসুল হুদা',
        },
        designation: {
          label: 'সাবেক পদবি',
          fontFamily: 'Hind Siliguri',
          fontSize: 36,
          color: '#CBD5E0',
          align: 'center' as const,
          y: 1210,
          defaultBangla: 'সাবেক সহ-সভাপতি ও বর্ষীয়ান রাজনীতিবিদ',
        },
        party: {
          label: 'সংগঠন',
          fontFamily: 'Hind Siliguri',
          fontSize: 32,
          color: '#A0AEC0',
          align: 'center' as const,
          y: 1270,
          defaultBangla: 'জেলা কমিটি',
        },
        footerCredit: {
          label: 'শোক প্রকাশে',
          fontFamily: 'Hind Siliguri',
          fontSize: 32,
          color: '#FFFFFF',
          align: 'center' as const,
          y: 1540,
          defaultBangla: 'শোক প্রকাশে: সহযোদ্ধাবৃন্দ ও সর্বস্তরের শুভাকাঙ্ক্ষী',
          backgroundColor: '#000000',
        },
      },
    },
    isActive: true,
  },
];

async function runSeed() {
  try {
    console.log('🌱 Connecting to MongoDB to seed templates...');
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB.');

    await Template.deleteMany({});
    console.log('🧹 Cleared existing templates.');

    const created = await Template.insertMany(seedTemplatesData);
    console.log(`🎉 Successfully seeded ${created.length} poster templates!`);

    for (const t of created) {
      console.log(`   - [${t.occasionType}] ${t.title} (ID: ${t._id})`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Template seeding error:', error);
    process.exit(1);
  }
}

runSeed();
