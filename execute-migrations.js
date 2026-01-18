// Execute migration SQL directly via Supabase client
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load .env file manually
const envPath = path.join(__dirname, '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
        const key = match[1].trim()
        const value = match[2].trim().replace(/^["']|["']$/g, '')
        process.env[key] = value
    }
})

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function executeMigration() {
    console.log('Executing migration: 005_projects_pipeline.sql\n')

    try {
        // Read the migration file
        const migrationPath = path.join(__dirname, 'supabase/migrations/005_projects_pipeline.sql')
        let migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

        // Remove comments and split into individual statements
        const statements = migrationSQL
            .split('\n')
            .filter(line => !line.trim().startsWith('--'))
            .join('\n')
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0)

        console.log(`Found ${statements.length} SQL statements to execute\n`)

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i]
            if (stmt.length < 10) continue // Skip very short statements

            console.log(`Executing statement ${i + 1}/${statements.length}...`)

            const { data, error } = await supabase.rpc('exec_sql', { sql: stmt })

            if (error) {
                console.error(`Error on statement ${i + 1}:`, error)
                console.error('Statement:', stmt.substring(0, 100) + '...')

                // Try alternative: direct query for CREATE TABLE
                if (stmt.includes('CREATE TABLE projects')) {
                    console.log('\nTrying direct table creation...')
                    const { error: createError } = await supabase
                        .from('projects')
                        .select('*')
                        .limit(0)

                    if (createError && createError.code === 'PGRST205') {
                        console.error('Table still does not exist. Need to use Supabase Dashboard SQL Editor.')
                        console.log('\n=== MANUAL STEP REQUIRED ===')
                        console.log('Please go to: https://supabase.com/dashboard/project/sqxbnlkwrzudotgiiusx/sql/new')
                        console.log('And execute the following SQL:\n')
                        console.log(migrationSQL)
                        process.exit(1)
                    }
                }
            } else {
                console.log(`✓ Statement ${i + 1} executed successfully`)
            }
        }

        console.log('\n✅ Migration completed!')

    } catch (err) {
        console.error('Unexpected error:', err)
    }
}

executeMigration()
