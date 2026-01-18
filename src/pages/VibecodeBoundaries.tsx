import VibecodeLayout from '../components/VibecodeLayout';
import { Shield } from 'lucide-react';

export default function VibecodeBoundaries() {
  return (
    <VibecodeLayout>
      <div className="px-8 lg:px-16 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Boundaries</h1>
            <p className="text-gray-500 mt-1">Constraints & guardrails</p>
          </div>
        </div>

        <div className="prose prose-slate lg:prose-lg max-w-none">
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">What We Don't Do</h3>
            <ul className="space-y-3 text-gray-600">
              <li><strong>No Backend Code in Lovable</strong> - Backend logic goes in Supabase Edge Functions</li>
              <li><strong>No Direct Database Access</strong> - Always use RLS policies and proper auth</li>
              <li><strong>No Hardcoded Secrets</strong> - Use environment variables and secrets management</li>
              <li><strong>No Unvalidated User Input</strong> - Always sanitize and validate</li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Security Principles</h3>
            <ul className="space-y-3 text-gray-600">
              <li><strong>Defense in Depth</strong> - Multiple layers of security</li>
              <li><strong>Least Privilege</strong> - Only grant necessary permissions</li>
              <li><strong>Fail Secure</strong> - When in doubt, deny access</li>
              <li><strong>Audit Everything</strong> - Log important actions for review</li>
            </ul>
          </div>
        </div>
      </div>
    </VibecodeLayout>
  );
}
