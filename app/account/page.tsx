'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Navigation from '@/components/Navigation'
import { 
  User, Mail, Shield, CreditCard, Bell, LogOut, 
  Save, Loader2, Check, AlertTriangle, Sparkles,
  Zap, Building, Crown
} from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  subscription_tier: string
  subscription_status: string
  articles_scanned_this_month: number
  llm_calls_this_month: number
  preferences: Record<string, any>
  onboarding_completed: boolean
}

interface SubscriptionLimit {
  tier: string
  max_articles_per_month: number
  max_llm_calls_per_month: number
  max_projects: number
  features: Record<string, boolean>
}

const TIER_INFO = {
  free: { name: 'Free', icon: Sparkles, color: 'text-slate-600', bg: 'bg-slate-100' },
  pro: { name: 'Pro', icon: Zap, color: 'text-blue-600', bg: 'bg-blue-100' },
  team: { name: 'Team', icon: Building, color: 'text-purple-600', bg: 'bg-purple-100' },
  enterprise: { name: 'Enterprise', icon: Crown, color: 'text-amber-600', bg: 'bg-amber-100' },
}

export default function AccountPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [limits, setLimits] = useState<SubscriptionLimit | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const router = useRouter()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setEditedName(profileData.full_name || '')

        // Fetch limits for this tier
        const { data: limitsData } = await supabase
          .from('subscription_limits')
          .select('*')
          .eq('tier', profileData.subscription_tier)
          .single()

        if (limitsData) {
          setLimits(limitsData)
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return
    
    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          full_name: editedName,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error

      setProfile({ ...profile, full_name: editedName })
      setMessage({ type: 'success', text: 'Profile updated successfully' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-6 py-12 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-slate-600">Profile not found. Please sign in again.</p>
        </div>
      </div>
    )
  }

  const tierInfo = TIER_INFO[profile.subscription_tier as keyof typeof TIER_INFO] || TIER_INFO.free
  const TierIcon = tierInfo.icon

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">Account Settings</h1>

        <div className="space-y-6">
          {/* Profile Section */}
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
              <User className="w-5 h-5 text-slate-400" />
              <h2 className="font-semibold text-slate-900">Profile</h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Avatar & Name */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 
                              flex items-center justify-center text-white text-xl font-bold">
                  {(profile.full_name || profile.email)[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{profile.email}</span>
                </div>
              </div>

              {/* Message */}
              {message && (
                <div className={`p-3 rounded-lg flex items-center gap-2 ${
                  message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {message.text}
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSaveProfile}
                disabled={saving || editedName === profile.full_name}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg
                         hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </section>

          {/* Subscription Section */}
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-slate-400" />
              <h2 className="font-semibold text-slate-900">Subscription</h2>
            </div>
            <div className="p-6">
              {/* Current Plan */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${tierInfo.bg} flex items-center justify-center`}>
                    <TierIcon className={`w-5 h-5 ${tierInfo.color}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{tierInfo.name} Plan</p>
                    <p className="text-sm text-slate-500 capitalize">{profile.subscription_status}</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Upgrade
                </button>
              </div>

              {/* Usage */}
              {limits && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-700">This Month's Usage</h3>
                  
                  {/* Articles */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Articles Scanned</span>
                      <span className="font-medium">
                        {profile.articles_scanned_this_month} / {limits.max_articles_per_month === -1 ? '∞' : limits.max_articles_per_month}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ 
                          width: limits.max_articles_per_month === -1 
                            ? '10%' 
                            : `${Math.min(100, (profile.articles_scanned_this_month / limits.max_articles_per_month) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>

                  {/* LLM Calls */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">AI Insights Generated</span>
                      <span className="font-medium">
                        {profile.llm_calls_this_month} / {limits.max_llm_calls_per_month === -1 ? '∞' : limits.max_llm_calls_per_month}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full"
                        style={{ 
                          width: limits.max_llm_calls_per_month === -1 
                            ? '10%' 
                            : `${Math.min(100, (profile.llm_calls_this_month / limits.max_llm_calls_per_month) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Security Section */}
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
              <Shield className="w-5 h-5 text-slate-400" />
              <h2 className="font-semibold text-slate-900">Security</h2>
            </div>
            <div className="p-6 space-y-4">
              <button className="w-full text-left px-4 py-3 border border-slate-200 rounded-lg 
                               hover:bg-slate-50 transition-colors">
                <p className="font-medium text-slate-900">Change Password</p>
                <p className="text-sm text-slate-500">Update your password</p>
              </button>
              
              <button className="w-full text-left px-4 py-3 border border-slate-200 rounded-lg 
                               hover:bg-slate-50 transition-colors">
                <p className="font-medium text-slate-900">Two-Factor Authentication</p>
                <p className="text-sm text-slate-500">Add an extra layer of security</p>
              </button>
            </div>
          </section>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </main>
    </div>
  )
}
