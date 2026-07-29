'use strict';

const { AI_PROVIDER, GEMINI_API_KEY, GEMINI_MODEL, GROQ_API_KEY, GROQ_MODEL } = require('../config/env');

/**
 * Geo AI - The single intelligence provider.
 * Does not make definitive scheduling decisions; only provides recommendations
 * and optimized drafts to the Decision Engine.
 */

const generateScheduleDraft = async (contextPayload, userPrompt) => {
  if (AI_PROVIDER === 'gemini' && !GEMINI_API_KEY) {
    const err = new Error('Gemini API key is not configured on the server.');
    err.status = 503;
    throw err;
  }
  if (AI_PROVIDER === 'groq' && !GROQ_API_KEY) {
    const err = new Error('Groq API key is not configured on the server.');
    err.status = 503;
    throw err;
  }

  const wakeTime = contextPayload.userPreferences?.wakeTime || 'auto';
  const sleepTime = contextPayload.userPreferences?.sleepTime || 'auto';
  
  const w = wakeTime !== 'auto' ? wakeTime : '06:00 AM';
  const s = sleepTime !== 'auto' ? sleepTime : '11:00 PM';

  let sleepRule = "4. COMMON SENSE: Fill 12:00 AM to 06:00 AM with 'Sleep' unless the user explicitly asks to work a night shift.\n5. COMMON SENSE: Schedule 'Sleep' for normal night hours (e.g., 11:00 PM to 07:00 AM) unless instructed otherwise.";
  
  if (wakeTime !== 'auto' || sleepTime !== 'auto') {
    sleepRule = `4. STRICT RULE: You MUST schedule 'Sleep' tasks for all hours starting from ${s} at night until ${w} in the morning. Fill those exact hours with 'Sleep'.`;
  }

  // Build previous day analysis section
  let prevDaySection = '';
  if (contextPayload.previousDayContext) {
    const prev = contextPayload.previousDayContext;
    prevDaySection = `\nPREVIOUS DAY (${prev.date}) ANALYSIS:
- Completion rate: ${prev.completionRate !== null ? prev.completionRate + '%' : 'N/A'}
- Completed: ${prev.completed}, Skipped: ${prev.skipped} of ${prev.total} focus tasks
- Sample tasks: ${JSON.stringify(prev.tasks.slice(0, 5))}
→ Use this to adapt today's plan. If many tasks were skipped, suggest lighter schedule. If high completion, maintain momentum.`;
  }

  // Build weekly context section
  let weekSection = '';
  if (contextPayload.weekContext && contextPayload.weekContext.trim()) {
    weekSection = `\nUSER'S WEEKLY CONTEXT (from their profile — factor this into planning):
${contextPayload.weekContext}`;
  }

  // Build active goals section
  let goalsSection = '';
  if (contextPayload.activeGoals?.length > 0) {
    goalsSection = `\nACTIVE GOALS (align tasks to these where possible):
${contextPayload.activeGoals.map(g => `- ${g.title} [priority: ${g.priority}, progress: ${g.progress}%]`).join('\n')}`;
  }

  const systemPrompt = `You are Geo AI, the intelligence layer of the GeoPlaner Productivity OS.
Your job is to optimize a 24-hour schedule based on the user's constraints, energy levels, modules, history, and weekly goals.

CONTEXT DATA:
${JSON.stringify({ userId: contextPayload.userId, date: contextPayload.date, rules: contextPayload.rules, activeModules: contextPayload.activeModules, userPreferences: contextPayload.userPreferences })}
${prevDaySection}
${weekSection}
${goalsSection}

USER INSTRUCTION:
${userPrompt ? userPrompt : 'Optimize my day for maximum productivity and balance.'}

INSTRUCTIONS:
1. Generate a COMPLETE 24-hour timeline (exactly 24 items).
2. Time must be sequential spanning exactly 24 hours, starting at ${w}.
3. Honor fixed tasks and deadlines.
${sleepRule}
6. COMMON SENSE: Schedule normal human meals (Breakfast ~8 AM, Lunch ~1 PM, Dinner ~7 PM).
7. If weekly context is provided, align today's tasks to weekly priorities.
8. If previous day had skipped tasks, address why — don't repeat the same overloaded pattern.
9. Output ONLY a valid JSON object containing a "schedule" array of tasks matching the Universal Task Model format:
{
  "schedule": [
    { 
      "time": "12:00 AM", 
      "task": "string", 
      "type": "focus|break|fixed|flexible",
      "priority": "low|medium|high|critical",
      "energyLevel": "LOW|MEDIUM|HIGH",
      "focusLevel": "LIGHT|MEDIUM|DEEP",
      "estimatedDuration": 60,
      "moduleId": "personal"
    }
  ]
}
No markdown wrapping, no explanation.`;

  let text = '';
  
  if (AI_PROVIDER === 'groq') {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'You are Geo AI, a scheduling assistant. Output only valid JSON.' },
          { role: 'user', content: systemPrompt }
        ]
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const err = new Error(body?.error?.message || 'Geo AI request failed (Groq).');
      err.status = 502;
      throw err;
    }
    
    const data = await response.json();
    text = data.choices?.[0]?.message?.content || '';
  } else {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] }),
      }
    );

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const err = new Error(body?.error?.message || 'Geo AI request failed (Gemini).');
      err.status = 502;
      throw err;
    }

    const data = await response.json();
    text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  text = text.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      text = text.substring(startIdx, endIdx + 1);
    }
    
    // Fix trailing commas which Llama 3 often generates and which break JSON.parse
    text = text.replace(/,(\s*[\]}])/g, '$1');
    
    const parsed = JSON.parse(text);
    return parsed.schedule || parsed;
  } catch (parseErr) {
    console.error('Failed to parse AI output:', text);
    const err = new Error('Geo AI returned invalid JSON format (Validation failed). Please try again.');
    err.status = 502;
    throw err;
  }
};

module.exports = {
  generateScheduleDraft
};
