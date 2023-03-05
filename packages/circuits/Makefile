SETUP_FILE=powersOfTau28_hez_final_14.ptau
SNARKJS="./node_modules/.bin/snarkjs"

# Makefile Cheat Sheet:
# $@ = target
# $< = first pre-requisite
# $^ = all pre-requisites with space between them
# $* = stem (what is matched by % in the target)

# Circuit Files Cheat Sheet:
# - <xxx>.ptau = universal trusted setup (powers of tau) file
# - <circuit>.r1cs = Rank 1 Constraint System constraints for <circuit>
# - <circuit>.wasm = wasm code to generate the witness, for <circuit>
# - <circuit>.sym = symbols file for debugging / printing annotated circuit, for <circuit>
# - <circuit>.wtns = proof witnesss for <circuit>, and given public inputs
# - <circuit>.zkey = proving key for <circuit>, and
# - <circuit>.vkey.json = human-readable json verification key for <circuit>
# - <circuit>.public.json = values of the public inputs and outputs, for <circuit>
# - <circuit>.proof.json = the zk proof for <circuit> and the corresponding .public.json file

# TODO: What exactly are the proving and verification key?

trusted_setup/%.ptau:
	@mkdir -p trusted_setup
	@if [ ! -e "$@" ]; then \
		curl https://hermez.s3-eu-west-1.amazonaws.com/$*.ptau > $@; \
	fi
.PHONY: download_setup

out/%.r1cs out/%.wasm out/%.sym: src/%.circom
	mkdir -p out
	circom $< --r1cs --wasm --sym -o out

out/%.r1cs.json: out/%.r1cs
	pnpx snarkjs r1cs export json $< $@

info:
	@for filename in out/*.r1cs; do \
		pnpx snarkjs r1cs info "$$filename"; \
	done
.PHONY: info

constraints:
	@for filename in out/*.r1cs; do \
  		pnpx snarkjs r1cs print "$$filename" "out/$$(basename $$filename .r1cs).sym"; \
	done
.PHONY: constraints

clean:
	rm -rf out
.PHONY: clean

# This does not depend on the r1cs file, but on the wasm file created at the same time.
# However, the wasm file lives in "out/%_js/%.wasm" which you can't express in Make.
out/%.wtns: out/%.r1cs
	echo '{"a": 3, "b": 11}' > input.json
	node out/$*_js/generate_witness.js out/$*_js/$*.wasm input.json $@

out/%.zkey: out/%.r1cs trusted_setup/$(SETUP_FILE)
	pnpx snarkjs plonk setup $< trusted_setup/$(SETUP_FILE) $@
	pnpx snarkjs zkey verify $< trusted_setup/$(SETUP_FILE) $@

out/%.vkey.json: out/%.zkey
	pnpx snarkjs zkey export verificationkey $< $@

out/%.proof.json out/%.public.json: out/%.zkey out/%.wtns out/%.vkey.json
	pnpx snarkjs plonk prove out/$*.zkey out/$*.wtns out/$*.proof.json out/$*.public.json
	pnpx snarkjs plonk verify out/$*.vkey.json out/$*.public.json out/$*.proof.json