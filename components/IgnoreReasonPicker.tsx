'use client'

import { useState } from 'react'
import { X, MessageSquare, Check } from 'lucide-react'

export type IgnoreReasonType = 
  | 'irrelevant'
  | 'noise'
  | 'duplicate'
  | 'too_shallow'
  | 'too_technical'
  | 'bad_timing'
  | 'off_topic'
  | 'known'
  | 'custom'

interface IgnoreReasonOption {
  value: IgnoreReasonType
  label: string
  emoji: string
  description: string
}

const IGNORE_REASONS: IgnoreReasonOption[] = [
  { value: 'irrelevant', label: 'Irrelevant', emoji: '🚫', description: 'Not relevant to Vibecoders work' },
  { value: 'noise', label: 'Noise/Hype', emoji: '📢', description: 'Marketing fluff, clickbait' },
  { value: 'duplicate', label: 'Duplicate', emoji: '♻️', description: 'Already seen this story' },
  { value: 'too_shallow', label: 'Too Shallow', emoji: '🏊‍♂️', description: 'Not enough depth' },
  { value: 'too_technical', label: 'Too Technical', emoji: '🔬', description: 'Too deep for now' },
  { value: 'bad_timing', label: 'Not Now', emoji: '⏰', description: 'Interesting but not right now' },
  { value: 'off_topic', label: 'Off Topic', emoji: '🎯', description: 'Wrong category' },
  { value: 'known', label: 'Already Know', emoji: '✅', description: 'Already familiar' },
  { value: 'custom', label: 'Other', emoji: '💬', description: 'Custom reason' },
]

interface IgnoreReasonPickerProps {
  articleId: string
  decisionId?: string
  onSelect: (reasonType: IgnoreReasonType, customText?: string) => void
  onCancel: () => void
  compact?: boolean
}

export default function IgnoreReasonPicker({
  articleId,
  decisionId,
  onSelect,
  onCancel,
  compact = false,
}: IgnoreReasonPickerProps) {
  const [selectedReason, setSelectedReason] = useState<IgnoreReasonType | null>(null)
  const [customText, setCustomText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit() {
    if (!selectedReason) return
    
    setIsSubmitting(true)
    
    try {
      // Submit to API
      const response = await fetch('/api/decisions/ignore-reason', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: articleId,
          decision_id: decisionId,
          reason_type: selectedReason,
          reason_text: selectedReason === 'custom' ? customText : undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save reason')
      }

      onSelect(selectedReason, customText || undefined)
    } catch (error) {
      console.error('Failed to save ignore reason:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleQuickSelect(reason: IgnoreReasonType) {
    if (reason === 'custom') {
      setSelectedReason(reason)
    } else {
      setSelectedReason(reason)
      // Auto-submit for quick reasons (except custom)
      setTimeout(() => {
        handleSubmit()
      }, 100)
    }
  }

  if (compact) {
    // Compact chip view for inline use
    return (
      <div className="flex flex-wrap gap-2">
        {IGNORE_REASONS.filter(r => r.value !== 'custom').map(reason => (
          <button
            key={reason.value}
            onClick={() => handleQuickSelect(reason.value)}
            disabled={isSubmitting}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
          >
            <span>{reason.emoji}</span>
            <span>{reason.label}</span>
          </button>
        ))}
        <button
          onClick={() => setSelectedReason('custom')}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          <MessageSquare className="w-3 h-3" />
          <span>Other</span>
        </button>

        {/* Custom text input */}
        {selectedReason === 'custom' && (
          <div className="w-full flex gap-2 mt-2">
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Why are you ignoring this?"
              className="flex-1 px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleSubmit}
              disabled={!customText.trim() || isSubmitting}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    )
  }

  // Full modal view
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">Why ignore this?</h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Reason options */}
        <div className="p-4 space-y-2">
          {IGNORE_REASONS.map(reason => (
            <button
              key={reason.value}
              onClick={() => setSelectedReason(reason.value)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                selectedReason === reason.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{reason.emoji}</span>
              <div className="text-left flex-1">
                <div className="font-medium text-gray-900">{reason.label}</div>
                <div className="text-sm text-gray-500">{reason.description}</div>
              </div>
              {selectedReason === reason.value && (
                <Check className="w-5 h-5 text-blue-600" />
              )}
            </button>
          ))}

          {/* Custom text input */}
          {selectedReason === 'custom' && (
            <div className="mt-4">
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Describe why you're ignoring this article..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedReason || (selectedReason === 'custom' && !customText.trim()) || isSubmitting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
