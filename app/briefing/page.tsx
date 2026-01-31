import { redirect } from 'next/navigation'

/**
 * Briefing is now integrated into Projects
 * Redirect to projects page
 */
export default function BriefingPage() {
  redirect('/projects')
}
