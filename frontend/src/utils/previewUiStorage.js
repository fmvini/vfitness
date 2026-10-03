// Session progress and today's selection share the adapter's in-memory lifetime.
// Never write these values to the authenticated application's localStorage.
const values = new Map()

export const previewUiStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
}

export function resetPreviewUi() {
    values.clear()
}
