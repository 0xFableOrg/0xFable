const { build } = require('esbuild')
const dotenv = require('dotenv')
const fs = require('fs')

// Usage:
// - This script must be invoked with the env variable NODE_ENV set to 'prod' or 'dev'.
// - The optional flag '--watch' can be added to automatically rebuild whenever a source file
//   changes.
// - Any environement variable defined in 'prod.env' or 'dev.env' (depending on NODE_ENV) will
//   be copied to the the React runtime's `process.env` object. NODE_ENV will also be included.

const KNOWN_ENVS = ['prod', 'dev']

const node_env = process.env.NODE_ENV
const watch = process.argv.includes('--watch')

if (!KNOWN_ENVS.includes(node_env)) {
    console.log(`NODE_ENV set to ${node_env}`)
    console.log(`must define NODE_ENV to one of: ${KNOWN_ENVS}`)
    process.exit(1)
}

const options = {
  entryPoints: ['./app.jsx'],
  outdir: './www/',
  bundle: true,
  minify: node_env === 'prod',
  watch: watch,
  define: {
    'process.env.NODE_ENV': JSON.stringify(node_env)
  },
}

const env = dotenv.parse(fs.readFileSync(node_env + ".env"))

for (const k in env) {
  options.define[`process.env.${k}`] = JSON.stringify(env[k])
}

build(options).catch(() => process.exit(1))
