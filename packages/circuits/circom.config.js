const circom_path = require('child_process').execSync('which circom', {encoding: 'utf8'} ).trim()
const circom_path_rel = require('path').relative(process.cwd() + '/out', circom_path)
const config = {
    "circom": circom_path_rel,
    "snarkjs": "../node_modules/snarkjs/build/cli.cjs",
    "circuitDirs": [
        "../test/circuits"
    ]
}
console.log(JSON.stringify(config))