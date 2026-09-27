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
          headlineBangla: parsed.headlineBangla || this.getDefaultHeadline(params.occasionType, params),
          subtitleBangla: parsed.subtitleBangla || this.getDefaultSubtitle(params),
          candidateCallout: parsed.candidateCallout || `${params.candidateName}-কে`,
          campaignMarka: parsed.campaignMarka || parsed.marka || this.detectDefaultMarka(params),
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
      headlineBangla: this.getDefaultHeadline(params.occasionType, params),
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
    const occasionTitleMap: Record<string, string> = {
      campaign: 'নির্বাচনী প্রচারণা ও ভোট প্রার্থনা',
      victory_day: 'মহান বিজয় দিবস ও জাতীয় শ্রদ্ধাঞ্জলি',
      eid: 'পবিত্র ঈদ-উল-ফিতর ও ঈদ শুভেচ্ছা',
      condolence: 'শোক প্রস্তাব, স্মরণসভা ও দোয়া প্রার্থনা',
    };
    const occasionTitle = occasionTitleMap[params.occasionType] || params.occasionType;

    return `You are an elite Bangladeshi Art Director, Senior Campaign Strategist, and Master Bengali Copywriter/Speechwriter.
Your task is to write an exceptionally polished, context-rich, dignified, and compelling Bengali slogan / message statement ("headlineBangla") for a high-profile banner message badge.

POSTER SPECIFICATIONS:
- Occasion Type: ${params.occasionType} (${occasionTitle})
- Candidate Name: ${params.candidateName}
- Designation / Title: ${params.designation || 'Not specified'}
- Political Party / Organization: ${params.party || 'Not specified'}
- Constituency / Electoral Area: ${params.area || 'Not specified'}
- User's Raw Note / Topic Idea: ${params.userHeadline || params.customNotes || 'None provided'}
- Custom Notes: ${params.customNotes || 'None'}

STRICT COPYWRITING RULES FOR "headlineBangla":
1. LENGTH & DEPTH: 10 to 18 words (forming 2 to 3 compact, rhythmic lines when rendered).
2. DO NOT output a short 3-word title (e.g. "মহান বিজয় দিবস" or "আসন্ন নির্বাচনে প্রার্থী")! The poster already displays the occasion title in large 3D typography.
3. DETAILED & POLISHED:
   - If the user provided a raw input or topic (e.g. "উন্নয়নের জন্য ভোট দিন" or "এলাকার রাস্তাঘাট ঠিক করবো"), DO NOT simply repeat it verbatim! Elevate, expand, and polish it into an eloquent, authoritative, and persuasive Bengali statement.
   - Weave in the specific details provided: candidate's area (${params.area || 'এলাকা'}), party/values, candidate's dedication, public rights, people's welfare, or national spirit.
4. OCCASION-SPECIFIC TONE & SAMPLES:
   - For 'campaign': Inspiring electoral pledge on democracy, public rights, area development, and honesty.
     Example: "${params.area ? params.area + ' এর ' : ''}মাটি ও মানুষের ভাগ্যোন্নয়নে, গণতন্ত্র ও জনতার অধিকার প্রতিষ্ঠায় ${params.candidateName}-কে ধানের শীষে মূল্যবান ভোট দিয়ে জয়যুক্ত করুন।"
   - For 'victory_day': Stirring patriotic tribute honoring martyrs and pledging national unity and prosperity.
     Example: "মহান বিজয়ের রক্তস্নাত শপথে বীর শহীদদের স্মরণে সাম্য, সুবিচার ও সমৃদ্ধ বাংলাদেশ গড়ার দৃপ্ত অঙ্গীকার।"
   - For 'eid': Warm, heartfelt greeting for citizens and local residents wishing peace and brotherhood.
     Example: "পবিত্র ঈদুল ফিতরের মহিমান্বিত আলোয় ভরে উঠুক প্রতিটি হৃদয়—${params.area ? params.area + 'বাসীসহ ' : ''}সবাইকে ঈদের আন্তরিক শুভেচ্ছা ও ঈদ মোবারক।"
   - For 'condolence': Solemn, respectful tribute praying for eternal peace and remembering lifelong service.
     Example: "মরহুমের কর্মময় জীবনের আদর্শ ও নিঃস্বার্থ সমাজসেবাকে বিনম্র শ্রদ্ধায় স্মরণ করছি; মহান আল্লাহ তাঁকে জান্নাতুল ফেরদৌস নসিব করুন।"

5. "footerCreditBangla":
   - Dignified promoter credit line starting with "প্রচারে:", e.g. "প্রচারে: ${params.party ? params.party + ' ও ' : ''}${params.area ? params.area + '-র ' : ''}সর্বস্তরের সচেতন ও দেশপ্রেমিক জনগণ".

6. "campaignMarka":
   - The electoral symbol in Bengali (e.g. "ধানের শীষ", "নৌকা", "লাঙ্গল", "দাঁড়িপাল্লা", "হাতপাখা").

Return ONLY a valid JSON object matching this schema:
{
  "headlineBangla": "Polished, detailed, 10-18 words eloquent Bengali message",
  "footerCreditBangla": "Promoter line starting with প্রচারে:",
  "campaignMarka": "Election symbol name in Bengali"
}`;
  }

  private getDefaultHeadline(occasionType: string, params?: SloganGenerationParams): string {
    const areaPrefix = params?.area ? `${params.area} এর ` : '';
    const candName = params?.candidateName ? `${params.candidateName}-কে ` : '';
    switch (occasionType) {
      case 'victory_day':
        return 'মহান বিজয়ের রক্তস্নাত শপথে বীর শহীদদের স্মরণে সাম্য, সুবিচার ও সমৃদ্ধ বাংলাদেশ গড়ার দৃপ্ত অঙ্গীকার।';
      case 'campaign':
        return `${areaPrefix}মাটি ও মানুষের ভাগ্যোন্নয়নে, গণতন্ত্র ও নাগরিক অধিকার প্রতিষ্ঠায় ${candName}ভোট দিয়ে জয়যুক্ত করুন।`;
      case 'condolence':
        return 'মরহুমের কর্মময় জীবনের আদর্শ ও নিঃস্বার্থ সমাজসেবাকে বিনম্র শ্রদ্ধায় স্মরণ করছি; আল্লাহ তাঁকে জান্নাত নসিব করুন।';
      case 'eid':
        return `পবিত্র ঈদুল ফিতরের অনাবিল আনন্দ ও শান্তির বারতা ছড়িয়ে পড়ুক প্রতিটি ঘরে—${areaPrefix}সবাইকে আন্তরিক ঈদ মোবারক।`;
      case 'greetings':
      default:
        return 'নতুন উদ্দীপনায় সমৃদ্ধি, ঐক্য ও মানবিক মূল্যবোধের সমাজ বিনির্মাণে সবাইকে জানাই আন্তরিক শুভেচ্ছা।';
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
