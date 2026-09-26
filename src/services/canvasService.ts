import { createCanvas, GlobalFonts, loadImage, SKRSContext2D } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';
import { IPosterFormData, IPosterUploadedPhotos } from '../models/Poster';
import { ITemplate } from '../models/Template';

class CanvasService {
  private fontsLoaded = false;

  constructor() {
    this.initFonts();
  }

  private initFonts() {
    if (this.fontsLoaded) return;

    try {
      const boldPath = path.resolve(__dirname, '../../assets/fonts/HindSiliguri-Bold.ttf');
      const regularPath = path.resolve(__dirname, '../../assets/fonts/HindSiliguri-Regular.ttf');

      if (fs.existsSync(boldPath)) {
        GlobalFonts.registerFromPath(boldPath, 'Hind Siliguri');
      }
      if (fs.existsSync(regularPath)) {
        GlobalFonts.registerFromPath(regularPath, 'Hind Siliguri');
      }

      this.fontsLoaded = true;
      console.log('🎨 CanvasService: Bengali fonts registered successfully');
    } catch (error) {
      console.warn('⚠️ CanvasService: Could not register local fonts:', error);
    }
  }

  async renderPoster(
    template: ITemplate,
    formData: IPosterFormData,
    photos: IPosterUploadedPhotos
  ): Promise<Buffer> {
    const width = template.canvasDimensions?.width || 1200;
    const height = template.canvasDimensions?.height || 1600;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const occasion = template.occasionType;

    // 1. Draw High-Resolution Professional Template Background Artwork
    const hasBgImage = await this.drawTemplateBackground(ctx, width, height, occasion);

    if (!hasBgImage) {
      this.drawFallbackBackground(ctx, width, height, occasion, template.layoutConfig);
    }

    // 2. Draw Leader Photos in Ornate Top Frames
    await this.drawLeaderPhotos(ctx, occasion, photos.leaderPhotos || [], template.layoutConfig);

    // 3. Draw Candidate Photo (in tailored arched/framed portrait window with gold border)
    if (photos.candidatePhoto) {
      await this.drawCandidatePhoto(ctx, occasion, photos.candidatePhoto, template.layoutConfig);
    }

    // 4. Draw Election Marka / Symbol for Campaign Template (fills the white circle)
    if (occasion === 'campaign') {
      this.drawCampaignMarka(ctx, formData);
    }

    // 5. Draw Crisp 3D Bengali Typography with Smart Auto-Wrap & Responsive Fitting
    this.drawBengaliTypography(ctx, width, height, occasion, formData, template.layoutConfig);

    return canvas.toBuffer('image/png');
  }

  // --- 1. Template Background Loader ---
  private async drawTemplateBackground(
    ctx: SKRSContext2D,
    width: number,
    height: number,
    occasion: string
  ): Promise<boolean> {
    const bgFilenames: Record<string, string> = {
      victory_day: 'victory-day-bg.jpg',
      campaign: 'campaign-bg.jpg',
      eid: 'eid-bg.jpg',
      condolence: 'condolence-bg.jpg',
    };

    const filename = bgFilenames[occasion] || 'victory-day-bg.jpg';
    const bgPath = path.resolve(__dirname, '../../assets/templates', filename);

    if (fs.existsSync(bgPath)) {
      try {
        const bgImg = await loadImage(bgPath);
        ctx.drawImage(bgImg, 0, 0, width, height);
        return true;
      } catch (err) {
        console.warn('⚠️ Could not load template bg image, using fallback:', err);
      }
    }
    return false;
  }

  // --- 2. Leader Photos (Clipped into Ornate Golden Rings) ---
  private async drawLeaderPhotos(
    ctx: SKRSContext2D,
    occasion: string,
    photos: string[],
    layout: any
  ) {
    const slotConfigs: Record<string, Array<{ x: number; y: number; r: number }>> = {
      victory_day: [
        { x: 254, y: 192, r: 130 },
        { x: 942, y: 192, r: 130 },
      ],
      campaign: [
        { x: 194, y: 180, r: 88 },
        { x: 431, y: 180, r: 88 },
        { x: 920, y: 284, r: 155 },
      ],
      eid: [
        { x: 180, y: 165, r: 92 },
        { x: 430, y: 165, r: 92 },
        { x: 920, y: 240, r: 165 },
      ],
      condolence: [
        { x: 600, y: 470, r: 200 },
        { x: 170, y: 460, r: 105 },
        { x: 1030, y: 460, r: 105 },
      ],
    };

    const slots = slotConfigs[occasion] || [
      { x: 254, y: 192, r: 130 },
      { x: 942, y: 192, r: 130 },
    ];

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const photoUrl = photos[i];
      if (photoUrl) {
        try {
          const img = await this.fetchAndLoadImage(photoUrl);

          ctx.save();
          ctx.beginPath();
          ctx.arc(slot.x, slot.y, slot.r, 0, Math.PI * 2);
          ctx.clip();

          const size = slot.r * 2;
          this.drawImageCover(ctx, img, slot.x - slot.r, slot.y - slot.r, size, size, 0.2);
          ctx.restore();

          // Gold border ring
          ctx.save();
          ctx.beginPath();
          ctx.arc(slot.x, slot.y, slot.r, 0, Math.PI * 2);
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.restore();
        } catch (e) {
          // Photo failed, keep blank
        }
      }
    }
  }

  // --- 3. Candidate Photo (Arched / Framed Portrait) ---
  private async drawCandidatePhoto(
    ctx: SKRSContext2D,
    occasion: string,
    photoUrl: string,
    layout: any
  ) {
    try {
      const img = await this.fetchAndLoadImage(photoUrl);

      let target = { x: 410, y: 650, w: 380, h: 480, arched: true };
      if (occasion === 'victory_day') {
        target = { x: 410, y: 650, w: 380, h: 480, arched: true };
      } else if (occasion === 'campaign') {
        target = { x: 530, y: 520, w: 500, h: 680, arched: true };
      } else if (occasion === 'eid') {
        target = { x: 55, y: 630, w: 340, h: 460, arched: true };
      } else if (occasion === 'condolence') {
        target = { x: 140, y: 760, w: 260, h: 320, arched: false };
      }

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 8;

      ctx.beginPath();
      if (target.arched) {
        const archR = 60;
        ctx.moveTo(target.x + archR, target.y);
        ctx.lineTo(target.x + target.w - archR, target.y);
        ctx.quadraticCurveTo(target.x + target.w, target.y, target.x + target.w, target.y + archR);
        ctx.lineTo(target.x + target.w, target.y + target.h);
        ctx.lineTo(target.x, target.y + target.h);
        ctx.lineTo(target.x, target.y + archR);
        ctx.quadraticCurveTo(target.x, target.y, target.x + archR, target.y);
      } else {
        ctx.rect(target.x, target.y, target.w, target.h);
      }
      ctx.closePath();
      ctx.clip();

      this.drawImageCover(ctx, img, target.x, target.y, target.w, target.h, 0.22);

      // Smooth downward alpha fade at bottom
      const fadeGrad = ctx.createLinearGradient(0, target.y + target.h * 0.75, 0, target.y + target.h);
      fadeGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      fadeGrad.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
      ctx.fillStyle = fadeGrad;
      ctx.fillRect(target.x, target.y + target.h * 0.75, target.w, target.h * 0.25);
      ctx.restore();

      // Ornate Gold Border around candidate portrait
      ctx.save();
      ctx.beginPath();
      if (target.arched) {
        const archR = 60;
        ctx.moveTo(target.x + archR, target.y);
        ctx.lineTo(target.x + target.w - archR, target.y);
        ctx.quadraticCurveTo(target.x + target.w, target.y, target.x + target.w, target.y + archR);
        ctx.lineTo(target.x + target.w, target.y + target.h);
        ctx.lineTo(target.x, target.y + target.h);
        ctx.lineTo(target.x, target.y + archR);
        ctx.quadraticCurveTo(target.x, target.y, target.x + archR, target.y);
      } else {
        ctx.rect(target.x, target.y, target.w, target.h);
      }
      ctx.closePath();
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 5;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();
    } catch (err) {
      console.warn('⚠️ Could not load candidate photo:', err);
    }
  }

  // --- 4. Campaign Marka / Symbol Renderer ---
  private drawCampaignMarka(ctx: SKRSContext2D, formData: IPosterFormData) {
    const cx = 215;
    const cy = 943;
    const r = 99;

    ctx.save();
    // Warm radial inner glow inside the white circle
    const radGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
    radGrad.addColorStop(0, '#FFFFFF');
    radGrad.addColorStop(0.7, '#FFFDF0');
    radGrad.addColorStop(1, '#FFF2C6');

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = radGrad;
    ctx.fill();

    // Outer golden ring
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Inner dashed decorative ring
    ctx.beginPath();
    ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Determine symbol text from user input
    const designation = formData.designation || '';
    const party = formData.party || '';
    let symbolText = 'ধানের শীষ';
    if (designation.includes('নৌকা') || party.includes('আওয়ামী')) {
      symbolText = 'নৌকা';
    } else if (designation.includes('লাঙ্গল') || party.includes('জাতীয় পার্টি')) {
      symbolText = 'লাঙ্গল';
    } else if (designation.includes('দাঁড়িপাল্লা')) {
      symbolText = 'দাঁড়িপাল্লা';
    } else if (designation.includes('হাতপাখা')) {
      symbolText = 'হাতপাখা';
    }

    // Draw Stylized Marka Icon
    ctx.save();
    ctx.translate(cx, cy - 10);
    ctx.fillStyle = '#C8960C';
    ctx.strokeStyle = '#8E6503';
    ctx.lineWidth = 2;

    if (symbolText === 'ধানের শীষ') {
      // Golden Sheaf of Paddy
      ctx.beginPath();
      ctx.moveTo(0, 38);
      ctx.quadraticCurveTo(-4, 0, 0, -38);
      ctx.stroke();

      for (let i = 0; i < 5; i++) {
        const gy = 24 - i * 13;
        ctx.save();
        ctx.translate(-7, gy);
        ctx.rotate(-0.4);
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 4.5, -0.3, 0, Math.PI * 2);
        ctx.fillStyle = '#E5B218';
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.translate(7, gy - 3);
        ctx.rotate(0.4);
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 4.5, 0.3, 0, Math.PI * 2);
        ctx.fillStyle = '#F2C838';
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    } else {
      // Boat or General Marka Badge
      ctx.beginPath();
      ctx.moveTo(-35, 10);
      ctx.quadraticCurveTo(0, 25, 35, 10);
      ctx.lineTo(25, -5);
      ctx.lineTo(-25, -5);
      ctx.closePath();
      ctx.fillStyle = '#8E4A03';
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(0, -32);
      ctx.lineTo(20, -18);
      ctx.closePath();
      ctx.fillStyle = '#DC2626';
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // Marka Text inside the badge
    ctx.save();
    ctx.font = 'bold 22px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#02381F';
    ctx.fillText(symbolText, cx, cy + 54);
    ctx.font = 'bold 16px "Hind Siliguri", sans-serif';
    ctx.fillStyle = '#C53030';
    ctx.fillText('মার্কায় ভোট দিন', cx, cy + 74);
    ctx.restore();

    ctx.restore();
  }

  // --- 5. 3D Bengali Typography with Smart Multi-line / Auto-Wrap ---
  private drawBengaliTypography(
    ctx: SKRSContext2D,
    width: number,
    height: number,
    occasion: string,
    formData: IPosterFormData,
    layout: any
  ) {
    if (occasion === 'victory_day') {
      const headline = formData.headlineBangla || '১৬ই ডিসেম্বর মহান বিজয় দিবস';
      this.drawSmart3DText(ctx, headline, width / 2, 515, {
        fontSize: 56,
        minFontSize: 32,
        maxWidth: 1050,
        fillColor: '#DC2626',
        strokeColor: '#FFFFFF',
        strokeWidth: 8,
        shadowColor: 'rgba(0,0,0,0.9)',
      });

      this.drawSmart3DText(ctx, 'বীর শহীদদের প্রতি বিনম্র শ্রদ্ধা', width / 2, 580, {
        fontSize: 42,
        minFontSize: 28,
        maxWidth: 950,
        fillColor: '#FFD700',
        strokeColor: '#01381A',
        strokeWidth: 7,
        shadowColor: 'rgba(0,0,0,0.85)',
      });

      // Candidate Details inside bottom ivory card
      ctx.save();
      ctx.font = 'bold 74px "Hind Siliguri", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#01381A';
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;
      ctx.fillText(formData.candidateName || 'মোঃ রাকিবুল হাসান', width / 2, 1180);

      if (formData.designation) {
        ctx.font = 'bold 42px "Hind Siliguri", sans-serif';
        ctx.fillStyle = '#C53030';
        ctx.fillText(formData.designation, width / 2, 1250);
      }

      const partyArea = [formData.party, formData.area].filter(Boolean).join(' • ');
      if (partyArea) {
        ctx.font = '32px "Hind Siliguri", sans-serif';
        ctx.fillStyle = '#2D3748';
        ctx.fillText(partyArea, width / 2, 1310);
      }

      const credit = formData.footerCredit || 'প্রচারে: সর্বস্তরের দেশপ্রেমিক কর্মীসমাজ ও এলাকাবাসী';
      ctx.font = 'bold 28px "Hind Siliguri", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(credit, width / 2, 1545);
      ctx.restore();
    } else if (occasion === 'campaign') {
      const headline = formData.headlineBangla || 'আসন্ন জাতীয় সংসদ নির্বাচনে মনোনীত প্রার্থী';
      this.drawSmart3DText(ctx, headline, width / 2, 360, {
        fontSize: 54,
        minFontSize: 30,
        maxWidth: 1050,
        fillColor: '#DC2626',
        strokeColor: '#FFFFFF',
        strokeWidth: 8,
        shadowColor: 'rgba(0,0,0,0.85)',
      });

      const areaText = formData.area ? `${formData.area} আসনে জনগণের দোয়া ও সমর্থন প্রার্থী` : 'জনগণের দোয়া ও সমর্থন প্রার্থী';
      this.drawSmart3DText(ctx, areaText, width / 2, 425, {
        fontSize: 38,
        minFontSize: 26,
        maxWidth: 950,
        fillColor: '#02381F',
        strokeColor: '#FFFFFF',
        strokeWidth: 6,
      });

      // Bottom green banner for candidate
      ctx.save();
      ctx.font = 'bold 74px "Hind Siliguri", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 10;
      const candidateLine = `${formData.candidateName || 'প্রার্থীর নাম'}-কে`;
      ctx.fillText(candidateLine, width / 2, 1340);

      ctx.font = 'bold 48px "Hind Siliguri", sans-serif';
      ctx.fillStyle = '#FFD700';
      const desText = formData.designation || 'ধানের শীষ মার্কায় ভোট দিন';
      ctx.fillText(desText, width / 2, 1415);

      const credit = formData.footerCredit || 'প্রচারে: সর্বস্তরের সচেতন ও দেশপ্রেমিক কর্মীসমাজ';
      ctx.font = '28px "Hind Siliguri", sans-serif';
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(credit, width / 2, 1530);
      ctx.restore();
    } else if (occasion === 'eid') {
      this.drawSmart3DText(ctx, 'ঈদ মোবারক', width / 2, 430, {
        fontSize: 88,
        minFontSize: 48,
        maxWidth: 1000,
        fillColor: '#DC2626',
        strokeColor: '#FFFFFF',
        strokeWidth: 10,
        shadowColor: 'rgba(0,0,0,0.85)',
      });

      const subSlogan = formData.headlineBangla || 'পবিত্র ঈদ উপলক্ষে জানাই আন্তরিক শুভেচ্ছা';
      this.drawSmart3DText(ctx, subSlogan, width / 2, 510, {
        fontSize: 44,
        minFontSize: 28,
        maxWidth: 950,
        fillColor: '#FFD700',
        strokeColor: '#01381A',
        strokeWidth: 7,
      });

      ctx.save();
      ctx.font = 'bold 72px "Hind Siliguri", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 8;
      ctx.fillText(formData.candidateName || 'প্রার্থীর নাম', width / 2, 1340);

      if (formData.designation) {
        ctx.font = 'bold 42px "Hind Siliguri", sans-serif';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(formData.designation, width / 2, 1415);
      }

      const credit = formData.footerCredit || 'শুভেচ্ছান্তে: সর্বস্তরের জনগণ';
      ctx.font = '28px "Hind Siliguri", sans-serif';
      ctx.fillStyle = '#CBD5E0';
      ctx.fillText(credit, width / 2, 1545);
      ctx.restore();
    } else {
      const headline = formData.headlineBangla || '১৫ আগস্ট জাতীয় শোক দিবস';
      this.drawSmart3DText(ctx, headline, width / 2, 780, {
        fontSize: 60,
        minFontSize: 32,
        maxWidth: 1050,
        fillColor: '#FFFFFF',
        strokeColor: '#8B0000',
        strokeWidth: 9,
        shadowColor: 'rgba(0,0,0,0.95)',
      });

      this.drawSmart3DText(ctx, 'গভীর শ্রদ্ধাঞ্জলি ও শোক প্রস্তাব', width / 2, 850, {
        fontSize: 46,
        minFontSize: 26,
        maxWidth: 950,
        fillColor: '#FFD700',
        strokeColor: '#3B0207',
        strokeWidth: 8,
      });

      ctx.save();
      ctx.font = 'bold 68px "Hind Siliguri", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#1A0002';
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 6;
      ctx.fillText(formData.candidateName || 'আপনার নাম...', width / 2, 1340);

      if (formData.designation) {
        ctx.font = 'bold 38px "Hind Siliguri", sans-serif';
        ctx.fillStyle = '#8B0000';
        ctx.fillText(formData.designation, width / 2, 1405);
      }

      const credit = formData.footerCredit || 'শোক প্রকাশে: সর্বস্তরের শুভাকাঙ্ক্ষী ও সহযোদ্ধাবৃন্দ';
      ctx.font = '26px "Hind Siliguri", sans-serif';
      ctx.fillStyle = '#4A5568';
      ctx.fillText(credit, width / 2, 1530);
      ctx.restore();
    }
  }

  // --- Smart Multi-Line & Auto-Scaling 3D Bengali Text ---
  private drawSmart3DText(
    ctx: SKRSContext2D,
    text: string,
    x: number,
    y: number,
    opts: {
      fontSize: number;
      minFontSize?: number;
      maxWidth: number;
      fillColor: string;
      strokeColor: string;
      strokeWidth: number;
      shadowColor?: string;
      shadowBlur?: number;
    }
  ) {
    ctx.save();
    let fontSize = opts.fontSize || 56;
    const minFontSize = opts.minFontSize || 26;
    const maxWidth = opts.maxWidth || 1050;

    ctx.font = `bold ${fontSize}px "Hind Siliguri", sans-serif`;
    let textWidth = ctx.measureText(text).width;

    if (textWidth > maxWidth) {
      // Split into 2 balanced lines if long text
      const words = text.split(' ');
      let bestLine1 = '';
      let bestLine2 = '';
      let minDiff = Infinity;

      for (let i = 1; i < words.length; i++) {
        const l1 = words.slice(0, i).join(' ');
        const l2 = words.slice(i).join(' ');
        const w1 = ctx.measureText(l1).width;
        const w2 = ctx.measureText(l2).width;
        const maxW = Math.max(w1, w2);
        if (maxW < maxWidth) {
          const diff = Math.abs(w1 - w2);
          if (diff < minDiff) {
            minDiff = diff;
            bestLine1 = l1;
            bestLine2 = l2;
          }
        }
      }

      if (bestLine1 && bestLine2) {
        const lineGap = fontSize * 1.1;
        this.render3DLine(ctx, bestLine1, x, y - lineGap / 2, fontSize, opts);
        this.render3DLine(ctx, bestLine2, x, y + lineGap / 2, fontSize, opts);
        ctx.restore();
        return;
      }

      // If cannot split evenly, shrink font size smoothly
      while (textWidth > maxWidth && fontSize > minFontSize) {
        fontSize -= 2;
        ctx.font = `bold ${fontSize}px "Hind Siliguri", sans-serif`;
        textWidth = ctx.measureText(text).width;
      }
    }

    this.render3DLine(ctx, text, x, y, fontSize, opts);
    ctx.restore();
  }

  private render3DLine(
    ctx: SKRSContext2D,
    text: string,
    x: number,
    y: number,
    fontSize: number,
    opts: {
      fillColor: string;
      strokeColor: string;
      strokeWidth: number;
      shadowColor?: string;
      shadowBlur?: number;
    }
  ) {
    ctx.save();
    ctx.font = `bold ${fontSize}px "Hind Siliguri", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 1. Deep shadow pass
    ctx.shadowColor = opts.shadowColor || 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = opts.shadowBlur || 12;
    ctx.shadowOffsetY = 4;
    ctx.strokeStyle = opts.strokeColor;
    ctx.lineWidth = opts.strokeWidth;
    ctx.strokeText(text, x, y);

    // 2. Crisp stroke outline
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = opts.strokeColor;
    ctx.lineWidth = opts.strokeWidth;
    ctx.strokeText(text, x, y);

    // 3. Inner fill
    ctx.fillStyle = opts.fillColor;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  // --- Fallback Vector Background ---
  private drawFallbackBackground(
    ctx: SKRSContext2D,
    width: number,
    height: number,
    occasion: string,
    layout: any
  ) {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#004724');
    bgGrad.addColorStop(0.5, '#005a30');
    bgGrad.addColorStop(1, '#002613');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // --- Smart Aspect-Fill Cover Renderer (Zero Face Distortion) ---
  private drawImageCover(
    ctx: SKRSContext2D,
    img: any,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    focusY = 0.25
  ) {
    const imgW = img.width;
    const imgH = img.height;
    const imgRatio = imgW / imgH;
    const targetRatio = dw / dh;

    let sx = 0;
    let sy = 0;
    let sw = imgW;
    let sh = imgH;

    if (imgRatio > targetRatio) {
      // Wider than target: crop left & right symmetrically
      sw = imgH * targetRatio;
      sx = (imgW - sw) / 2;
    } else {
      // Taller than target: crop vertically, keeping upper head/face region
      sh = imgW / targetRatio;
      sy = Math.max(0, Math.min(imgH - sh, (imgH - sh) * focusY));
    }

    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  private async fetchAndLoadImage(imageUrl: string) {
    if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('http://localhost')) {
      const cleanPath = imageUrl.includes('/uploads/')
        ? imageUrl.substring(imageUrl.indexOf('/uploads/'))
        : imageUrl;
      const localFilePath = path.resolve(__dirname, '../..', `.${cleanPath}`);
      if (fs.existsSync(localFilePath)) {
        const buffer = await fs.promises.readFile(localFilePath);
        return loadImage(buffer);
      }
    }

    const res = await fetch(imageUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch image: ${imageUrl}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return loadImage(Buffer.from(arrayBuffer));
  }
}

export const canvasService = new CanvasService();
