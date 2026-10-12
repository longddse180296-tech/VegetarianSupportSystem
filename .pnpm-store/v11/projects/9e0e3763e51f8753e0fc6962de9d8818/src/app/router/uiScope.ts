// Apply FE1 presentation rules only to the routes owned by FE1.
export function isFe1Route(path: string): boolean {
  const pathname = '/' + path.split('?')[0].replace(/^\/+/, '')
  if (pathname === '/profile/my-videos' || pathname === '/my-videos') return false
  return /^\/(admin|auth|profile|account|articles|meal-plans|login|register|forgot-password|reset-password|my-articles|my-comments)(\/|$)/.test(pathname)
}
