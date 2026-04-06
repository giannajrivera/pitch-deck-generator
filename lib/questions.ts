import type { Question } from './types'

export const QUESTIONS: Question[] = [
  // ── SLIDE 1: INTRO ──────────────────────────────────────────────────────────
  {
    id: 'company_name',
    slideId: 'intro',
    slideTitle: 'Intro',
    slideNumber: 1,
    question: "What's your company name?",
    placeholder: 'e.g. Acme Corp',
    helpText: 'This will appear on your title slide. Keep it short and memorable.',
    workshopHint: 'Your company name',
    required: true,
    inputType: 'text',
  },
  {
    id: 'tagline',
    slideId: 'intro',
    slideTitle: 'Intro',
    slideNumber: 1,
    question: "What's your tagline? One sentence that captures what you do.",
    placeholder: 'e.g. "The AI-powered platform that turns customer feedback into product gold"',
    helpText: 'A tagline should be clear, memorable, and hint at your value. Avoid jargon. Think: who you help + what you do + outcome.',
    workshopHint: 'One sentence value statement',
    required: true,
    inputType: 'text',
  },
  {
    id: 'founders',
    slideId: 'intro',
    slideTitle: 'Intro',
    slideNumber: 1,
    question: "Who are the founders? (Names and brief titles)",
    placeholder: 'e.g. Jane Smith (CEO), John Doe (CTO)',
    helpText: 'List founder names and their roles. This humanizes the pitch immediately.',
    workshopHint: 'Founder names and roles',
    required: true,
    inputType: 'text',
  },

  // ── SLIDE 2: PROBLEM ────────────────────────────────────────────────────────
  {
    id: 'problem',
    slideId: 'problem',
    slideTitle: 'Problem',
    slideNumber: 2,
    question: "What specific problem are you solving?",
    placeholder: 'e.g. Small businesses waste 8+ hours/week manually reconciling invoices across 3 different systems...',
    helpText: 'Be specific and concrete. Avoid vague statements like "there is no good solution." Describe the pain in vivid, quantified terms if possible.',
    workshopHint: 'The specific pain you solve',
    required: true,
    inputType: 'textarea',
  },
  {
    id: 'problem_who',
    slideId: 'problem',
    slideTitle: 'Problem',
    slideNumber: 2,
    question: "Who has this problem? Describe your target customer.",
    placeholder: 'e.g. Operations managers at companies with 10–200 employees in retail, hospitality, or food service',
    helpText: 'The more specific, the better. Investors want to see you truly understand your customer segment.',
    workshopHint: 'Who feels this pain most acutely',
    required: true,
    inputType: 'textarea',
  },
  {
    id: 'problem_why',
    slideId: 'problem',
    slideTitle: 'Problem',
    slideNumber: 2,
    question: "Why does this problem matter? What's the real cost or consequence?",
    placeholder: 'e.g. Lost revenue from billing errors averages $23K/year. Staff turnover from frustration costs $15K per hire...',
    helpText: 'Quantify the pain if possible — time lost, money wasted, opportunities missed. This builds urgency.',
    workshopHint: 'The cost/consequence of the problem',
    required: true,
    inputType: 'textarea',
  },

  // ── SLIDE 3: SOLUTION ───────────────────────────────────────────────────────
  {
    id: 'solution',
    slideId: 'solution',
    slideTitle: 'Solution',
    slideNumber: 3,
    question: "What is your solution?",
    placeholder: 'e.g. An AI-powered invoice management platform that automatically reconciles, categorizes, and flags anomalies across all your systems in real-time',
    helpText: 'Describe what your product or service does. Start with the outcome, then explain how. Keep it simple enough that anyone could understand it.',
    workshopHint: 'What you built or are building',
    required: true,
    inputType: 'textarea',
  },
  {
    id: 'solution_differentiation',
    slideId: 'solution',
    slideTitle: 'Solution',
    slideNumber: 3,
    question: "What makes your solution different from existing alternatives?",
    placeholder: 'e.g. Unlike QuickBooks which requires manual entry, our system auto-syncs via API. Unlike spreadsheets, we provide real-time alerts...',
    helpText: 'Identify 2–3 key differentiators. This is your "unfair advantage." Think: speed, accuracy, cost, experience, integrations, or proprietary data/tech.',
    workshopHint: 'Your key differentiators',
    required: true,
    inputType: 'textarea',
  },

  // ── SLIDE 4: PRODUCT ────────────────────────────────────────────────────────
  {
    id: 'product_features',
    slideId: 'product',
    slideTitle: 'Product',
    slideNumber: 4,
    question: "What are the 3–5 key features of your product?",
    placeholder: 'e.g.\n• Auto-sync with QuickBooks, Xero, and Stripe\n• AI anomaly detection with one-click resolution\n• Role-based dashboards for finance & ops teams\n• Mobile app for approvals on the go',
    helpText: 'Focus on features that solve the problem directly. Each feature should connect back to a customer pain point you described earlier.',
    workshopHint: 'Core product features',
    required: true,
    inputType: 'textarea',
  },
  {
    id: 'product_how',
    slideId: 'product',
    slideTitle: 'Product',
    slideNumber: 4,
    question: "How does it work? Describe the core user journey in 2–3 steps.",
    placeholder: 'e.g. 1. Connect your accounts in 60 seconds via API. 2. AI scans transactions daily and flags issues. 3. Resolve or approve with one click.',
    helpText: "This is your 'how it works' narrative. Think about it like a demo script — what does the user do first, second, third? What's the magic moment?",
    workshopHint: 'The core user journey',
    required: false,
    inputType: 'textarea',
  },

  // ── SLIDE 5: MARKET ─────────────────────────────────────────────────────────
  {
    id: 'industry',
    slideId: 'market',
    slideTitle: 'Market Size',
    slideNumber: 5,
    question: "What industry or sector is your business in?",
    placeholder: 'e.g. Restaurant technology / SaaS, Healthcare IT, Consumer fintech, EdTech, E-commerce logistics',
    helpText: 'Be specific. This helps the AI find accurate market size data for your exact sector rather than a broad category.',
    workshopHint: 'Your industry or sector',
    required: true,
    inputType: 'text',
  },
  {
    id: 'geography',
    slideId: 'market',
    slideTitle: 'Market Size',
    slideNumber: 5,
    question: "What geographic market are you targeting?",
    placeholder: 'e.g. United States, Northeast US (CT, NY, MA), North America, Global',
    helpText: 'Start with your realistic launch market. This scopes your SOM correctly — a US-only SOM is far more credible than a "global" claim for an early-stage startup.',
    workshopHint: 'Your target geography',
    required: true,
    inputType: 'text',
  },
  {
    id: 'market_customer',
    slideId: 'market',
    slideTitle: 'Market Size',
    slideNumber: 5,
    question: "Who exactly is your target customer? Be as specific as possible.",
    placeholder: 'e.g. Operations managers at US-based restaurants with 5–50 locations doing $1M–$10M annual revenue',
    helpText: 'Narrow is good here. Investors prefer a focused target with a clear path to expansion over a vague "everyone" claim.',
    workshopHint: 'Your most specific target customer',
    required: true,
    inputType: 'textarea',
  },

  // ── SLIDE 6: BUSINESS MODEL ─────────────────────────────────────────────────
  {
    id: 'revenue_model',
    slideId: 'businessModel',
    slideTitle: 'Business Model',
    slideNumber: 6,
    question: "How do you make money? Describe your revenue streams.",
    placeholder: 'e.g. Monthly SaaS subscription ($299–$999/mo depending on location count). One-time setup fee ($500). Add-on services (integrations, training).',
    helpText: "Be specific about revenue streams. Primary vs. secondary? Recurring vs. one-time? Investors love recurring revenue (subscriptions, contracts).",
    workshopHint: 'How you generate revenue',
    required: true,
    inputType: 'textarea',
  },
  {
    id: 'pricing',
    slideId: 'businessModel',
    slideTitle: 'Business Model',
    slideNumber: 6,
    question: "What's your pricing model? Include tiers or range if applicable.",
    placeholder: 'e.g. Starter: $299/mo (1–5 locations). Growth: $599/mo (6–20 locations). Enterprise: custom pricing.',
    helpText: 'Show you have thought through pricing strategy. Per seat? Per location? Per usage? Freemium? How does pricing scale with customer growth?',
    workshopHint: 'Pricing tiers and rationale',
    required: true,
    inputType: 'textarea',
  },

  // ── SLIDE 7: TRACTION ───────────────────────────────────────────────────────
  {
    id: 'traction',
    slideId: 'traction',
    slideTitle: 'Traction',
    slideNumber: 7,
    question: "What traction do you have? Include any metrics, milestones, or proof points.",
    placeholder: 'e.g. 47 paying customers, $28K MRR, 3 enterprise pilots (Fortune 500). 2 design partners. Product launched 6 months ago. 94% customer retention. Won SBDC Pitch Competition.',
    helpText: "Even early traction matters. Include: users, revenue, pilots, partnerships, waitlist size, press, awards, accelerator acceptance, LOIs, or customer testimonials. If pre-product, share design partners or letters of intent.",
    workshopHint: 'Customers, revenue, milestones',
    required: false,
    inputType: 'textarea',
  },

  // ── SLIDE 8: COMPETITION ────────────────────────────────────────────────────
  {
    id: 'competitors',
    slideId: 'competition',
    slideTitle: 'Competition',
    slideNumber: 8,
    question: "Who are your main competitors? (Direct and indirect)",
    placeholder: 'e.g. Direct: Plate IQ, MarketMan, BlueCart. Indirect: QuickBooks (manual), Excel spreadsheets, in-house ops staff.',
    helpText: 'List 3–5 competitors. Include both direct (same solution) and indirect (alternative ways customers solve the problem today, including doing nothing).',
    workshopHint: 'Direct and indirect competitors',
    required: true,
    inputType: 'textarea',
  },
  {
    id: 'differentiation',
    slideId: 'competition',
    slideTitle: 'Competition',
    slideNumber: 8,
    question: "How are you different from each competitor? What dimensions matter most to customers?",
    placeholder: 'e.g. vs Plate IQ: We support restaurants AND retail. vs MarketMan: We have AI anomaly detection, they don\'t. vs spreadsheets: Real-time sync, no manual entry.',
    helpText: 'Think about a 2×2 or comparison table. What 3–4 dimensions do customers care about? Price, speed, accuracy, integrations, ease of use, support? Show where you win.',
    workshopHint: 'Your competitive advantages',
    required: true,
    inputType: 'textarea',
  },

  // ── SLIDE 9: GO-TO-MARKET ───────────────────────────────────────────────────
  {
    id: 'gtm_channels',
    slideId: 'gtm',
    slideTitle: 'Go-to-Market',
    slideNumber: 9,
    question: "What channels will you use to acquire customers?",
    placeholder: 'e.g. Direct outbound sales to restaurant groups, partnerships with restaurant POS providers, content marketing via industry blogs, referral program (20% MRR for 12 months)',
    helpText: 'List 2–4 primary channels. For each, briefly explain why it works for your customer. Investors want to see a realistic, specific plan — not just "social media and word of mouth."',
    workshopHint: 'Primary customer acquisition channels',
    required: true,
    inputType: 'textarea',
  },
  {
    id: 'gtm_first_customers',
    slideId: 'gtm',
    slideTitle: 'Go-to-Market',
    slideNumber: 9,
    question: "How will you get your first 100 customers? Be specific.",
    placeholder: 'e.g. Phase 1: 10 design partners from my network (3 committed). Phase 2: Outbound to 500 restaurant groups in TX. Phase 3: Partner with Toast POS (in discussions).',
    helpText: 'Investors love specificity here. Who do you already know? What conferences will you attend? What partnerships are in progress? What does your outbound motion look like?',
    workshopHint: 'Specific path to first 100 customers',
    required: true,
    inputType: 'textarea',
  },

  // ── SLIDE 10: FINANCIALS ────────────────────────────────────────────────────
  {
    id: 'projections',
    slideId: 'financials',
    slideTitle: 'Financials',
    slideNumber: 10,
    question: "What are your 3-year financial projections? (Revenue, costs, headcount)",
    placeholder: 'e.g.\nYear 1: $180K revenue, $350K costs, 4 employees\nYear 2: $900K revenue, $700K costs, 9 employees\nYear 3: $2.8M revenue, $1.5M costs, 18 employees',
    helpText: 'Include top-line revenue, major cost categories (payroll, infra, marketing), and headcount. Be realistic — overly optimistic projections hurt credibility. Show a path to profitability.',
    workshopHint: '3-year revenue, cost, and headcount projections',
    required: true,
    inputType: 'textarea',
  },
  {
    id: 'assumptions',
    slideId: 'financials',
    slideTitle: 'Financials',
    slideNumber: 10,
    question: "What are your key assumptions driving these projections?",
    placeholder: 'e.g. Avg contract: $600/mo. Sales cycle: 3 weeks. Monthly churn: 2%. 1 AE closes 4 new customers/month. CAC: $1,200. LTV: $21,600 (36-month avg).',
    helpText: 'Investors know projections are estimates — they invest in the LOGIC behind them. Show your unit economics: CAC, LTV, churn, conversion rates, sales capacity.',
    workshopHint: 'Key unit economics and assumptions',
    required: false,
    inputType: 'textarea',
  },

  // ── SLIDE 11: TEAM ──────────────────────────────────────────────────────────
  {
    id: 'team',
    slideId: 'team',
    slideTitle: 'Team',
    slideNumber: 11,
    question: "Tell me about your founding team. Who are they and what's their background?",
    placeholder: 'e.g. Jane Smith (CEO) — 8 years in restaurant ops at Darden Restaurants, built ops software at startup acquired by Oracle. John Doe (CTO) — 10 years engineering, ex-Stripe, built ML systems at scale.',
    helpText: 'Highlight relevant experience for THIS specific problem. Domain expertise, prior startup experience, and technical credentials are most valuable. Include advisors if they are notable.',
    workshopHint: 'Founder backgrounds and relevant experience',
    required: true,
    inputType: 'textarea',
  },

  // ── SLIDE 12: ASK ───────────────────────────────────────────────────────────
  {
    id: 'funding_amount',
    slideId: 'ask',
    slideTitle: 'The Ask',
    slideNumber: 12,
    question: "How much funding are you raising and what type? (e.g. pre-seed, seed, Series A)",
    placeholder: 'e.g. Raising $750K pre-seed. SAFE at $4M cap. Looking to close by March 2026.',
    helpText: 'Be specific about amount, instrument (SAFE, priced round, convertible note), and timeline. If you have a lead investor, mention it — it creates social proof.',
    workshopHint: 'Funding amount, type, and timeline',
    required: true,
    inputType: 'text',
  },
  {
    id: 'use_of_funds',
    slideId: 'ask',
    slideTitle: 'The Ask',
    slideNumber: 12,
    question: "How will you use the funds? (Break it down by category and %)",
    placeholder: 'e.g. 40% Engineering (2 senior devs). 30% Sales & Marketing. 20% Operations. 10% Reserve. Runway: 18 months. Milestone: $50K MRR.',
    helpText: 'Show clear allocation that maps to achieving your next milestone. Investors want to see their money driving specific, measurable outcomes — not just "burn runway."',
    workshopHint: 'Use of funds breakdown and milestone',
    required: true,
    inputType: 'textarea',
  },
]

// Group questions by slide
export const getQuestionsBySlide = (slideId: string) =>
  QUESTIONS.filter(q => q.slideId === slideId)

// Get total question count
export const TOTAL_QUESTIONS = QUESTIONS.length

// Get slide progress (unique slides answered)
export const getSlideProgress = (answers: Record<string, string>) => {
  const answeredSlides = new Set<string>()
  QUESTIONS.forEach(q => {
    if (answers[q.id]?.trim()) answeredSlides.add(q.slideId)
  })
  return answeredSlides.size
}

// Unique slide IDs in order
export const SLIDE_ORDER = [
  'intro', 'problem', 'solution', 'product',
  'market', 'businessModel', 'traction', 'competition',
  'gtm', 'financials', 'team', 'ask',
] as const
