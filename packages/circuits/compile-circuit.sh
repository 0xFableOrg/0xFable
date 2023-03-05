#!/bin/sh

####################################################################################################
# LOGGING

# Stop if a command fails
set -e

Color_Off='\033[0m'
Red='\033[0;31m'
Purple='\033[0;35m'
log() {
	echo "${Purple}[CIRCUIT-COMPILER:INFO]${Color_Off} $1"
}
error() {
	echo "${Red}[CIRCUIT-COMPILER:ERROR]${Color_Off} $1"
}

####################################################################################################
# PATHS

# Path to snarkjs binary
SNARKJS="$(readlink -f "./node_modules/.bin/snarkjs")"

# Circuit is first argument
CIRCUIT="$1"
CIRCUIT_NAME=$(basename "$1" .circom)

OUT=out/"$CIRCUIT_NAME"
mkdir -p "$OUT"

####################################################################################################

#compile the circuit to generate the r1cs and wasm versions
compile_circuit() {
	NLEVELS=$1
	mkdir -p $ARTIFACTS/$ENVIRONMENT/$NLEVELS
	log "creating circuit to compile based on the provided one by the user"

	CIRCUITCODE="pragma circom 2.0.0;
include \"$CIRCUIT\";
component main {public [processId, censusRoot, nullifier, voteHash, weight]} = Census($NLEVELS);"
	echo "$CIRCUITCODE" > $TRASH/circuit.circom

	# compilling the circuit
	$CIRCOM $TRASH/circuit.circom --r1cs --wasm --sym -o $ARTIFACTS/$ENVIRONMENT/$NLEVELS
	# print circuit info
	$SNARKJS r1cs info $ARTIFACTS/$ENVIRONMENT/$NLEVELS/circuit.r1cs
	# move it to the correct folder
	mv $ARTIFACTS/$ENVIRONMENT/$NLEVELS/circuit_js/* $ARTIFACTS/$ENVIRONMENT/$NLEVELS
}


