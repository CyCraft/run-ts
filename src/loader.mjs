import { transformSync } from 'esbuild'
import { access } from 'node:fs'
import {readFile} from 'node:fs/promises'
import { URL, fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import ts from 'typescript'
const EXT_REGEX = /\.(ts|tsx|mts|cts)$/
const SUFFIXES = [
  [/(?:\.[tj]s)?$/, '.js'],
  [/(?:\.[tj]s)?$/, '.ts'],
  [/(?:[\/]?(?:index(?:\.[tj]s)?))?$/, '/index.js'],
  [/(?:[\/]?(?:index(?:\.[tj]s)?))?$/, '/index.ts'],
]


const fileExists = (filePath) =>
  new Promise((resolve) => {
    access(filePath, (err) => resolve(!err))
  })


/**
 * The load function will take any ts files and run it through esbuild and output a module which we then output
 */
export async function load(url, context, defaultLoad) {
  if (EXT_REGEX.test(url)) {
    const { source } = await defaultLoad(url, { format: 'module' })
    /**
     * @type {import('esbuild').SameShape<import('esbuild').TransformOptions, import('esbuild').TransformOptions>}
     */
    const transformOptions = {
      format: 'esm',
      loader: 'ts',
    }

    const tsconfigContents = ts.getParsedCommandLineOfConfigFile('tsconfig.json', {}, ts.sys)
    if (tsconfigContents) {
      if (tsconfigContents.options.target) transformOptions.target = ts.ScriptTarget[tsconfigContents.options.target]
    }

    const { code } = transformSync(source, transformOptions)
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

async function resolveURL(pathUrl, parentUrl, specifier) {
  if (resolvedPaths.has(pathUrl)) {
    return resolvedPaths.get(pathUrl)
  }
  const path = fileURLToPath(pathUrl)
  for (const [reggie, suffix] of SUFFIXES) {
    const file = path.replace(reggie, suffix)
    if (await fileExists(file)) {
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
 * @returns {Promise<import('node:module').ResolveFnOutput>}
 */
export async function resolve(specifier, context, nextResolve) {
  const { parentURL = null } = context
  // Basic check to see if it's a relative file
  if (specifier.startsWith('.')) {
    const pathUrl = new URL(specifier, parentURL ?? '').href
    const resolvedUrl = await resolveURL(pathUrl, parentURL, specifier)
    if (resolvedUrl)
      return nextResolve(resolvedUrl, {
        ...context,
      })
  }
  return nextResolve(specifier)
}
