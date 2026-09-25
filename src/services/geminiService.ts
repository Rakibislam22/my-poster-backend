import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';

export interface SloganGenerationParams {
  occasionType: string;
  candidateName: string;
  designation?: string;
  party?: string;
  area?: string;
  customNotes?: string;
  userHeadline?: string;
}

export interface GeminiSuggestionResult {
  headlineBangla: string;
  subtitleBangla?: string;
  footerCreditBangla: string;
  promptUsed: string;
  tokensUsed: number;
  isAiGenerated: boolean;
}

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (env.GEMINI_API_KEY) {
      try {
        this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        console.log('🤖 GeminiService: Google Gemini AI initialized');
      } catch (err) {
        console.warn('⚠️ GeminiService: Failed to initialize Google Gen AI client:', err);
      }
    } else {
      console.log('💡 GeminiService: GEMINI_API_KEY not configured. Intelligent fallback generator will be used.');
    }
  }

  async generatePosterCopy(params: SloganGenerationParams): Promise<GeminiSuggestionResult> {
    const prompt = this.buildPrompt(params);

    if (this.genAI && env.GEMINI_API_KEY) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const parsed = JSON.parse(text);

        return {
          headlineBangla: parsed.headlineBangla || params.userHeadline || this.getDefaultHeadline(params.occasionType),
          subtitleBangla: parsed.subtitleBangla || '',
          footerCreditBangla: parsed.footerCreditBangla || this.getDefaultFooter(params),
          promptUsed: prompt,
          tokensUsed: response.usageMetadata?.totalTokenCount || 0,
          isAiGenerated: true,
        };
      } catch (error) {
        console.warn('⚠️ Gemini API error or fallback triggered:', error);
      }
    }

    return {
      headlineBangla: params.userHeadline || this.getDefaultHeadline(params.occasionType),
      subtitleBangla: params.designation ? `${params.designation} পদপ্রার্থী` : '',
      footerCreditBangla: this.getDefaultFooter(params),
      promptUsed: 'Rule-based fallback generator',
      tokensUsed: 0,
      isAiGenerated: false,
    };
  }

  private buildPrompt(params: SloganGenerationParams): string {
    return `You are an expert copywriter for Bangladeshi political and social event posters.
Generate catchy, culturally authentic, and grammatically correct Bengali text fields for a poster.

Occasion: ${params.occasionType}
Candidate Name: ${params.candidateName}
Designation / Position: ${params.designation || 'Not specified'}
Political Party / Org: ${params.party || 'Not specified'}
Area / Constituency: ${params.area || 'Not specified'}
User's Preferred Headline: ${params.userHeadline || 'None provided'}
Additional Instructions: ${params.customNotes || 'None'}

Return ONLY a valid JSON object matching this schema:
{
  "headlineBangla": "Large impactful Bangla headline/slogan suitable for the poster (10-20 words max)",
  "subtitleBangla": "Supporting honorific or electoral pledge phrase in Bangla",
  "footerCreditBangla": "The credit/promoter line starting with 'প্রচারে:'"
}`;
  }

  private getDefaultHeadline(occasionType: string): string {
    switch (occasionType) {
      case 'victory_day':
        return 'মহান বিজয় দিবস উপলক্ষে বীর শহীদদের প্রতি রক্তিম শুভেচ্ছা ও বিনম্র শ্রদ্ধা';
      case 'campaign':
        return 'আসন্ন নির্বাচনে আপনাদের দোয়া, সমর্থন ও মূল্যবান ভোট প্রার্থনা করছি';
      case 'condolence':
        return 'আমরা গভীরভাবে শোকাহত ও মর্মাহত — বিদেহী আত্মার মাগফিরাত ও বিনম্র শ্রদ্ধা';
      case 'eid':
        return 'পবিত্র ঈদুল ফিতর উপলক্ষে সর্বস্তরের জনতাকে আন্তরিক শুভেচ্ছা ও ঈদ মোবারক';
      case 'greetings':
      default:
        return 'নতুন বছর ও সমৃদ্ধির শুভকামনায় সকলের প্রতি আন্তরিক শুভেচ্ছা ও অভিনন্দন';
    }
  }

  private getDefaultFooter(params: SloganGenerationParams): string {
    if (params.party) {
      return `প্রচারে: ${params.party} ও এলাকাবাসী`;
    }
    return 'প্রচারে: এলাকাবাসী ও সর্বস্তরের সুধীবৃন্দ';
  }
}

export const geminiService = new GeminiService();
