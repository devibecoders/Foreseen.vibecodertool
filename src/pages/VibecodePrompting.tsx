import VibecodeLayout from '../components/VibecodeLayout';
import { Sparkles } from 'lucide-react';

export default function VibecodePrompting() {
  return (
    <VibecodeLayout>
      <div className="px-8 lg:px-16 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Prompt Engineering</h1>
            <p className="text-gray-500 mt-1">Rules & recipes for AI</p>
          </div>
        </div>

        <div className="prose prose-slate lg:prose-lg max-w-none">
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Best Practices</h3>
            <ul className="space-y-3 text-gray-600">
              <li><strong>Be Specific</strong> - Clear, detailed prompts get better results</li>
              <li><strong>Provide Context</strong> - Include relevant background information</li>
              <li><strong>Use Examples</strong> - Show the AI what you want with examples</li>
              <li><strong>Iterate</strong> - Refine prompts based on output quality</li>
              <li><strong>Structure Output</strong> - Request specific formats (JSON, Markdown, etc.)</li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Common Patterns</h3>
            <ul className="space-y-3 text-gray-600">
              <li><strong>Role Assignment</strong> - "You are an expert [role]..."</li>
              <li><strong>Step-by-Step</strong> - "Think through this step by step..."</li>
              <li><strong>Constraints</strong> - "Keep the response under 200 words..."</li>
              <li><strong>Format Specification</strong> - "Respond in JSON format..."</li>
            </ul>
          </div>
        </div>
      </div>
    </VibecodeLayout>
  );
}
