// pages/path/[id].tsx
import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Chunk {
  title: string;
  summary: string;
  key_points: string[];
}

interface Path {
  id: number;
  title: string;
  chunks: Chunk[];
  current_step: number;
}

export default function PathView() {
  const router = useRouter();
  const { id } = router.query;
  const supabase = useSupabaseClient();

  const [path, setPath] = useState<Path | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPath() {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('paths')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching path:', error);
      } else {
        setPath(data as Path);
        setCurrentStep(data.current_step);
      }
      setLoading(false);
    }
    fetchPath();
  }, [id, supabase]);

  const handleNextStep = async () => {
    if (!path) return;
    const nextStep = currentStep + 1;
    if (nextStep < path.chunks.length) {
      setCurrentStep(nextStep);
      await supabase
        .from('paths')
        .update({ current_step: nextStep })
        .eq('id', id);
    } else {
      // Handle path completion
      setCurrentStep(nextStep);
    }
  };

  if (loading) return <div className="text-center p-10">Loading your path...</div>;
  if (!path) return <div className="text-center p-10">Path not found.</div>;

  const progress = path.chunks.length > 0 ? ((currentStep) / path.chunks.length) * 100 : 0;
  const chunk = path.chunks[currentStep];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800">← Back to Dashboard</Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">{path.title}</h1>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5 my-6">
          <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
        </div>
        
        {currentStep < path.chunks.length ? (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800">Step {currentStep + 1}: {chunk.title}</h2>
            <p className="mt-4 text-gray-700"><strong>Summary:</strong> {chunk.summary}</p>
            <h3 className="mt-6 text-lg font-semibold text-gray-800">Key Points to Focus On:</h3>
            <ul className="mt-2 list-disc list-inside space-y-1 text-gray-600">
              {chunk.key_points.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
            <button onClick={handleNextStep} className="mt-8 w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Mark as Complete & Go to Next Step →
            </button>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <h2 className="text-3xl font-bold text-green-600">Congratulations!</h2>
            <p className="mt-4 text-lg text-gray-700">You have completed this learning path.</p>
          </div>
        )}
      </div>
    </div>
  );
}