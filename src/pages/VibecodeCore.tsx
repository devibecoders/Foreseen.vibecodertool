import VibecodeLayout from '../components/VibecodeLayout';
import { Link } from 'react-router-dom';
import { Lightbulb, Layers, BookText, Sparkles, Shield, ArrowRight } from 'lucide-react';

const quickLinks = [
  {
    title: 'The Stack',
    description: 'Supabase, Lovable, Windsurf, Typeform',
    icon: Layers,
    href: '/vibecode-core/stack',
    color: 'from-slate-800 to-slate-900',
  },
  {
    title: 'Glossary',
    description: 'Technical terms explained',
    icon: BookText,
    href: '/vibecode-core/glossary',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    title: 'Prompt Engineering',
    description: 'Rules & recipes for AI',
    icon: Sparkles,
    href: '/vibecode-core/prompting',
    color: 'from-purple-500 to-violet-600',
  },
  {
    title: 'Boundaries',
    description: 'Constraints & guardrails',
    icon: Shield,
    href: '/vibecode-core/boundaries',
    color: 'from-rose-500 to-red-600',
  },
];

export default function VibecodeCore() {
  return (
    <VibecodeLayout>
      <div className="px-8 lg:px-16 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Vibecode Core</h1>
              <p className="text-gray-500 mt-1">Knowledge Hub</p>
            </div>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl leading-relaxed">
            The central knowledge base for Vibecode development standards, tools, and philosophy.
            Everything you need to build the right way.
          </p>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                to={link.href}
                className="group bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 group-hover:text-slate-700 transition-colors">
                      {link.title}
                    </h3>
                    <p className="text-sm text-gray-500">{link.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Philosophy Section */}
        <div className="border-t border-gray-200 pt-10">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Philosophy</h2>
              <p className="text-sm text-gray-500 mt-1">The mindset behind our approach</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-8 prose prose-slate lg:prose-lg max-w-none">
                <h3>Vibecode Development Philosophy</h3>
                <p>
                  Vibecode is about building with intention, leveraging AI tools effectively, 
                  and maintaining high quality standards while moving fast.
                </p>
                <h4>Core Principles</h4>
                <ul>
                  <li><strong>Speed with Quality</strong> - Move fast, but don't break things</li>
                  <li><strong>AI-Augmented</strong> - Let AI handle the routine, humans handle the creative</li>
                  <li><strong>Documentation First</strong> - If it's not documented, it doesn't exist</li>
                  <li><strong>Simplicity</strong> - The best code is the code you don't have to write</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </VibecodeLayout>
  );
}
