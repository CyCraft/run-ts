import { transformSync } from 'esbuild'
import { existsSync } from 'node:fs'
import { URL, fileURLToPath, pathToFileURL } from 'node:url'

const EXT_REGEX = /\.(ts|tsx|mts|cts)$/
const SUFFIXES = [
  [/(?:\.[tj]s)?$/, '.js'],
  [/(?:\.[tj]s)?$/, '.ts'],
  [/(?:[\\/]?(?:index(?:\.[tj]s)?))?$/, '/index.js'],
  [/(?:[\\/]?(?:index(?:\.[tj]s)?))?$/, '/index.ts'],
]

/**
 * The load function will take any ts files and run it through esbuild and output a module which we then output
 */
export async function load(url, context, defaultLoad) {
  if (EXT_REGEX.test(url)) {
    const { source } = await defaultLoad(url, { format: 'module' })
    const { code } = transformSync(source, {
      format: 'esm',
      loader: 'ts',
    })
    return {
      format: 'module',
      source: code,
    }
  }

  if (url.endsWith('.css')) {
    return {
      format: 'module',
      source: `export default '';`, // Handle .css files as empty modules
      shortCircuit: true,
    }
  }

  return defaultLoad(url, context, defaultLoad)
}

/** Cache urls so we don't have to check the same urls repeatedly, although I believe node does this
 * automatically. In the future we can preemptively add `index.js` etc. when we match other variants
 */
const resolvedPaths = new Map()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function resolveURL(pathUrl, parentUrl, specifier) {
  if (resolvedPaths.has(pathUrl)) {
    return resolvedPaths.get(pathUrl)
  }
  const path = fileURLToPath(pathUrl)
  for (const [reggie, suffix] of SUFFIXES) {
    const file = path.replace(reggie, suffix)
    if (existsSync(file)) {
      const newUrl = pathToFileURL(file).href
      resolvedPaths.set(pathUrl, newUrl)
      return newUrl
    }
  }
}

/**
 * Resolve is called whenever an `import` is used to evaluate the url
 * @param {Parameters<import('node:module').ResolveHook>[0]} specifier
 * @param {Parameters<import('node:module').ResolveHook>[1]} context
 * @param {Parameters<import('node:module').ResolveHook>[2]} nextResolve
 * @returns {import('node:module').ResolveFnOutput}
 */
export async function resolve(specifier, context, nextResolve) {
  const { parentURL = null } = context

  // Basic check to see if it's a relative file
  if (specifier.startsWith('.')) {
    const pathUrl = new URL(specifier, parentURL).href
    const resolvedUrl = resolveURL(pathUrl, parentURL, specifier)
    if (resolvedUrl)
      return nextResolve(resolvedUrl, {
        ...context,
      })
  }
  return nextResolve(specifier)
}
