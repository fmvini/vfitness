import { isPreviewMode } from '../preview/previewMode.js'

// Keep navigation in the same data environment, including query strings.
export function routePath(path) {
    if (!isPreviewMode() || path === '/preview' || path.startsWith('/preview/')) {
        return path
    }
    return path === '/' ? '/preview' : `/preview${path}`
}
