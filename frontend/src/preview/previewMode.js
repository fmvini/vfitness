export function isPreviewMode() {
    const pathname = globalThis.window?.location?.pathname || ''
    return pathname === '/preview' || pathname.startsWith('/preview/')
}
