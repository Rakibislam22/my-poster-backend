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
  candidateCallout?: string;
  campaignMarka?: string;
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
            temperature: 0.7,
          },
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const parsed = JSON.parse(text);

        return {
          headlineBangla: parsed.headlineBangla || params.userHeadline || this.getDefaultHeadline(params.occasionType),
          subtitleBangla: parsed.subtitleBangla || this.getDefaultSubtitle(params),
          candidateCallout: parsed.candidateCallout || `${params.candidateName}-কে`,
          campaignMarka: parsed.campaignMarka || this.detectDefaultMarka(params),
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
      subtitleBangla: this.getDefaultSubtitle(params),
      candidateCallout: `${params.candidateName}-কে`,
      campaignMarka: this.detectDefaultMarka(params),
      footerCreditBangla: this.getDefaultFooter(params),
      promptUsed: 'Rule-based fallback generator',
      tokensUsed: 0,
      isAiGenerated: false,
    };
  }

  private buildPrompt(params: SloganGenerationParams): string {
    return `You are a master political copywriter and art director for authentic Bangladeshi posters.
Your task is to generate concise, dignified, grammatically flawless Bengali text fields that fit perfectly into professional printing-press poster layouts (1200x1600 px).

POSTER SPECIFICATIONS:
- Occasion Type: ${params.occasionType}
- Candidate Name: ${params.candidateName}
- Designation / Candidate Post: ${params.designation || 'Not specified'}
- Political Party / Organization: ${params.party || 'Not specified'}
- Electoral Area / Constituency: ${params.area || 'Not specified'}
- User Preferred Headline: ${params.userHeadline || 'None provided'}
- Custom Notes / Instructions: ${params.customNotes || 'None'}

CRITICAL FORMATTING & LAYOUT RULES:
1. "headlineBangla": Must be concise, heroic, and punchy — strictly 4 to 8 Bengali words. Never write long paragraphs or sentences, as they will overflow the poster ribbon banner.
   - For 'victory_day': Focus on 16th December Victory Day, martyrs, red-green patriotism (e.g., "১৬ই ডিসেম্বর মহান বিজয় দিবস উপলক্ষে বিনম্র শ্রদ্ধা").
   - For 'campaign': Focus on the upcoming election, people's prayers and support (e.g., "আসন্ন জাতীয় সংসদ নির্বাচনে মনোনীত প্রার্থী").
   - For 'eid': Focus on festive joy, peace and Eid Mubarak (e.g., "পবিত্র ঈদ-উল-ফিতর উপলক্ষে সবাইকে জানাই আন্তরিক শুভেচ্ছা ও ঈদ মোবারক").
   - For 'condolence': Focus on solemn tribute, remembrance and prayers (e.g., "বিনম্র শ্রদ্ধা ও শোক প্রস্তাব — বিদেহী আত্মার মাগফিরাত কামনায়").
2. "subtitleBangla": A complementary sub-slogan or area appeal (strictly 4 to 7 words, e.g., "${params.area ? params.area + ' আসনে ' : ''}জনগণের দোয়া ও সমর্থন প্রার্থী").
3. "candidateCallout": Respectful address for the candidate name (e.g., "${params.candidateName}-কে" or "জননেতা ${params.candidateName}-কে").
4. "campaignMarka": The official election symbol name in Bengali (e.g., "ধানের শীষ", "নৌকা", "লাঙ্গল", "দাঁড়িপাল্লা", "হাতপাখা" based on party/designation).
5. "footerCreditBangla": Professional promoter line starting with "প্রচারে:" (e.g., "প্রচারে: ${params.party ? params.party + ' ও ' : ''}সর্বস্তরের সচেতন দেশপ্রেমিক কর্মীসমাজ").

Return ONLY a valid JSON object matching this schema:
{
  "headlineBangla": "Strictly 4-8 words in authentic Bengali",
  "subtitleBangla": "Strictly 4-7 words in authentic Bengali",
  "candidateCallout": "Short name callout with -কে suffix if campaign",
  "campaignMarka": "Name of the election symbol in Bengali",
  "footerCreditBangla": "Promoter line starting with প্রচারে:"
}`;
  }

  private getDefaultHeadline(occasionType: string): string {
    switch (occasionType) {
      case 'victory_day':
        return '১৬ই ডিসেম্বর মহান বিজয় দিবস উপলক্ষে বিনম্র শ্রদ্ধা';
      case 'campaign':
        return 'আসন্ন জাতীয় সংসদ নির্বাচনে মনোনীত প্রার্থী';
      case 'condolence':
        return 'বিনম্র শ্রদ্ধা ও শোক প্রস্তাব — বিদেহী আত্মার মাগফিরাত কামনায়';
      case 'eid':
        return 'পবিত্র ঈদ উপলক্ষে সবাইকে জানাই শুভেচ্ছা ও ঈদ মোবারক';
      case 'greetings':
      default:
        return 'নতুন বছর ও সমৃদ্ধির শুভকামনায় আন্তরিক শুভেচ্ছা';
    }
  }

  private getDefaultSubtitle(params: SloganGenerationParams): string {
    if (params.occasionType === 'campaign') {
      return params.area ? `${params.area} আসনে জনগণের দোয়া ও সমর্থন প্রার্থী` : 'জনগণের দোয়া, সমর্থন ও মূল্যবান ভোট প্রার্থী';
    } else if (params.occasionType === 'victory_day') {
      return 'বীর শহীদদের প্রতি বিনম্র শ্রদ্ধাঞ্জলি';
    } else if (params.occasionType === 'eid') {
      return 'ঈদের অনাবিল আনন্দ ছড়িয়ে পড়ুক সবার মাঝে';
    } else {
      return 'গভীর শোক ও বিনম্র শ্রদ্ধা';
    }
  }

  private detectDefaultMarka(params: SloganGenerationParams): string {
    const des = (params.designation || '').toLowerCase();
    const party = (params.party || '').toLowerCase();
    if (des.includes('নৌকা') || party.includes('আওয়ামী')) return 'নৌকা';
    if (des.includes('লাঙ্গল') || party.includes('জাতীয় পার্টি')) return 'লাঙ্গল';
    if (des.includes('দাঁড়িপাল্লা')) return 'দাঁড়িপাল্লা';
    if (des.includes('হাতপাখা')) return 'হাতপাখা';
    return 'ধানের শীষ';
  }

  private getDefaultFooter(params: SloganGenerationParams): string {
    if (params.party) {
      return `প্রচারে: ${params.party} ও সর্বস্তরের দেশপ্রেমিক কর্মীসমাজ`;
    }
    return 'প্রচারে: এলাকাবাসী ও সর্বস্তরের সচেতন শুভানুধ্যায়ী';
  }
}

export const geminiService = new GeminiService();
