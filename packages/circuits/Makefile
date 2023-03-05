SETUP_FILE=powersOfTau28_hez_final_14.ptau
SNARKJS="./node_modules/.bin/snarkjs"

# For a few commands that return info about circuits.
C ?= Cards

# Makefile Cheat Sheet:
# $@ = target
# $< = first pre-requisite
# $^ = all pre-requisites with space between them
# $* = stem (what is matched by % in the target)

# Circuit Files Cheat Sheet:
# Input-independent:
# - <xxx>.ptau = universal trusted setup (powers of tau) file
# - <circuit>.r1cs = Rank 1 Constraint System constraints for <circuit>
# - <circuit>.wasm = wasm code to generate the witness, for <circuit>
# - <circuit>.sym = symbols file for debugging / printing annotated circuit, for <circuit>
# - <circuit>.zkey = proving key for <circuit> (= everything needed to generate proofs)
# - <circuit>.vkey.json = human-readable json verification key for <circuit> (= everything needed to verify proofs)
# Input-dependent (only needed for testing / debugging):
# - <circuit>.wtns = proof witnesss for <circuit>, and given public inputs
# - <circuit>.public.json = values of the public inputs and outputs, for <circuit>
# - <circuit>.proof.json = the zk proof for <circuit> and the corresponding .public.json file

####################################################################################################
# LIFECYCLE

# Make sure intermediate files are not deleted at the end.
.PRECIOUS: %.r1cs %.wasm %.sym %.zkey %.vkey.json %.wtns

# Build verifier contracts & all other outputsF
build: out/VerifyCards.sol
.PHONY: build

proof: out/Cards.proof.json
.PHONY: proof

# Remove outputs
clean:
	rm -rf out
.PHONY: clean

####################################################################################################
# DEBUG

# Display info & stats about circuit $C
info:
	pnpx snarkjs r1cs info out/$(C).r1cs
.PHONY: info

# Lists constraints for circuit $C
constraints:
	pnpx snarkjs r1cs print out/$(C).r1cs "out/$(C).sym"
.PHONY: constraints

# Generates a readable version of the constraints - for debugging purposes only
out/%.r1cs.json: out/%.r1cs
	pnpx snarkjs r1cs export json $< $@

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
	pnpx snarkjs plonk setup $< trusted_setup/$(SETUP_FILE) $@

# Generates the verifying key
out/%.vkey.json: out/%.zkey
	@echo "## Generating $@"
	pnpx snarkjs zkey export verificationkey $< $@

# Generate the verification contract logic
out/Verify%.sol: out/%.zkey out/%.public.json out/%.proof.json
	@echo "## Generating $@"
	pnpx snarkjs zkey export solidityverifier $< $@
	echo "Solidity call data for testing:"
	pnpx snarkjs zkey export soliditycalldata out/$*.public.json out/$*.proof.json

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
	pnpx snarkjs plonk prove out/$*.zkey out/$*.wtns out/$*.proof.json out/$*.public.json
	pnpx snarkjs plonk verify out/$*.vkey.json out/$*.public.json out/$*.proof.json

####################################################################################################