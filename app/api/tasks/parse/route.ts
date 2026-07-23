import { NextResponse } from 'next/server';
import { parseNaturalLanguageTask } from '@/lib/langchain/taskParser';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Please provide a non-empty natural language prompt' },
        { status: 400 }
      );
    }

    const parsedTask = await parseNaturalLanguageTask(prompt.trim());
    return NextResponse.json(parsedTask);
  } catch (error: any) {
    console.error('Failed to parse natural language task:', error);
    return NextResponse.json(
      { error: error.message || 'Internal AI Task Parsing Error' },
      { status: 500 }
    );
  }
}
