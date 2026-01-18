import { ReactNode } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { BookOpen, Lightbulb, Layers, BookText, Sparkles, Shield, ArrowLeft } from 'lucide-react';

interface VibecodeLayoutProps {
  children: ReactNode;
}

const sections = [
  { id: 'stack', label: 'De Stack', icon: Layers, href: '/vibecode-core/stack' },
  { id: 'glossary', label: 'Woordenlijst', icon: BookText, href: '/vibecode-core/glossary' },
  { id: 'prompting', label: 'Prompt Technieken', icon: Sparkles, href: '/vibecode-core/prompting' },
  { id: 'philosophy', label: 'Filosofie', icon: Lightbulb, href: '/vibecode-core' },
  { id: 'boundaries', label: 'Grenzen', icon: Shield, href: '/vibecode-core/boundaries' },
];

export default function VibecodeLayout({ children }: VibecodeLayoutProps) {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="w-60 border-r border-gray-200 flex-shrink-0 bg-gray-50/50">
        <div className="sticky top-0 h-screen flex flex-col">
          <div className="px-4 py-6 border-b border-gray-200">
            <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6 text-sm">
              <ArrowLeft className="w-4 h-4" />
              Terug naar Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-gray-900 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-gray-900">Vibecode</h1>
                <p className="text-xs text-gray-500">Kennisbank</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-0.5">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = pathname === section.href;

              return (
                <Link
                  key={section.id}
                  to={section.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${isActive
                    ? 'bg-gray-200 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {section.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
