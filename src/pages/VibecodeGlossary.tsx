import VibecodeLayout from '../components/VibecodeLayout';
import { BookText } from 'lucide-react';

const glossaryTerms = [
  { term: 'Vibecode', definition: 'A development methodology that combines AI tools with human creativity for rapid, high-quality software development.' },
  { term: 'LLM', definition: 'Large Language Model - AI models trained on vast text data, capable of understanding and generating human-like text.' },
  { term: 'RLS', definition: 'Row Level Security - Supabase feature that restricts database access at the row level based on user policies.' },
  { term: 'Edge Function', definition: 'Serverless functions that run at the edge, closer to users, for faster response times.' },
  { term: 'Prompt Engineering', definition: 'The practice of designing and optimizing prompts to get better results from AI models.' },
  { term: 'Agentic AI', definition: 'AI systems that can take autonomous actions to accomplish goals, rather than just responding to queries.' },
];

export default function VibecodeGlossary() {
  return (
    <VibecodeLayout>
      <div className="px-8 lg:px-16 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <BookText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Glossary</h1>
            <p className="text-gray-500 mt-1">Technical terms explained</p>
          </div>
        </div>

        <div className="space-y-4">
          {glossaryTerms.map((item) => (
            <div key={item.term} className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 mb-2">{item.term}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.definition}</p>
            </div>
          ))}
        </div>
      </div>
    </VibecodeLayout>
  );
}
