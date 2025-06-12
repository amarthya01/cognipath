// pages/dashboard.tsx
import { useState, FormEvent, ChangeEvent } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';

type InputMode = 'text' | 'pdf';

export default function Dashboard() {
  const supabaseClient = useSupabaseClient();
  const user = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');

  if (!user) {
    if (typeof window !== 'undefined') { router.push('/'); }
    return null;
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = event.currentTarget;
    const title = (form.elements.namedItem('title') as HTMLInputElement).value;

    if (!title) {
      setError('Title is required.');
      setLoading(false);
      return;
    }

    try {
      let response;
      if (inputMode === 'pdf') {
        if (!selectedFile) {
          throw new Error('Please select a PDF file to upload.');
        }
        const formData = new FormData();
        formData.append('title', title);
        formData.append('pdf', selectedFile);

        response = await fetch('/api/upload-pdf', {
          method: 'POST',
          body: formData, // Browser sets the correct headers automatically for FormData
        });
      } else {
        const content = (form.elements.namedItem('content') as HTMLTextAreaElement).value;
        if (!content) {
          throw new Error('Please paste some content.');
        }
        response = await fetch('/api/generate-path', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content }),
        });
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate path.');
      }

      const { pathId } = await response.json();
      router.push(`/path/${pathId}`);

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <button onClick={() => supabaseClient.auth.signOut()} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Sign Out</button>
        </div>
        <p className="mb-8 text-gray-600">Welcome, {user?.email}</p>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Create a New Learning Path</h2>
          
          {/* --- Input Mode Toggle --- */}
          <div className="flex justify-center space-x-4 mb-6 border-b pb-4">
            <button onClick={() => setInputMode('text')} className={`px-4 py-2 rounded-md ${inputMode === 'text' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Paste Text</button>
            <button onClick={() => setInputMode('pdf')} className={`px-4 py-2 rounded-md ${inputMode === 'pdf' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Upload PDF</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Path Title</label>
              <input type="text" id="title" name="title" required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 sm:text-sm" />
            </div>

            {inputMode === 'text' ? (
              <div className="mb-6">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">Paste your syllabus, article, or notes here:</label>
                <textarea id="content" name="content" rows={15} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 sm:text-sm"></textarea>
              </div>
            ) : (
              <div className="mb-6">
                <label htmlFor="pdf" className="block text-sm font-medium text-gray-700">Upload PDF File</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="pdf-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                        <span>Upload a file</span>
                        <input id="pdf-upload" name="pdf" type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF up to 10MB</p>
                    {fileName && <p className="text-sm font-semibold text-green-600 mt-2">{fileName}</p>}
                  </div>
                </div>
              </div>
            )}
            
            <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300">
              {loading ? 'Generating...' : 'Create Path'}
            </button>
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}