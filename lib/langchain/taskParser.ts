import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { z } from 'zod';
import { addDays, setHours, setMinutes, format } from 'date-fns';

export const ParsedTaskSchema = z.object({
  title: z.string().describe('Clean concise task title without duration or deadline noise'),
  durationMin: z.number().default(60).describe('Estimated duration in minutes (e.g., 30, 60, 90, 120)'),
  priority: z.number().min(1).max(4).default(2).describe('Priority level: 1=Urgent, 2=High, 3=Normal, 4=Low'),
  category: z.enum(['Work', 'Study', 'Personal', 'Health']).default('Work').describe('Task category'),
  deadline: z.string().nullable().optional().describe('Target deadline ISO 8601 date-time string if mentioned, else null'),
  constraints: z.string().nullable().optional().describe('Specific scheduling constraints extracted from prompt (e.g., mornings only, no Fridays)'),
});

export type ParsedTaskDTO = z.infer<typeof ParsedTaskSchema>;

const TASK_PARSER_SYSTEM_PROMPT = `
You are an expert AI Assistant specializing in parsing natural language task inputs into structured calendar task parameters.

Current reference date: {currentDate} (ISO: {currentISO}).

Given a user's raw text prompt (e.g. "Prepare sales pitch by tomorrow 3pm 90 mins high priority work"):
1. Extract the clean task title (remove duration, priority, and deadline keywords).
2. Infer durationMin in minutes (e.g. "1.5 hours" -> 90, "30m" -> 30, "2 hrs" -> 120). Default to 60 if unspecified.
3. Infer priority level (1 = Urgent/Critical, 2 = High, 3 = Normal, 4 = Low/Optional). Default to 2.
4. Categorize as one of: "Work", "Study", "Personal", "Health".
5. Calculate the exact deadline ISO string relative to the current reference date.
6. Extract any special scheduling constraints (e.g., "mornings only", "requires focus block", "no fridays").
`;

export async function parseNaturalLanguageTask(promptText: string): Promise<ParsedTaskDTO> {
  const provider = process.env.AI_MODEL_PROVIDER || 'gemini';
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // Use smart deterministic fallback if set to mock or no keys present
  if (provider === 'mock' || (!geminiKey && !openaiKey && !anthropicKey)) {
    console.log('[AI Task Parser] Using Smart Heuristic Task Parser');
    return fallbackHeuristicParser(promptText);
  }

  try {
    let model: any;
    if (provider === 'gemini' && geminiKey) {
      model = new ChatGoogleGenerativeAI({
        apiKey: geminiKey,
        modelName: 'gemini-1.5-flash',
        temperature: 0.1,
      });
    } else if (provider === 'anthropic' && anthropicKey) {
      model = new ChatAnthropic({
        anthropicApiKey: anthropicKey,
        modelName: 'claude-3-5-haiku-20241022',
        temperature: 0.1,
      });
    } else {
      model = new ChatOpenAI({
        openAIApiKey: openaiKey,
        modelName: 'gpt-4o-mini',
        temperature: 0.1,
      });
    }

    const structuredLlm = model.withStructuredOutput(ParsedTaskSchema);
    const now = new Date();

    const systemPromptFormatted = TASK_PARSER_SYSTEM_PROMPT
      .replace('{currentDate}', format(now, 'EEEE, MMMM d, yyyy HH:mm'))
      .replace('{currentISO}', now.toISOString());

    console.log(`[AI Task Parser] Invoking LLM (${provider}) for prompt: "${promptText}"`);
    const result: ParsedTaskDTO = await structuredLlm.invoke([
      { role: 'system', content: systemPromptFormatted },
      { role: 'user', content: promptText },
    ]);

    return result;
  } catch (err) {
    console.warn('[AI Task Parser] LLM parsing failed, falling back to heuristic parser:', err);
    return fallbackHeuristicParser(promptText);
  }
}

/**
 * Smart heuristic parser for offline / fallback mode
 */
function fallbackHeuristicParser(text: string): ParsedTaskDTO {
  const lower = text.toLowerCase();

  // 1. Duration Extraction
  let durationMin = 60;
  const durHoursMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:hours|hour|hrs|hr|h)\b/);
  const durMinsMatch = lower.match(/(\d+)\s*(?:minutes|minute|mins|min|m)\b/);
  if (durHoursMatch) {
    durationMin = Math.round(parseFloat(durHoursMatch[1]) * 60);
  } else if (durMinsMatch) {
    durationMin = parseInt(durMinsMatch[1], 10);
  }

  // 2. Priority Extraction
  let priority = 2; // Default High
  if (lower.includes('urgent') || lower.includes('critical') || lower.includes('p1') || lower.includes('asap')) {
    priority = 1;
  } else if (lower.includes('high') || lower.includes('p2') || lower.includes('important')) {
    priority = 2;
  } else if (lower.includes('normal') || lower.includes('p3') || lower.includes('medium')) {
    priority = 3;
  } else if (lower.includes('low') || lower.includes('p4') || lower.includes('someday')) {
    priority = 4;
  }

  // 3. Category Extraction
  let category: 'Work' | 'Study' | 'Personal' | 'Health' = 'Work';
  if (lower.includes('study') || lower.includes('read') || lower.includes('course') || lower.includes('homework') || lower.includes('exam')) {
    category = 'Study';
  } else if (lower.includes('workout') || lower.includes('gym') || lower.includes('run') || lower.includes('meditat') || lower.includes('health') || lower.includes('doctor')) {
    category = 'Health';
  } else if (lower.includes('home') || lower.includes('buy') || lower.includes('grocer') || lower.includes('personal') || lower.includes('family') || lower.includes('clean')) {
    category = 'Personal';
  }

  // 4. Deadline Extraction
  let deadline: string | null = null;
  const now = new Date();
  if (lower.includes('tomorrow')) {
    deadline = addDays(now, 1).toISOString();
  } else if (lower.includes('today')) {
    deadline = setHours(setMinutes(now, 59), 23).toISOString();
  } else if (lower.includes('friday')) {
    deadline = addDays(now, 4).toISOString();
  }

  // 5. Clean Title (strip obvious metadata words)
  let title = text
    .replace(/(\d+(?:\.\d+)?)\s*(?:hours|hour|hrs|hr|h|minutes|minute|mins|min|m)\b/gi, '')
    .replace(/\b(urgent|critical|high|medium|low|p1|p2|p3|p4|priority|by tomorrow|by friday|by today|today|tomorrow)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!title) title = text.trim();
  title = title.charAt(0).toUpperCase() + title.slice(1);

  return {
    title,
    durationMin,
    priority,
    category,
    deadline,
    constraints: lower.includes('morning') ? 'Morning focus block' : lower.includes('afternoon') ? 'Afternoon slot' : null,
  };
}
