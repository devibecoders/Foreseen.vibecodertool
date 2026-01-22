/**
 * Concept Dictionary for Signal Extraction
 * 
 * Curated keyword mappings for deterministic concept detection.
 * Each concept maps to an array of keywords/synonyms that trigger it.
 */

export const CONCEPT_DICTIONARY: Record<string, string[]> = {
    // Toxic concepts (used for guilt-by-association protection)
    nsfw: ['nsfw', 'nude', 'nudity', 'porn', 'pornographic', 'sexual', 'adult content', 'explicit', 'xxx'],
    undress: ['undress', 'strip', 'remove clothes', 'naked', 'unclothed', 'clothes off', 'disrobe'],
    celebrity_deepfake: ['celebrity deepfake', 'celebrity fake', 'fake celebrity'],
    gossip: ['gossip', 'rumor', 'scandal', 'tabloid', 'drama'],

    // Security concepts
    deepfake: ['deepfake', 'deep fake', 'face swap', 'synthetic video', 'face-swap', 'synthetic media'],
    malware: ['malware', 'trojan', 'ransomware', 'virus', 'worm', 'backdoor', 'spyware', 'keylogger'],
    prompt_injection: ['prompt injection', 'jailbreak', 'jailbreaking', 'system prompt leak', 'prompt leak', 'prompt attack'],
    data_breach: ['data breach', 'data leak', 'leaked data', 'hack', 'hacked', 'compromised'],

    // Privacy concepts
    privacy: ['privacy', 'gdpr', 'data protection', 'tracking', 'surveillance', 'pii', 'personal data'],
    biometric: ['biometric', 'face recognition', 'facial recognition', 'fingerprint', 'voice recognition'],

    // Technical concepts
    agents: ['agents', 'autonomous', 'multi-agent', 'agentic', 'orchestration', 'agent framework'],
    rls: ['rls', 'row level security', 'row-level security', 'row level policies'],
    rag: ['rag', 'retrieval augmented', 'retrieval-augmented', 'vector search', 'embeddings'],
    fine_tuning: ['fine-tuning', 'fine tuning', 'finetuning', 'lora', 'qlora', 'peft'],
    context_window: ['context window', 'context length', 'token limit', 'long context'],
    multimodal: ['multimodal', 'multi-modal', 'vision', 'image understanding', 'audio understanding'],

    // Business concepts
    pricing: ['pricing', 'cost', 'subscription', 'freemium', 'pay-per-use', 'token cost', 'api pricing'],
    open_source: ['open source', 'opensource', 'foss', 'mit license', 'apache license', 'open-source', 'open weights'],
    enterprise: ['enterprise', 'b2b', 'business', 'corporate', 'saas'],
    startup: ['startup', 'funding', 'seed round', 'series a', 'vc', 'venture capital'],

    // Regulation concepts
    regulation: ['regulation', 'compliance', 'eu ai act', 'ai act', 'legislation', 'policy'],
    copyright: ['copyright', 'intellectual property', 'ip', 'fair use', 'training data rights'],
}

/**
 * Toxic concepts that trigger guilt-by-association protection.
 * When present, category/entity weights are reduced to prevent unfair penalties.
 */
export const TOXIC_CONCEPTS = new Set([
    'concept:nsfw',
    'concept:undress',
    'concept:porn',
    'concept:celebrity_deepfake',
    'concept:gossip',
])

/**
 * Known AI entities for entity extraction
 */
export const KNOWN_ENTITIES: Record<string, string[]> = {
    // Companies
    openai: ['openai', 'open ai'],
    anthropic: ['anthropic', 'claude'],
    google: ['google', 'deepmind', 'google ai'],
    meta: ['meta', 'facebook ai', 'llama'],
    microsoft: ['microsoft', 'msft'],
    xai: ['xai', 'x.ai', 'grok'],
    mistral: ['mistral', 'mistral ai'],
    cohere: ['cohere'],
    stability: ['stability ai', 'stable diffusion'],
    amazon: ['amazon', 'aws', 'bedrock'],
    nvidia: ['nvidia', 'nvda'],
    huggingface: ['huggingface', 'hugging face', '🤗'],

    // Specific products/models treated as entities
    grok: ['grok'],
    gemini: ['gemini', 'bard'],
    gpt: ['gpt-4', 'gpt-5', 'chatgpt', 'gpt4', 'gpt5'],
    claude: ['claude', 'claude 3', 'claude 4'],
    llama: ['llama', 'llama 2', 'llama 3', 'llama2', 'llama3'],
    perplexity: ['perplexity'],
}

/**
 * Known developer tools for tool extraction
 */
export const KNOWN_TOOLS: Record<string, string[]> = {
    supabase: ['supabase'],
    vercel: ['vercel', 'v0'],
    cursor: ['cursor', 'cursor ai'],
    windsurf: ['windsurf', 'codeium'],
    github_copilot: ['github copilot', 'copilot', 'gh copilot'],
    replit: ['replit', 'repl.it'],
    bolt: ['bolt.new', 'bolt ai'],
    lovable: ['lovable', 'lovable.dev'],
    langchain: ['langchain', 'langgraph'],
    llamaindex: ['llamaindex', 'llama index'],
    autogen: ['autogen', 'auto-gen'],
    crewai: ['crewai', 'crew ai'],
    dify: ['dify'],
    flowise: ['flowise'],
    n8n: ['n8n'],
    make: ['make.com', 'integromat'],
    zapier: ['zapier'],
}

/**
 * Check if a concept is toxic
 */
export function isToxicConcept(conceptKey: string): boolean {
    return TOXIC_CONCEPTS.has(conceptKey)
}
