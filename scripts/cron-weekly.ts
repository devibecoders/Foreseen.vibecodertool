import cron from 'node-cron'

const FORESEE_URL = process.env.FORESEE_URL || 'http://localhost:3000'

async function runWeeklyScan() {
  console.log(`[${new Date().toISOString()}] Starting weekly scan...`)
  
  try {
    const response = await fetch(`${FORESEE_URL}/api/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ daysBack: 7 })
    })
    
    const data = await response.json()
    
    if (data.success) {
      console.log(`✓ Scan complete:`)
      console.log(`  - Fetched: ${data.itemsFetched}`)
      console.log(`  - New: ${data.itemsNew}`)
      console.log(`  - Analyzed: ${data.itemsAnalyzed}`)
      console.log(`  - Duplicates removed: ${data.duplicatesRemoved}`)
    } else {
      console.error(`✗ Scan failed: ${data.error}`)
    }
  } catch (error) {
    console.error(`✗ Error running scan:`, error)
  }
}

console.log('Foresee Weekly Cron started')
console.log('Schedule: Every Monday at 9:00 AM')

cron.schedule('0 9 * * 1', runWeeklyScan, {
  timezone: 'Europe/Amsterdam'
})

console.log('Cron job scheduled. Press Ctrl+C to exit.')
