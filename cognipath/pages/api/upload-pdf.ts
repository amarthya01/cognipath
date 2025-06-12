// pages/api/upload-pdf.ts
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import OpenAI from 'openai'; // <-- 1. IMPORT changed
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import pdf from 'pdf-parse';

// --- 2. Correct OpenAI Client Initialization ---
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- Disable Next.js's default body parser so Formidable can work ---
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- Authenticate user with Supabase ---
  const supabase = createServerSupabaseClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const userId = session.user.id;

  try {
    // --- Step 1: Parse the incoming file upload ---
    const data = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
      const form = formidable({});
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const title = Array.isArray(data.fields.title) ? data.fields.title[0] : data.fields.title;
    const pdfFile = Array.isArray(data.files.pdf) ? data.files.pdf[0] : data.files.pdf;

    if (!pdfFile || !title) {
      return res.status(400).json({ error: 'Title and PDF file are required.' });
    }

    // --- Step 2: Read the PDF file and extract its text ---
    const pdfBuffer = fs.readFileSync(pdfFile.filepath);
    const pdfData = await pdf(pdfBuffer);
    const extractedText = pdfData.text;

    // --- Step 3: Upload the original PDF to Supabase Storage ---
    const fileName = `${userId}/${Date.now()}-${pdfFile.originalFilename}`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from('pdfs')
      .upload(fileName, pdfBuffer, {
        contentType: pdfFile.mimetype || 'application/pdf',
        upsert: false,
      });

    if (storageError) {
      throw new Error(`Storage Error: ${storageError.message}`);
    }

    // --- Step 4: Generate a SIGNED URL for the PRIVATE PDF ---
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('pdfs')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365 * 10); // Expires in 10 years

    if (signedUrlError) {
      throw new Error(`Signed URL Error: ${signedUrlError.message}`);
    }
    const privatePdfUrl = signedUrlData.signedUrl;

    // --- Step 5: Send the extracted text to OpenAI to generate chunks ---
    const prompt = `You are "CogniPath," an expert instructional designer creating learning paths for individuals with ADHD. Your task is to decompose the following text into a sequence of manageable learning chunks. Rules: 1. Analyze the entire text to understand its structure and key concepts. 2. Break it down into 5-15 logical chunks. Each chunk should represent about 15-20 minutes of focused work. 3. For each chunk, provide a concise \`title\` (string), a \`summary\` (string, 1-2 sentences), and an array of \`key_points\` (array of strings). 4. The final output MUST be only a valid JSON array of objects, with no other text, comments, or explanations. The text to process is below: --- ${extractedText}`;
    
    // --- Correct OpenAI API Call Syntax ---
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    });
    const chunks = JSON.parse(completion.choices[0].message.content || "");

    // --- Step 6: Save the new path to your database, including the PDF URL ---
    const { data: pathData, error: dbError } = await supabase
      .from('paths')
      .insert({
        user_id: userId,
        title: title,
        chunks: chunks,
        pdf_url: privatePdfUrl, // Save the SIGNED link to the private PDF
      })
      .select('id')
      .single();

    if (dbError) throw dbError;

    // --- Step 7: Send the new path ID back to the client ---
    res.status(200).json({ pathId: pathData.id });

  } catch (error: any) {
    console.error('Error in upload-pdf:', error);
    res.status(500).json({ error: `Failed to process PDF: ${error.message}` });
  }
}