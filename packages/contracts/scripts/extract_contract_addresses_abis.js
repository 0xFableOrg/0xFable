const fs = require('fs')
const { exec } = require("child_process")

// Usage: takes two arguments `deployment_log_file` and `abi_output_file`

// A file name (deployment.txt) which contains logs from a Foundry, where each line looks like
// `MyContractName address 0x5FbDB2315678afecb367f032d93F642f64180aa3`.
const deployment_log_file = process.argv[2]

// A JSON file name where to put a mapping from contract name to ABI.
const abi_output_file = process.argv[3]

// The program outputs (to stdout) a JSON object with the contract names as keys, and the
// addresses as values. It also stores the mapping from contract name to ABI in
// `abi_output_file` (in JSON, obtained by calling `forge inspect`).

const output = {}
let abis = {}

const lineReader = require('readline').createInterface({
  input: fs.createReadStream(deployment_log_file)
});

lineReader.on('line', line => {
  const [label, _, address] = line.trim().split(" ")
  output[label] = address
  exec(`forge inspect ${label} abi`, (error, stdout, stderr) => {
    if (error) throw error
    abis[label] = JSON.parse(stdout)
  })
})

lineReader.on('close', () => {
  console.log(JSON.stringify(output, null, 4))
})

process.on('beforeExit', () => {
  if (!abis) return
  fs.writeFile(abi_output_file, JSON.stringify(abis), err => { if (err) throw err })
  abis = undefined
})
