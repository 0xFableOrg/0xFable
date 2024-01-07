/**
 * Utilities to deal with burner accounts.
 *
 * @module utils/accounts
 */

import { http, parseEther} from 'viem'
import { localhost } from 'viem/chains'
import { getPublicClient } from "wagmi/actions"
import { generatePrivateKey } from 'viem/accounts'
import { createBundlerClient, createSmartAccountClient } from 'permissionless'
import { privateKeyToSimpleSmartAccount } from 'permissionless/accounts'

const publicClient = getPublicClient()

// TODO: we need to initialize paymaster contract?

export async function createAccount() {

    // generate an in browser private key
    const privateKey = generatePrivateKey()

    // TODO: store this private key in atom

    // create a simple account where the private key is the signer
    const simpleAccount = await privateKeyToSimpleSmartAccount(publicClient, {
        privateKey: privateKey,
        factoryAddress: "0x9406Cc6185a346906296840746125a0E44976454",
        entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", // global entrypoint
    });
    console.log("Simple account: ", simpleAccount)

    // create a smart account client (equivalent to a walletClient)
    const smartAccountClient = createSmartAccountClient({
        account: simpleAccount,
        chain: localhost,
        transport: http(
            "http://localhost:4337",
        ),
        // sponsorUserOperation: paymasterClient.sponsorUserOperation, // optional
    });
    console.log("Smart account client: ", smartAccountClient);

    // Generalize sending transaction

    // const txHash = await smartAccountClient.sendTransaction({
    //     to: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
    //     value: parseEther("0.1"),
    // });
    // console.log("Transaction hash: ", txHash);
}