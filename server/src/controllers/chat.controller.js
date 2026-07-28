'use strict';

const { AI_PROVIDER, GEMINI_API_KEY, GEMINI_MODEL, GROQ_API_KEY, GROQ_MODEL } = require('../config/env');
const scheduleService = require('../services/schedule.service');

// POST /api/chat - main endpoint for AI Assistant (Groq Llama 3.1 supported)
const chat = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    
    if (AI_PROVIDER === 'gemini' && !GEMINI_API_KEY) {
      return res.status(503).json({ success: false, message: 'Gemini API key is not configured.' });
    }
    if (AI_PROVIDER === 'groq' && !GROQ_API_KEY) {
      return res.status(503).json({ success: false, message: 'Groq API key is not configured.' });
    }

    // Get today's schedule for context
    const todaySchedule = await scheduleService.getSchedule(req.user.id);
    let contextStr = 'No schedule planned for today yet.';
    if (todaySchedule && todaySchedule.slots) {
      const mini = todaySchedule.slots.map(s => ({ t: s.time, a: s.task }));
      contextStr = JSON.stringify(mini);
    }

    const systemPrompt = `You are "jiG", a helpful, friendly, and concise AI daily planner assistant. 
You help the user manage their time, stay productive, and reflect on their day.
The user is currently talking to you through a floating chat window.

Here is the user's schedule for today:
${contextStr}

Respond to the user's message considering their schedule. Keep responses short and conversational.`;

    let reply = '';
    
    if (AI_PROVIDER === 'groq') {
      const groqHistory = history.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));
      const requestBody = {
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...groqHistory,
          { role: 'user', content: message }
        ]
      };
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        require('fs').writeFileSync('groq-error.log', JSON.stringify(body, null, 2));
        const err = new Error(body?.error?.message || 'Chat API request failed (Groq).');
        err.status = 502;
        throw err;
      }

      const data = await response.json();
      reply = data.choices?.[0]?.message?.content || 'I am not sure how to respond to that.';
      
    } else {
      const formattedHistory = history.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const requestBody = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [...formattedHistory, { role: 'user', parts: [{ text: message }] }]
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        require('fs').writeFileSync('gemini-error.log', JSON.stringify(body, null, 2));
        const err = new Error(body?.error?.message || 'Chat API request failed (Gemini).');
        err.status = 502;
        throw err;
      }

      const data = await response.json();
      reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I am not sure how to respond to that.';
    }

    res.json({ success: true, data: { reply } });
  } catch (err) {
    next(err);
  }
};

module.exports = { chat };
