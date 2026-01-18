import VibecodeLayout from '../components/VibecodeLayout';
import { Layers } from 'lucide-react';

export default function VibecodeStack() {
  return (
    <VibecodeLayout>
      <div className="px-8 lg:px-16 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">The Stack</h1>
            <p className="text-gray-500 mt-1">Tools & Technologies</p>
          </div>
        </div>

        <div className="prose prose-slate lg:prose-lg max-w-none">
          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            Overview of the core tools and technologies used in Vibecode development.
          </p>

          <div className="grid gap-4">
            {[
              { name: 'Supabase', description: 'Database, Auth, and Storage' },
              { name: 'Lovable', description: 'AI-powered development platform' },
              { name: 'Windsurf', description: 'AI coding assistant' },
              { name: 'Typeform', description: 'Form building & data collection' },
              { name: 'Next.js', description: 'React framework for production' },
              { name: 'Tailwind CSS', description: 'Utility-first CSS framework' },
            ].map((tool) => (
              <div key={tool.name} className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-1">{tool.name}</h3>
                <p className="text-sm text-gray-600">{tool.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </VibecodeLayout>
  );
}
