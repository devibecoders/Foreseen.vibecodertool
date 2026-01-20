/**
 * Feature Key Normalization Rules:
 * - format: `${type}:${value}`
 * - type lowercase
 * - value: lowercase, trimmed, spaces to underscore, alphanumeric/underscore/hyphen only
 */
export function normalizeFeatureKey(type: string, value: string): { key: string, type: string, value: string } {
    const normType = type.toLowerCase().trim()
    const normValue = value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_\-]/g, '')

    return {
        key: `${normType}:${normValue}`,
        type: normType,
        value: normValue
    }
}
