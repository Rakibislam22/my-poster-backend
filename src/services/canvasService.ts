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
    const layout = template.layoutConfig;

    this.drawBackground(ctx, width, height, template.occasionType, layout);

    if (layout.leaderSlots && layout.leaderSlots.length > 0) {
      for (let i = 0; i < layout.leaderSlots.length; i++) {
        const slot = layout.leaderSlots[i];
        const photoUrl = photos.leaderPhotos?.[i];
        await this.drawLeaderSlot(ctx, slot, photoUrl);
      }
    }

    if (layout.candidateSlot) {
      await this.drawCandidateSlot(
        ctx,
        layout.candidateSlot,
        photos.candidatePhoto,
        layout.backgroundColor || '#005A36'
      );
    }

    const headline = formData.headlineBangla || layout.textSlots.headline.defaultBangla || '';
    if (headline) {
      this.drawHeadline(ctx, width, headline, layout.textSlots.headline);
    }

    this.drawCandidateDetails(ctx, width, formData, layout.textSlots);

    const footerText = formData.footerCredit || layout.textSlots.footerCredit.defaultBangla || 'প্রচারে: সর্বস্তরের জনগণ';
    this.drawFooter(ctx, width, height, footerText, layout.textSlots.footerCredit);

    this.drawOuterBorder(ctx, width, height, layout.secondaryColor || '#FFD700');

    return canvas.toBuffer('image/png');
  }

  private drawBackground(
    ctx: SKRSContext2D,
    width: number,
    height: number,
    occasionType: string,
    layout: any
  ) {
    const bg = layout.backgroundColor || '#005A36';
    const primary = layout.primaryColor || '#F42A41';

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, bg);
    gradient.addColorStop(0.6, bg);
    gradient.addColorStop(1, '#051b11');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    if (occasionType === 'victory_day') {
      ctx.save();
      ctx.beginPath();
      ctx.arc(width / 2, 280, 240, 0, Math.PI * 2);
      ctx.fillStyle = primary;
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.15)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(width / 2, 280, 260, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(width / 2, 280, 280, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (occasionType === 'campaign') {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width, 0);
      ctx.lineTo(width, 380);
      ctx.lineTo(0, 480);
      ctx.closePath();
      ctx.fillStyle = primary;
      ctx.fill();
      ctx.restore();
    } else if (occasionType === 'condolence') {
      ctx.fillStyle = '#111318';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = '#4A5568';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, width - 80, height - 80);
    }
  }

  private async drawLeaderSlot(ctx: SKRSContext2D, slot: any, photoUrl?: string) {
    const { x, y, width: w, height: h, borderColor = '#FFD700' } = slot;
    const radius = w / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
    ctx.fillStyle = borderColor;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#1A202C';
    ctx.fill();

    if (photoUrl) {
      try {
        const img = await this.fetchAndLoadImage(photoUrl);
        ctx.drawImage(img, x - radius, y - radius, w, h);
      } catch (err) {
        this.drawSilhouette(ctx, x, y, radius);
      }
    } else {
      this.drawSilhouette(ctx, x, y, radius);
    }

    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  private async drawCandidateSlot(
    ctx: SKRSContext2D,
    slot: any,
    photoUrl?: string,
    _bgColor?: string
  ) {
    const { x, y, width: w, height: h } = slot;
    const startX = x - w / 2;
    const startY = y - h / 2;

    ctx.save();

    if (photoUrl) {
      try {
        const img = await this.fetchAndLoadImage(photoUrl);
        ctx.drawImage(img, startX, startY, w, h);

        const fadeGradient = ctx.createLinearGradient(0, y + h / 4, 0, y + h / 2);
        fadeGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        fadeGradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
        ctx.fillStyle = fadeGradient;
        ctx.fillRect(startX, y + h / 4, w, h / 4);
      } catch (err) {
        this.drawCandidatePlaceholder(ctx, startX, startY, w, h);
      }
    } else {
      this.drawCandidatePlaceholder(ctx, startX, startY, w, h);
    }

    ctx.restore();
  }

  private drawHeadline(ctx: SKRSContext2D, width: number, text: string, slotConfig: any) {
    ctx.save();

    const fontSize = slotConfig.fontSize || 54;
    ctx.font = `bold ${fontSize}px "Hind Siliguri", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const y = slotConfig.y || 440;
    const maxWidth = width - 160;

    const lines = this.wrapText(ctx, text, maxWidth);
    const lineHeight = fontSize * 1.35;
    const totalBlockHeight = lines.length * lineHeight;

    const badgePadX = 50;
    const badgePadY = 24;
    const badgeWidth = Math.min(width - 100, Math.max(...lines.map((l) => ctx.measureText(l).width)) + badgePadX * 2);
    const badgeHeight = totalBlockHeight + badgePadY * 2;
    const badgeX = (width - badgeWidth) / 2;
    const badgeY = y - badgeHeight / 2;

    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;

    ctx.fillStyle = slotConfig.backgroundColor || '#F42A41';
    this.roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 16);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = slotConfig.color || '#FFFFFF';
    lines.forEach((line, index) => {
      const lineY = badgeY + badgePadY + (index + 0.5) * lineHeight;
      ctx.fillText(line, width / 2, lineY);
    });

    ctx.restore();
  }

  private drawCandidateDetails(
    ctx: SKRSContext2D,
    width: number,
    formData: IPosterFormData,
    textSlots: any
  ) {
    ctx.save();
    ctx.textAlign = 'center';

    const nameY = textSlots.candidateName?.y || 1320;
    const nameSize = textSlots.candidateName?.fontSize || 72;
    ctx.font = `bold ${nameSize}px "Hind Siliguri", sans-serif`;

    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = textSlots.candidateName?.color || '#FFD700';
    ctx.fillText(formData.candidateName, width / 2, nameY);

    ctx.shadowColor = 'transparent';

    if (formData.designation) {
      const desY = textSlots.designation?.y || 1400;
      const desSize = textSlots.designation?.fontSize || 38;
      ctx.font = `bold ${desSize}px "Hind Siliguri", sans-serif`;
      ctx.fillStyle = textSlots.designation?.color || '#FFFFFF';
      ctx.fillText(formData.designation, width / 2, desY);
    }

    const partyArea = [formData.party, formData.area].filter(Boolean).join(' • ');
    if (partyArea) {
      const partyY = textSlots.party?.y || 1460;
      const partySize = textSlots.party?.fontSize || 32;
      ctx.font = `${partySize}px "Hind Siliguri", sans-serif`;
      ctx.fillStyle = textSlots.party?.color || '#E2E8F0';
      ctx.fillText(partyArea, width / 2, partyY);
    }

    ctx.restore();
  }

  private drawFooter(
    ctx: SKRSContext2D,
    width: number,
    height: number,
    text: string,
    slotConfig: any
  ) {
    ctx.save();

    const barHeight = 85;
    const barY = height - barHeight;

    ctx.fillStyle = slotConfig.backgroundColor || '#003822';
    ctx.fillRect(0, barY, width, barHeight);

    ctx.fillStyle = '#FFD700';
    ctx.fillRect(0, barY, width, 5);

    const fontSize = slotConfig.fontSize || 30;
    ctx.font = `bold ${fontSize}px "Hind Siliguri", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = slotConfig.color || '#FFFFFF';
    ctx.fillText(text, width / 2, barY + barHeight / 2 + 2);

    ctx.restore();
  }

  private drawOuterBorder(ctx: SKRSContext2D, width: number, height: number, color: string) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, width - 12, height - 12);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, width - 36, height - 36);
    ctx.restore();
  }

  private wrapText(ctx: SKRSContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = `${currentLine} ${word}`;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  private roundRect(
    ctx: SKRSContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  private drawSilhouette(ctx: SKRSContext2D, x: number, y: number, r: number) {
    ctx.fillStyle = '#4A5568';
    ctx.beginPath();
    ctx.arc(x, y - r * 0.25, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y + r * 0.9, r * 0.7, Math.PI, 0);
    ctx.fill();
  }

  private drawCandidatePlaceholder(
    ctx: SKRSContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);

    const centerX = x + w / 2;
    const centerY = y + h / 2;
    this.drawSilhouette(ctx, centerX, centerY, Math.min(w, h) * 0.3);
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
