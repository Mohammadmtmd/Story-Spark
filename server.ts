import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Enable CORS and 25MB JSON body parser for high-resolution children's book photos
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

/**
 * SSRF Protection: verify if URL attempts to reach internal loopback or cloud metadata IPs
 */
function isDisallowedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();
    
    // Disallowed cloud metadata & loopback hosts
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.startsWith('169.254.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
    ) {
      // Allowed for local Ollama in safe developer mode
      if (url.port === '11434') return false;
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

/**
 * Safe logger that redacts API keys and tokens
 */
function safeLog(message: string, obj?: any) {
  if (!obj) {
    console.log(`[StorySpark Server] ${message}`);
    return;
  }
  const str = JSON.stringify(obj, (key, value) => {
    if (typeof key === 'string' && (key.toLowerCase().includes('key') || key.toLowerCase().includes('auth') || key.toLowerCase().includes('secret'))) {
      return '***REDACTED***';
    }
    return value;
  });
  console.log(`[StorySpark Server] ${message}`, str);
}

// 1. Connection test endpoint
app.post('/api/ai/test-connection', async (req: Request, res: Response) => {
  try {
    const { provider, model, apiKey, customBaseUrl } = req.body;
    safeLog('Testing connection for provider:', { provider, model, customBaseUrl });

    const keyToUse = apiKey || process.env.GEMINI_API_KEY;

    if (provider === 'gemini') {
      if (!keyToUse) {
        return res.status(400).json({
          success: false,
          message: 'کلید Gemini API یافت نشد. لطفاً کلید اختصاصی خود را در بخش تنظیمات وارد کنید.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey: keyToUse,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: model || 'gemini-3.8-flash',
        contents: 'Ping test. Output JSON: {"status": "ok"}',
        config: {
          responseMimeType: 'application/json',
        },
      });

      return res.json({
        success: true,
        message: `اتصال به گوگل جمینای (${model || 'gemini-3.8-flash'}) از طریق سرور با موفقیت تایید شد!`,
        result: response.text,
      });
    } else {
      // OpenAI-compatible
      const baseUrl = customBaseUrl || 'https://api.openai.com/v1';
      if (isDisallowedUrl(baseUrl)) {
        return res.status(400).json({ success: false, message: 'آدرس درخواست شده به دلایل امنیتی مسدود است (SSRF Protection).' });
      }

      const targetUrl = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Ping. Output JSON: {"status": "ok"}' }],
          max_tokens: 30,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          success: false,
          message: `خطای سرویس هوش مصنوعی: ${errorText}`,
        });
      }

      return res.json({
        success: true,
        message: `اتصال به ${baseUrl} با موفقیت تایید شد!`,
      });
    }
  } catch (error: any) {
    safeLog('Test connection error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'خطای غیرمنتظره در سرور رخ داد.',
    });
  }
});

// 2. Multimodal Pedagogical Analysis Endpoint (Server Fallback)
app.post('/api/ai/analyze', async (req: Request, res: Response) => {
  try {
    const { options, settings } = req.body;
    if (!options || !options.imageBase64) {
      return res.status(400).json({ error: 'تصویر صفحه کتاب ارسال نشده است.' });
    }

    const provider = settings?.provider || 'gemini';
    const keyToUse = settings?.apiKey || process.env.GEMINI_API_KEY;

    if (!keyToUse && provider === 'gemini') {
      return res.status(400).json({
        error: 'کلید Gemini API موجود نیست. لطفاً کلید اختصاصی خود را در تب تنظیمات وارد نمایید.',
      });
    }

    // Clean base64 image
    let rawBase64 = options.imageBase64;
    let mimeType = 'image/jpeg';
    if (rawBase64.startsWith('data:')) {
      const parts = rawBase64.split(';base64,');
      mimeType = parts[0].replace('data:', '');
      rawBase64 = parts[1] || '';
    }

    const wordCount = options.vocabCount || 8;
    const questionCount = options.questionCount || 5;

    const systemPrompt = `You are "StorySpark Master Pedagogist", an elite bilingual English-Persian children's language curriculum architect.
Your mission is to inspect the provided image of a children's storybook page and output a STRICT JSON object with zero markdown backticks and zero chatter.

LEARNER CONFIGURATION:
- Target Learner Age: ${options.ageLevel} years old
- CEFR Language Level: ${options.cefrLevel}
- Target English Accent: ${options.accent}
- Story Tone & Style: ${options.style}
- Story Length: ${options.length} (short: 60-80 words, medium: 100-140 words, long: 180-220 words)
- Target Vocabulary Words: exactly ${wordCount} words
- Comprehension Questions: exactly ${questionCount} questions

STRICT PEDAGOGICAL REQUIREMENTS:
1. Visual Truthfulness: inspect characters, objects, actions, setting, colors, locations.
2. Fresh Story: Fresh, original English story and parallel Persian paragraphs based on visual characters (not copyrighted text verbatim).
3. Vocabulary: exactly ${wordCount} words with IPA, Persian pronunciation guide, accurate meaningFa, example sentences, difficulty.
4. Phonics Sound Focus: letter, IPA, Persian explanation of pronunciation anatomy, 5 sample words.
5. Practice Exercises: exactly ${questionCount} questions (multiple_choice, true_false, fill_blank, phonics_match, unscramble) with correctAnswer and explanationFa.

OUTPUT FORMAT: Strict raw JSON object matching the pedagogical schema.`;

    if (provider === 'gemini') {
      const targetModel = settings?.model || 'gemini-3.8-flash';
      const ai = new GoogleGenAI({
        apiKey: keyToUse,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const imagePart = {
        inlineData: {
          mimeType,
          data: rawBase64,
        },
      };

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: { parts: [imagePart, { text: systemPrompt }] },
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      return res.json({
        success: true,
        rawText: response.text,
      });
    } else {
      // OpenAI Fallback
      const baseUrl = settings?.customBaseUrl || 'https://api.openai.com/v1';
      if (isDisallowedUrl(baseUrl)) {
        return res.status(400).json({ error: 'آدرس سرور مسدود است.' });
      }

      const targetModel = settings?.model || 'gpt-4o-mini';
      const dataUri = `data:${mimeType};base64,${rawBase64}`;

      const aiResponse = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: targetModel,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'You are an educational vision AI. Return strict JSON.' },
            {
              role: 'user',
              content: [
                { type: 'text', text: systemPrompt },
                { type: 'image_url', image_url: { url: dataUri } },
              ],
            },
          ],
          temperature: 0.7,
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        return res.status(aiResponse.status).json({ error: errorText });
      }

      const aiJson = await aiResponse.json();
      return res.json({
        success: true,
        rawText: aiJson.choices?.[0]?.message?.content || '',
      });
    }
  } catch (error: any) {
    safeLog('Analyze error:', error.message);
    res.status(500).json({
      error: error.message || 'خطای پردازش تصویر در سرور.',
    });
  }
});

// Vite middleware in dev mode; static serve in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[StorySpark] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
