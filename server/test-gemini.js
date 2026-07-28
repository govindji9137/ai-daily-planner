require('dotenv').config({ path: '.env' });

async function test() {
  const model = process.env.GEMINI_MODEL;
  const key = process.env.GEMINI_API_KEY;
  console.log('Testing with model:', model);
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  
  const body = {
    contents: [
      { role: 'user', parts: [{ text: 'Hello' }] }
    ]
  };
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const data = await res.json();
    console.log('Response status:', res.status);
    console.log('Response body:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
