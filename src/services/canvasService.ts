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
    const height = template.canvasDimensions?.height || 800;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const occasion = template.occasionType;

    // 1. Draw High-Resolution Professional Template Background Artwork (base layer)
    const hasBgImage = await this.drawTemplateBackground(ctx, width, height, occasion);
    if (!hasBgImage) {
      this.drawFallbackBackground(ctx, width, height, occasion, template.layoutConfig);
    }

    // 2. Draw Candidate Photo behind the frame cutouts
    if (photos.candidatePhoto) {
      await this.drawCandidatePhoto(ctx, occasion, photos.candidatePhoto, template.layoutConfig);
    }

    // 3. Draw Leader Photos behind the frame cutouts
    if (photos.leaderPhotos && photos.leaderPhotos.length > 0) {
      await this.drawLeaderPhotos(ctx, occasion, photos.leaderPhotos, template.layoutConfig);
    }

    // 4. Draw Template Frame with transparent cutouts ON TOP (Sandwich overlay)
    // Sits circular ornate borders and painted brush banner over the photos
    await this.drawTemplateFrameOverlay(ctx, width, height, occasion);

    // 5. Draw Crisp Bengali Typography inside Brush Banner and Footer
    this.drawBengaliTypography(ctx, width, height, occasion, formData, template.layoutConfig);

    return canvas.toBuffer('image/png');
  }

  // --- Template Calibrated Slot & Banner Configs ---
  private readonly templateConfigs: Record<string, {
    candidate: { cx: number; cy: number; r: number };
    leaders: Array<{ cx: number; cy: number; r: number }>;
    banner: { cx: number; yName: number; yDes: number; angle: number };
    defaultCredit: string;
    defaultDes: string;
  }> = {
      campaign: {
        candidate: { cx: 293, cy: 364, r: 225 },
        leaders: [
          { cx: 654, cy: 145, r: 92 },
          { cx: 844, cy: 145, r: 92 },
          { cx: 1063, cy: 145, r: 92 },
        ],
        banner: { cx: 250, yName: 585, yDes: 630, angle: -0.05 },
        defaultCredit: 'প্রচারে: সর্বস্তরের সচেতন ও দেশপ্রেমিক কর্মীসমাজ',
        defaultDes: 'ধানের শীষ মার্কায় ভোট দিন',
      },
      victory_day: {
        candidate: { cx: 285, cy: 345, r: 220 },
        leaders: [
          { cx: 647, cy: 145, r: 92 },
          { cx: 841, cy: 145, r: 92 },
          { cx: 1050, cy: 145, r: 92 },
        ],
        banner: { cx: 245, yName: 600, yDes: 645, angle: -0.04 },
        defaultCredit: 'প্রচারে: সর্বস্তরের দেশপ্রেমিক জনগণ',
        defaultDes: 'সহ-সভাপতি পদপ্রার্থী',
      },
      condolence: {
        candidate: { cx: 295, cy: 350, r: 228 },
        leaders: [
          { cx: 630, cy: 155, r: 95 },
          { cx: 840, cy: 155, r: 95 },
          { cx: 1055, cy: 155, r: 95 },
        ],
        banner: { cx: 240, yName: 620, yDes: 665, angle: -0.04 },
        defaultCredit: 'শোক প্রকাশে: পরিবারবর্গ ও সর্বস্তরের শুভাকাঙ্ক্ষী',
        defaultDes: 'তাঁর বিদেহী আত্মার মাগফিরাত কামনা করছি',
      },
      eid: {
        candidate: { cx: 300, cy: 360, r: 225 },
        leaders: [
          { cx: 635, cy: 150, r: 92 },
          { cx: 842, cy: 150, r: 92 },
          { cx: 1060, cy: 150, r: 92 },
        ],
        banner: { cx: 245, yName: 625, yDes: 670, angle: -0.04 },
        defaultCredit: 'শুভেচ্ছান্তে: সর্বস্তরের এলাকাবাসী',
        defaultDes: 'পবিত্র ঈদুল ফিতরের শুভেচ্ছা ও মোবারকবাদ',
      },
    };

  // --- 1. Template Background Loader ---
  private async drawTemplateBackground(
    ctx: SKRSContext2D,
    width: number,
    height: number,
    occasion: string
  ): Promise<boolean> {
    const filename = `${occasion.replace(/_/g, '-')}-bg.jpg`;
    const altFilename = `${occasion}-bg.jpg`;
    let bgPath = path.resolve(__dirname, '../../assets/templates', filename);
    if (!fs.existsSync(bgPath)) {
      bgPath = path.resolve(__dirname, '../../assets/templates', altFilename);
    }

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

  // --- 2. Template Frame Overlay (Cutouts) ---
  private async drawTemplateFrameOverlay(
    ctx: SKRSContext2D,
    width: number,
    height: number,
    occasion: string
  ): Promise<boolean> {
    const filename = `${occasion.replace(/_/g, '-')}-frame.png`;
    const altFilename = `${occasion}-frame.png`;
    let framePath = path.resolve(__dirname, '../../assets/templates', filename);
    if (!fs.existsSync(framePath)) {
      framePath = path.resolve(__dirname, '../../assets/templates', altFilename);
    }

    if (fs.existsSync(framePath)) {
      try {
        const frameImg = await loadImage(framePath);
        ctx.drawImage(frameImg, 0, 0, width, height);
        return true;
      } catch (err) {
        console.warn('⚠️ Could not load template frame overlay:', err);
      }
    }
    return false;
  }

  // --- 3. Leader Photos ---
  private async drawLeaderPhotos(
    ctx: SKRSContext2D,
    occasion: string,
    photos: string[],
    layout: any
  ) {
    const cfg = this.templateConfigs[occasion] || this.templateConfigs.campaign;
    const slots = cfg.leaders;

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const photoUrl = photos[i];
      if (photoUrl) {
        try {
          const img = await this.fetchAndLoadImage(photoUrl);

          ctx.save();
          ctx.beginPath();
          const lr = slot.r + 4;
          ctx.arc(slot.cx, slot.cy, lr, 0, Math.PI * 2);
          ctx.clip();

          const size = lr * 2;
          this.drawImageCover(ctx, img, slot.cx - lr, slot.cy - lr, size, size, 0.2);
          ctx.restore();
        } catch (e) {
          // Photo failed, keep blank
        }
      }
    }
  }

  // --- 4. Candidate Photo ---
  private async drawCandidatePhoto(
    ctx: SKRSContext2D,
    occasion: string,
    photoUrl: string,
    layout: any
  ) {
    try {
      const img = await this.fetchAndLoadImage(photoUrl);
      const cfg = this.templateConfigs[occasion] || this.templateConfigs.campaign;
      const cand = cfg.candidate;

      ctx.save();
      ctx.beginPath();
      const cr = cand.r + 6;
      ctx.arc(cand.cx, cand.cy, cr, 0, Math.PI * 2);
      ctx.clip();

      const size = cr * 2;
      this.drawImageCover(ctx, img, cand.cx - cr, cand.cy - cr, size, size, 0.2);
      ctx.restore();
    } catch (err) {
      console.warn('⚠️ Could not load candidate photo:', err);
    }
  }

  // --- 5. Bengali Typography in Tailored Placement Zones ---
  private drawBengaliTypography(
    ctx: SKRSContext2D,
    width: number,
    height: number,
    occasion: string,
    formData: IPosterFormData,
    layout: any
  ) {
    const cfg = this.templateConfigs[occasion] || this.templateConfigs.campaign;
    const banner = cfg.banner;

    // 1. Candidate Name & Designation inside painted brush banner with authentic angle
    ctx.save();
    ctx.translate(banner.cx, banner.yName);
    if (banner.angle) {
      ctx.rotate(banner.angle);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const candName = formData.candidateName || 'প্রার্থীর নাম';
    ctx.font = 'bold 36px "Hind Siliguri", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.fillText(candName, 0, 0);

    // 2. Candidate Designation directly below name
    const desText = formData.designation || cfg.defaultDes;
    ctx.font = 'bold 22px "Hind Siliguri", sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 1;
    ctx.fillText(desText, 0, banner.yDes - banner.yName);
    ctx.restore();

    // 3. Footer Credit at the bottom
    const credit = formData.footerCredit || cfg.defaultCredit;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 20px "Hind Siliguri", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.fillText(credit, width / 2, 785);
    ctx.restore();
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
