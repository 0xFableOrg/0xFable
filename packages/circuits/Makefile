####################################################################################################
# VARIABLES

# List of powersOfTau trusted setup files here: https://github.com/iden3/snarkjs/blob/master/README.md
SETUP_FILE=powersOfTau28_hez_final_18.ptau
SNARKJS="./node_modules/.bin/snarkjs"

# For a few commands that return info about circuits.
C ?= Cards

####################################################################################################
# REFERENCE

# For further information on the SnarkJS operations happening in this file, see:
# - https://zkiap.com/snarkjs
# - https://github.com/iden3/snarkjs#readme

# Makefile Cheat Sheet:
# $@ = target
# $< = first pre-requisite
# $^ = all pre-requisites with space between them
# $* = stem (what is matched by % in the target)

# Circuit Files Cheat Sheet:
# Input-independent:
# - <xxx>.ptau = universal trusted setup (powers of tau) file
# - Verify<circuit>.sol = solidity contract to verify proofs for <circuit>
# - <circuit>.r1cs = Rank 1 Constraint System constraints for <circuit>
# - <circuit>.wasm = wasm code to generate the witness, for <circuit>
# - <circuit>.sym = symbols file for debugging / printing annotated circuit, for <circuit>
# - <circuit>.zkey = proving key for <circuit> (= everything needed to generate proofs)
# - <circuit>.vkey.json = human-readable json verification key for <circuit> (= everything needed to verify proofs)
# Input-dependent (only needed for testing / debugging):
# - <circuit>.wtns = proof witnesss for <circuit>, and given public inputs
# - <circuit>.public.json = values of the public inputs and outputs, for <circuit>
# - <circuit>.proof.json = the zk proof for <circuit> and the corresponding .public.json file
# - <circuit>.calldata.txt = solidity calldata for testing purposes

####################################################################################################
# TESTING SETUP

UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Darwin)
	# NOTE: This does NOT work.
	# It does not know `uint` and I haven't managed to inject a typedef / macro definition for it.
	# Probably fixing the issue upstream or forking circom-helper is the right fix (assuming it's
	# the only issue).
	JSON_INCLUDE=$(shell brew --prefix nlohmann-json)/include
	GMP_INCLUDE=$(shell brew --prefix gmp)/include
	export CPLUS_INCLUDE_PATH += :$(JSON_INCLUDE):$(GMP_INCLUDE)
	TEST_INSTALL_COMMAND:=brew install gcc gmp nlohmann-json nasm && xcode-select --install
	export CPPFLAGS += -include build/uint.hpp
else
	TEST_INSTALL_COMMAND:=sudo apt-get install libgmp-dev nlohmann-json3-dev nasm g++
endif

install-test-deps:
	$(TEST_INSTALL_COMMAND)
.PHONY: install-test-deps

####################################################################################################
# LIFECYCLE

# Make sure intermediate files are not deleted at the end.
.PRECIOUS: out/%.r1cs out/%.wasm out/%.sym out/%.zkey out/%.vkey.json out/%.wtns out/%.public.json \
	out/%.proof.json trusted_setup/%.ptau

# Use dummy circuit to test that everything is working properly.
build-test: out/VerifyCards.sol out/Cards.proof.json
.PHONY: build-test

# Build verifier contracts & all other outputs.
build: out/VerifyDraw6.sol out/VerifyInitial67.sol out/VerifyPlay4.sol
.PHONY: build

test-server:
	node circom.config.js > out/circom.config.json
	pnpm circom-helper -c out/circom.config.json -b ./build/test -p 9001
.PHONY: test-server

make test:
	echo "Running tests (requires running make test-server beforehand)"
	pnpm jest
.PHONY: test

# Remove outputs
clean:
	rm -rf out
.PHONY: clean

####################################################################################################
# DEBUG

# Display info & stats about circuit $C
info:
	pnpm snarkjs r1cs info out/$(C).r1cs
.PHONY: info

# Lists constraints for circuit $C
constraints:
	pnpm snarkjs r1cs print out/$(C).r1cs "out/$(C).sym"
.PHONY: constraints

# Generates a readable version of the constraints - for debugging purposes only
out/%.r1cs.json: out/%.r1cs
	pnpm snarkjs r1cs export json $< $@

####################################################################################################
# COMPILATION / OFFLINE (input-independent)

# Fetches the powers of tau trusted setup results
trusted_setup/%.ptau:
	@echo "## Fetching powers of tau"
	@mkdir -p trusted_setup
	@if [ ! -e "$@" ]; then \
		curl https://hermez.s3-eu-west-1.amazonaws.com/$*.ptau > $@; \
	fi
.PHONY: download_setup

# Compiles a circuit
out/%.r1cs out/%.wasm out/%.sym: src/%.circom
	@echo "## Compiling $<"
	@mkdir -p out
	circom $< --r1cs --wasm --sym -o out

# Generates the proving key
out/%.zkey: out/%.r1cs trusted_setup/$(SETUP_FILE)
	@echo "## Generating $@"
	pnpm snarkjs plonk setup $< trusted_setup/$(SETUP_FILE) $@

# Generates the verifying key
out/%.vkey.json: out/%.zkey
	@echo "## Generating $@"
	pnpm snarkjs zkey export verificationkey $< $@

# Generate the verification contract logic
out/Verify%.sol: out/%.zkey
	@echo "## Generating $@"
	pnpm snarkjs zkey export solidityverifier $< $@

# Generate solidity calldata for testing purposes
out/%.calldata.txt: out/%.public.json out/%.proof.json
	echo "Solidity call data for testing:"
	pnpm snarkjs zkey export soliditycalldata $^ > $@

####################################################################################################
# INPUT-DEPENDANT (for verification / debugging)

# Generates the witnesses for a specific set of public inputs.
#
# This does not depend on the r1cs file, but on the wasm file created at the same time.
# However, the wasm file lives in "out/%_js/%.wasm" which you can't express in Make.
out/%.wtns: out/%.r1cs
	@echo "## Generating $@"
	echo '{"a": 3, "b": 11}' > input.json
	node out/$*_js/generate_witness.js out/$*_js/$*.wasm input.json $@

# Generate proof & public signal files
out/%.proof.json out/%.public.json: out/%.zkey out/%.wtns out/%.vkey.json
	@echo "## Generating $* proof"
	pnpm snarkjs plonk prove out/$*.zkey out/$*.wtns out/$*.proof.json out/$*.public.json
	pnpm snarkjs plonk verify out/$*.vkey.json out/$*.public.json out/$*.proof.json

####################################################################################################