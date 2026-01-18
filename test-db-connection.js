// Test database connection and check projects table
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
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testConnection() {
    console.log('Testing Supabase connection...')
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Using Service Role Key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

    try {
        // Test 1: Check if we can query the projects table
        console.log('\n--- Test 1: Fetching all projects ---')
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .limit(5)

        if (error) {
            console.error('Error fetching projects:', error)
        } else {
            console.log('Success! Found', data.length, 'projects')
            console.log('Projects:', JSON.stringify(data, null, 2))
        }

        // Test 2: Check table schema
        console.log('\n--- Test 2: Checking table structure ---')
        const { data: schemaData, error: schemaError } = await supabase
            .from('projects')
            .select('*')
            .limit(0)

        if (schemaError) {
            console.error('Error checking schema:', schemaError)
        } else {
            console.log('Table exists and is accessible')
        }

        // Test 3: Try to insert a test project
        console.log('\n--- Test 3: Creating a test project ---')
        const { data: insertData, error: insertError } = await supabase
            .from('projects')
            .insert([{
                name: 'Test Project from Script',
                client_name: 'Test Client',
                description: 'Testing database connection',
                type: 'Application',
                status: 'Prospect',
                color_theme: 'gray',
                is_archived: false
            }])
            .select()
            .single()

        if (insertError) {
            console.error('Error creating project:', insertError)
        } else {
            console.log('Success! Created project:', insertData)
        }

    } catch (err) {
        console.error('Unexpected error:', err)
    }
}

testConnection()
