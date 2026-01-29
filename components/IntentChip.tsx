'use client'

import { type IntentLabel, getIntentDisplayProps } from '@/lib/signals/intentLabels'

interface IntentChipProps {
  intent: IntentLabel | null | undefined
  confidence?: number
  showConfidence?: boolean
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Displays article intent as a colored chip
 * Shows emoji + label, optionally with confidence indicator
 */
export function IntentChip({
  intent,
  confidence,
  showConfidence = false,
  size = 'sm',
  className = ''
}: IntentChipProps) {
  if (!intent) return null
  
  const props = getIntentDisplayProps(intent)
  
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs'
    : 'px-3 py-1 text-sm'
  
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium
                  ${props.bgColor} ${props.color} ${sizeClasses} ${className}`}
      title={`${props.description}${confidence ? ` (${Math.round(confidence * 100)}% confident)` : ''}`}
    >
      <span>{props.emoji}</span>
      <span>{props.label}</span>
      {showConfidence && confidence && (
        <span className="opacity-60 text-[10px]">
          {Math.round(confidence * 100)}%
        </span>
      )}
    </span>
  )
}

/**
 * Filter bar for intent types
 */
interface IntentFilterProps {
  selected: IntentLabel | 'all'
  onChange: (intent: IntentLabel | 'all') => void
  counts?: Partial<Record<IntentLabel | 'all', number>>
}

const ALL_INTENTS: IntentLabel[] = ['release', 'controversy', 'how-to', 'benchmark', 'opinion', 'research', 'news']

export function IntentFilter({ selected, onChange, counts = {} }: IntentFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* All option */}
      <button
        onClick={() => onChange('all')}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                    ${selected === 'all' 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
      >
        All
        {counts.all !== undefined && (
          <span className="ml-1.5 opacity-70">({counts.all})</span>
        )}
      </button>
      
      {/* Intent options */}
      {ALL_INTENTS.map(intent => {
        const props = getIntentDisplayProps(intent)
        const count = counts[intent]
        
        return (
          <button
            key={intent}
            onClick={() => onChange(intent)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                        ${selected === intent 
                          ? `${props.bgColor} ${props.color} ring-2 ring-offset-1 ring-current` 
                          : `bg-slate-50 text-slate-600 hover:${props.bgColor}`}`}
          >
            <span className="mr-1">{props.emoji}</span>
            {props.label}
            {count !== undefined && count > 0 && (
              <span className="ml-1.5 opacity-70">({count})</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Stacked intent chips for articles with multiple detected intents
 */
interface IntentStackProps {
  intents: Array<{ label: IntentLabel, confidence: number }>
  max?: number
}

export function IntentStack({ intents, max = 2 }: IntentStackProps) {
  if (!intents || intents.length === 0) return null
  
  const sorted = [...intents].sort((a, b) => b.confidence - a.confidence)
  const displayed = sorted.slice(0, max)
  const remaining = sorted.length - max
  
  return (
    <div className="flex flex-wrap gap-1">
      {displayed.map((intent, index) => (
        <IntentChip
          key={intent.label}
          intent={intent.label}
          confidence={intent.confidence}
          size="sm"
        />
      ))}
      {remaining > 0 && (
        <span className="text-xs text-slate-500">
          +{remaining}
        </span>
      )}
    </div>
  )
}
