import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { SCHEDULER_SYSTEM_PROMPT, SCHEDULER_USER_PROMPT } from './prompts';
import {
  TaskConstraint,
  UserPreferencesDTO,
  ExistingEventDTO,
  AIPlannerOutput,
  AIPlannerOutputSchema,
} from './types';
import { validateSchedule } from './validator';
import { generateMockDeterministicSchedule } from './mockPlanner';

export async function runAISchedulingPipeline(
  tasks: TaskConstraint[],
  preferences: UserPreferencesDTO,
  existingEvents: ExistingEventDTO[],
  targetWeekStartISO: string,
  targetWeekEndISO: string
): Promise<AIPlannerOutput> {
  const provider = process.env.AI_MODEL_PROVIDER || 'gemini';
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // Use fallback deterministic planner if no keys or set to mock mode
  if (provider === 'mock' || (!geminiKey && !openaiKey && !anthropicKey)) {
    console.log('[AI Pipeline] Running Deterministic AI Mock Planner (No active LLM API Key detected)');
    return generateMockDeterministicSchedule(tasks, preferences, existingEvents, targetWeekStartISO);
  }

  try {
    let model: any;
    if (provider === 'gemini' && geminiKey) {
      model = new ChatGoogleGenerativeAI({
        apiKey: geminiKey,
        modelName: 'gemini-1.5-pro',
        temperature: 0.2,
      });
    } else if (provider === 'anthropic' && anthropicKey) {
      model = new ChatAnthropic({
        anthropicApiKey: anthropicKey,
        modelName: 'claude-3-5-sonnet-20241022',
        temperature: 0.2,
      });
    } else {
      model = new ChatOpenAI({
        openAIApiKey: openaiKey,
        modelName: 'gpt-4o',
        temperature: 0.2,
      });
    }

    const structuredLlm = model.withStructuredOutput(AIPlannerOutputSchema);

    // Format prompt values
    const systemPromptFormatted = SCHEDULER_SYSTEM_PROMPT
      .replace('{workStart}', preferences.workStart)
      .replace('{workEnd}', preferences.workEnd)
      .replace('{daysOff}', preferences.daysOff.join(', '))
      .replace('{bufferMinutes}', String(preferences.bufferMinutes))
      .replace('{maxFocusBlockMin}', String(preferences.maxFocusBlockMin))
      .replace('{weekStartDate}', targetWeekStartISO)
      .replace('{weekEndDate}', targetWeekEndISO);

    const userPromptFormatted = SCHEDULER_USER_PROMPT
      .replace('{userPreferencesJson}', JSON.stringify(preferences, null, 2))
      .replace('{existingEventsJson}', JSON.stringify(existingEvents, null, 2))
      .replace('{pendingTasksJson}', JSON.stringify(tasks, null, 2));

    console.log(`[AI Pipeline] Invoking LangChain LLM (${provider}) for schedule reasoning...`);
    const result: AIPlannerOutput = await structuredLlm.invoke([
      { role: 'system', content: systemPromptFormatted },
      { role: 'user', content: userPromptFormatted },
    ]);

    // Validation pass
    const validation = validateSchedule(result.schedule, existingEvents, preferences, tasks);

    if (!validation.isValid) {
      console.warn('[AI Pipeline] First LLM pass generated constraint violations:', validation.violations);
      
      // Secondary repair invocation with violation hints
      const repairPrompt = `
Your previous schedule draft had the following constraint violations:
${validation.violations.map((v) => `- [${v.type}] ${v.message}`).join('\n')}

Please fix these exact violations and return a revised conflict-free schedule.
`;

      const repairedResult: AIPlannerOutput = await structuredLlm.invoke([
        { role: 'system', content: systemPromptFormatted },
        { role: 'user', content: userPromptFormatted },
        { role: 'assistant', content: JSON.stringify(result) },
        { role: 'user', content: repairPrompt },
      ]);

      return repairedResult;
    }

    return result;
  } catch (error) {
    console.error('[AI Pipeline] LLM API Call failed, falling back to Deterministic Scheduler:', error);
    return generateMockDeterministicSchedule(tasks, preferences, existingEvents, targetWeekStartISO);
  }
}
