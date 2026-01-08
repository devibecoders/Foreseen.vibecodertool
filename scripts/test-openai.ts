import OpenAI from 'openai'
import { readFileSync } from 'fs'
import { join } from 'path'

const envPath = join(process.cwd(), '.env')
const envContent = readFileSync(envPath, 'utf-8')
const apiKey = envContent.match(/OPENAI_API_KEY=(.+)/)?.[1]?.trim()

async function testOpenAI() {
  console.log('Testing OpenAI integration...')
  console.log('API Key present:', apiKey ? 'YES' : 'NO')
  console.log('API Key length:', apiKey?.length || 0)
  
  if (!apiKey) {
    console.error('❌ No API key found in .env file')
    process.exit(1)
  }

  try {
    const client = new OpenAI({
      apiKey: apiKey,
    })

    console.log('\nTesting chat completion...')
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "OpenAI integration works!" in Dutch.' }
      ],
      max_tokens: 20
    })

    console.log('✅ OpenAI Response:', response.choices[0].message.content)
    console.log('✅ OpenAI integration is working!')
  } catch (error) {
    console.error('❌ OpenAI Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

testOpenAI()
