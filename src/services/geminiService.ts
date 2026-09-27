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
          model: 'gemini-2.5-flash',
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
    return `You are the Lead Art Director and Chief Political Copywriter for authentic, professional Bangladeshi posters (1200x1600 px print-ready standard).
Your mission is to generate punchy, dignified, grammatically flawless Bengali copy that fits into balanced graphic design slots without text overlapping, repetition, or overflow.

POSTER SPECIFICATIONS:
- Occasion Type: ${params.occasionType}
- Candidate Name: ${params.candidateName}
- Designation / Role: ${params.designation || 'Not specified'}
- Political Party / Organization: ${params.party || 'Not specified'}
- Electoral Area / Constituency: ${params.area || 'Not specified'}
- User Preferred Headline: ${params.userHeadline || 'None provided'}
- Custom Notes / Instructions: ${params.customNotes || 'None'}

STRICT ART DIRECTION & COPY RULES:
1. "headlineBangla" (Main Title):
   - Strictly 3 to 6 words.
   - For 'victory_day': Occasion name only, e.g., "১৬ই ডিসেম্বর মহান বিজয় দিবস".
   - For 'campaign': Electoral appeal title, e.g., "আসন্ন জাতীয় সংসদ নির্বাচনে মনোনীত প্রার্থী".
   - For 'eid': Festive greeting title, e.g., "পবিত্র ঈদ-উল-ফিতর মোবারক".
   - For 'condolence': Solemn tribute title, e.g., "বিনম্র শ্রদ্ধা ও শোক প্রস্তাব".
   - CRITICAL: Do NOT merge the tribute/sub-slogan into this field! Keep it short so it fits the top ribbon without wrapping into 3 lines.

2. "subtitleBangla" (Secondary Slogan / Tribute):
   - Strictly 3 to 6 words.
   - For 'victory_day': e.g., "বীর শহীদদের প্রতি বিনম্র শ্রদ্ধা" or "বীর বাঙালির রক্তে রাঙানো অহংকার".
   - For 'campaign': e.g., "${params.area ? params.area + ' আসনে ' : ''}জনগণের দোয়া ও সমর্থন প্রার্থী".
   - For 'eid': e.g., "অনাবিল আনন্দ ও শান্তির শুভেচ্ছা".
   - For 'condolence': e.g., "বিদেহী আত্মার মাগফিরাত কামনায়".
   - CRITICAL CONSTRAINT: Must NEVER repeat any word that already appears in "headlineBangla"!

3. "candidateCallout":
   - For campaign: "${params.candidateName}-কে"
   - For festive/condolence: "${params.candidateName}"

4. "campaignMarka":
   - The electoral symbol in Bengali (e.g., "ধানের শীষ", "নৌকা", "লাঙ্গল", "দাঁড়িপাল্লা", "হাতপাখা" based on party).

5. "footerCreditBangla":
   - Professional promoter line starting with "প্রচারে:", e.g., "প্রচারে: ${params.party ? params.party + ' ও ' : ''}সর্বস্তরের দেশপ্রেমিক কর্মীসমাজ".

Return ONLY a valid JSON object matching this schema:
{
  "headlineBangla": "Concise 3-6 words main occasion title",
  "subtitleBangla": "Unique 3-6 words sub-slogan (NO repetition of headline words)",
  "candidateCallout": "Short candidate name callout",
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
