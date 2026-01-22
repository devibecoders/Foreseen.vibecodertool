import { extractSignals } from '../lib/signals/extractSignals'

const testArticle = {
    title: "Grok AI can undress people in generated images",
    summary: "New report shows xAI's Grok model allows users to remove clothes.",
    categories: "Security, Generative AI",
    content: "security researchers found that grok refuses some prompts but allows others that lead to nsfw content generation..."
}

const signals = extractSignals(testArticle)

console.log("=== EXTRACTION TEST ===")
console.log("Categories:", signals.categories)
console.log("Entities:", signals.entities)
console.log("Tools:", signals.tools)
console.log("Concepts:", signals.concepts)
console.log("Contexts:", signals.contexts)
console.log("All Keys:", signals.allKeys)
console.log("Total signals:", signals.allKeys.length)
