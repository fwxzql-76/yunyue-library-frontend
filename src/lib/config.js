export const apiOrigin = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
export const assetUrl = (path) => (path ? `${apiOrigin}${path}` : '')
