import { describe, expect, it } from 'vitest'
import indexHtml from '../../index.html?raw'
import nginxConf from '../../nginx.conf?raw'
import vercelJson from '../../vercel.json?raw'

// La CSP permite el script en línea del tema por su hash. Si alguien cambia
// ese script sin recalcularlo, el navegador lo bloquearía en producción y el
// tema parpadearía al cargar: estos tests lo detectan antes.
async function sha256Base64(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
}

function vercelCsp(): string {
  const config = JSON.parse(vercelJson) as { routes: { headers?: Record<string, string> }[] }
  const csp = config.routes.find((route) => route.headers?.['Content-Security-Policy'])
  return csp!.headers!['Content-Security-Policy']
}

describe('Content-Security-Policy', () => {
  it('allows exactly the inline theme script of index.html', async () => {
    const scripts = [...indexHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1])
    expect(scripts).toHaveLength(1)

    expect(vercelCsp()).toContain(`'sha256-${await sha256Base64(scripts[0])}'`)
  })

  it('is the same in Vercel and in the Docker nginx', () => {
    expect(nginxConf).toContain(`add_header Content-Security-Policy "${vercelCsp()}" always;`)
  })
})
