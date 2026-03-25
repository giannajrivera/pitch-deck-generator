import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 })
  }

  try {
    const { questionId, question, currentAnswer, context, mode } = await req.json()

    const prompt = `You are an expert startup pitch coach helping a founder improve their pitch deck answer.

QUESTION: ${question}

FOUNDER'S CURRENT ANSWER:
"${currentAnswer || '[No answer provided yet]'}"

ADDITIONAL CONTEXT (from other answers):
${context || 'Not provided'}

MODE: ${mode === 'workshop' ? 'Workshop (be concise and punchy)' : 'Solo (be thorough and investor-ready)'}

Your task:
1. Identify what's strong about the current answer (if anything)
2. Identify what's weak, vague, or missing
3. Provide an IMPROVED version of the answer that is:
   - More specific and quantified where possible
   - More compelling and investor-friendly
   - Concise but complete
   - Written in the founder's voice (first person)

Return ONLY the improved answer text — no preamble, no explanation. Just write the improved answer as if the founder is saying it.

If the current answer is empty, write a strong example answer for this type of company/context.`

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(prompt)
    const improvedAnswer = result.response.text().trim()

    return NextResponse.json({ improvedAnswer, questionId })
  } catch (error) {
    console.error('Improve answer error:', error)
    return NextResponse.json({ error: 'Failed to improve answer. Please try again.' }, { status: 500 })
  }
}
