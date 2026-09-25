import fs from 'fs';
import path from 'path';
import { canvasService } from '../src/services/canvasService';

async function testRender() {
  console.log('🚀 Starting Bengali Poster Rendering verification test...');

  const mockTemplate: any = {
    title: 'মহান বিজয় দিবস - লাল-সবুজ শ্রদ্ধাঞ্জলি',
    occasionType: 'victory_day',
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
          shape: 'circle',
          borderColor: '#FFD700',
        },
        {
          id: 'leader-2',
          label: 'শীর্ষ নেতা ২',
          x: 980,
          y: 180,
          width: 220,
          height: 220,
          shape: 'circle',
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
          fontSize: 62,
          color: '#FFFFFF',
          align: 'center',
          y: 430,
          defaultBangla: '১৬ই ডিসেম্বর মহান বিজয় দিবস উপলক্ষে বীর শহীদদের প্রতি বিনম্র শ্রদ্ধা',
          backgroundColor: '#F42A41',
        },
        candidateName: {
          label: 'প্রার্থীর নাম',
          fontFamily: 'Hind Siliguri',
          fontSize: 74,
          color: '#FFD700',
          align: 'center',
          y: 1320,
          defaultBangla: 'মোঃ রাকিবুল হাসান',
        },
        designation: {
          label: 'পদবি / পরিচয়',
          fontFamily: 'Hind Siliguri',
          fontSize: 38,
          color: '#FFFFFF',
          align: 'center',
          y: 1400,
          defaultBangla: 'সাধারণ সম্পাদক পদপ্রার্থী',
        },
        party: {
          label: 'সংগঠন / দলীয় শাখা',
          fontFamily: 'Hind Siliguri',
          fontSize: 32,
          color: '#E2E8F0',
          align: 'center',
          y: 1460,
          defaultBangla: 'ঢাকা মহানগর উত্তর',
        },
        footerCredit: {
          label: 'প্রচারে লাইন',
          fontFamily: 'Hind Siliguri',
          fontSize: 30,
          color: '#FFFFFF',
          align: 'center',
          y: 1540,
          defaultBangla: 'প্রচারে: এলাবাসী ও সর্বস্তরের জাতীয়তাবাদী কর্মীসমাজ',
          backgroundColor: '#003822',
        },
      },
    },
  };

  const mockFormData: any = {
    headlineBangla: '১৬ই ডিসেম্বর মহান বিজয় দিবস উপলক্ষে বীর শহীদদের প্রতি বিনম্র শ্রদ্ধা',
    candidateName: 'মোঃ রাকিবুল হাসান',
    designation: 'সাধারণ সম্পাদক পদপ্রার্থী',
    party: 'বাংলাদেশ জাতীয়তাবাদী দল',
    area: 'রামপুরা, ঢাকা',
    footerCredit: 'প্রচারে: এলাবাসী ও সর্বস্তরের দেশপ্রেমিক কর্মীসমাজ',
  };

  const mockPhotos: any = {
    leaderPhotos: [],
    candidatePhoto: undefined,
  };

  const start = Date.now();
  const buffer = await canvasService.renderPoster(mockTemplate, mockFormData, mockPhotos);
  const elapsed = Date.now() - start;

  const outputDir = path.resolve(__dirname, '../../uploads/posters');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'test-verification-poster.png');
  fs.writeFileSync(outputPath, buffer);

  console.log(`✅ Success! High-resolution poster rendered in ${elapsed}ms`);
  console.log(`📁 Saved to: ${outputPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

testRender().catch((err) => {
  console.error('❌ Test render failed:', err);
  process.exit(1);
});
