
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkLatestDecision() {
    console.log("Checking latest decision...")

    const { data: decisions, error } = await supabase
        .from('decision_assessments')
        .select(`
      *,
      article:articles(title)
    `)
        .order('created_at', { ascending: false })
        .limit(1)

    if (error) {
        console.error("Error fetching decisions:", error)
        return
    }

    if (decisions && decisions.length > 0) {
        const d = decisions[0]
        console.log("\n✅ LATEST DECISION FOUND:")
        console.log(`- ID: ${d.id}`)
        console.log(`- Article: ${d.article?.title}`)
        console.log(`- Action: ${d.action_required}`)
        console.log(`- Timstamp: ${new Date(d.created_at).toLocaleString()}`)

        // Check signals
        const { data: weights, error: wError } = await supabase
            .from('user_signal_weights')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(5)

        if (weights) {
            console.log("\n✅ LATEST SIGNAL UPDATES:")
            weights.forEach(w => {
                console.log(`- ${w.feature_key} (${w.feature_type}): ${w.weight.toFixed(2)} [${w.updated_at}]`)
            })
        }

    } else {
        console.log("❌ NO DECISIONS FOUND.")
    }
}

checkLatestDecision()
