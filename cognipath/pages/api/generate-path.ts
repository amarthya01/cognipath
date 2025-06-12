// pages/api/generate-path.ts

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import OpenAI from 'openai'; // <-- 1. IMPORT changed
import type { NextApiRequest, NextApiResponse } from 'next';

// --- 2. Correct OpenAI Client Initialization ---
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServerSupabaseClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { title, content } = req.body;

  try {
    const prompt = `You are "CogniPath," an expert instructional designer creating learning paths for individuals with ADHD. Your task is to decompose the following text into a sequence of manageable learning chunks. Rules: 1. Analyze the entire text to understand its structure and key concepts. 2. Break it down into 5-15 logical chunks. Each chunk should represent about 15-20 minutes of focused work. 3. For each chunk, provide a concise \`title\` (string), a \`summary\` (string, 1-2 sentences), and an array of \`key_points\` (array of strings). 4. The final output MUST be only a valid JSON array of objects, with no other text, comments, or explanations. The text to process is below: --- ${content}`;

    // --- 3. Correct API Call Syntax ---
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    });
    
    // --- 4. Correct Way to Access the Response ---
    const chunks = JSON.parse(completion.choices[0].message.content || "");

    const { data: pathData, error } = await supabase
      .from('paths')
      .insert({
        user_id: session.user.id,
        title: title,
        chunks: chunks,
      })
      .select('id')
      .single();

    if (error) throw error;

    res.status(200).json({ pathId: pathData.id });

  } catch (error) {
    console.error('Error generating path:', error);
    res.status(500).json({ error: 'Failed to generate learning path.' });
  }
}