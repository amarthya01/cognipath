# CogniPath 🧠✨

**CogniPath** is a web application designed to help individuals, especially those with ADHD, overcome the executive dysfunction associated with starting large, overwhelming tasks. By leveraging AI, it automatically decomposes dense study materials, articles, and notes into a clear, manageable, and motivating step-by-step learning path.

This project was built to transform the "wall of awful" into a winnable game, reducing procrastination and making learning more accessible and rewarding.


---

## 🚀 Core Features

*   **AI-Powered Decomposition:** Paste text or upload a PDF, and CogniPath's AI will analyze the content and break it down into logical, bite-sized learning chunks.
*   **The "Focus Path" UI:** View only one manageable chunk at a time, eliminating the overwhelm of seeing the entire plan at once.
*   **Gamified Progression:** Move from one step to the next with a clear sense of forward momentum and a visual progress bar.
*   **PDF Uploads:** Seamlessly upload academic papers, textbook chapters, or any PDF document for analysis.
*   **Secure & Private:** User authentication ensures your learning paths are saved to your account, and uploaded PDFs are stored securely and privately.

---

## 🛠️ Tech Stack

This project is built with a modern, full-stack JavaScript ecosystem.

*   **Frontend:** [Next.js](https://nextjs.org/) (with React & TypeScript)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Backend:** Next.js API Routes (Node.js)
*   **AI:** [OpenAI API](https://platform.openai.com/) (gpt-3.5-turbo)
*   **Database & Auth:** [Supabase](https://supabase.io/)
*   **File Storage:** Supabase Storage
*   **PDF Parsing:** [pdf-parse](https://www.npmjs.com/package/pdf-parse)
*   **File Uploads:** [Formidable](https://www.npmjs.com/package/formidable)

---

## ⚙️ Getting Started

To run this project locally, follow these steps:

### 1. Prerequisites

*   Node.js (v18 or later recommended)
*   npm
*   A Supabase account
*   An OpenAI API key

### 2. Clone the Repository

```bash
git clone https://github.com/[your-github-username]/cognipath.git
cd cognipath
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Set Up Environment Variables

Create a new file named `.env.local` in the root of your project and add the following keys. You can get these from your Supabase and OpenAI dashboards.

```
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# OpenAI
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
```

### 5. Set Up the Database

Log in to your Supabase project and run the following queries in the SQL Editor to set up the necessary tables and policies.

**Create the `paths` table:**
```sql
-- Create the 'paths' table
CREATE TABLE paths (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  chunks JSONB,
  current_step INT DEFAULT 0 NOT NULL,
  pdf_url TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE paths ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Allow users to see their own paths" ON paths FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to insert their own paths" ON paths FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to update their own paths" ON paths FOR UPDATE USING (auth.uid() = user_id);
```

**Set up Storage policies for the `pdfs` bucket:**
*(Ensure you have a private bucket named `pdfs`)*
```sql
-- Policies for 'pdfs' bucket
CREATE POLICY "Allow individual read access" ON storage.objects FOR SELECT USING (bucket_id = 'pdfs' AND auth.uid() = (storage.foldername(name))[1]::uuid);
CREATE POLICY "Allow individual insert access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pdfs' AND auth.uid() = (storage.foldername(name))[1]::uuid);
CREATE POLICY "Allow individual update access" ON storage.objects FOR UPDATE USING (bucket_id = 'pdfs' AND auth.uid() = (storage.foldername(name))[1]::uuid);
CREATE POLICY "Allow individual delete access" ON storage.objects FOR DELETE USING (bucket_id = 'pdfs' AND auth.uid() = (storage.foldername(name))[1]::uuid);
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🌟 Future Improvements

*   **Path Library:** Allow users to share their generated paths with the community.
*   **Enhanced Gamification:** Add streaks, badges, and points for completing paths.
*   **URL Parsing:** Allow users to paste a URL to an article for decomposition.
*   **Mobile-First Design:** Improve the user experience on mobile devices.
*   **"Focus Mode":** An even more minimal UI during a study session, potentially with an integrated Pomodoro timer.
