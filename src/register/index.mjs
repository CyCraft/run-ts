import { register } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url))

register(pathToFileURL(resolve(__dirname, './loader.mjs')), import.meta.url)
