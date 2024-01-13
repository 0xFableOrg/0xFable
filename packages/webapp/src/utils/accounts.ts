/**
 * Utilities to deal with burner accounts.
 *
 * @module utils/accounts
 */

import axios from 'axios'
import { Address, http, parseEther, defineChain, toHex, concat } from 'viem'
import { localhost } from 'viem/chains'
import { getPublicClient } from "wagmi/actions"
import { generatePrivateKey } from 'viem/accounts'
import { createSmartAccountClient, UserOperation } from 'permissionless'
import { privateKeyToSimpleSmartAccount } from 'permissionless/accounts'

const publicClient = getPublicClient()

export async function createAccount() {

    const rollop = defineChain({
        ...localhost,
        id: 1201101712,
        name: 'Rollop',
        nativeCurrency: {
          decimals: 18,
          name: 'Ether',
          symbol: 'ETH',
        },
    });

    // generate an in browser private key
    const privateKey = generatePrivateKey()
    // TODO: store this private key in atom

    // create a simple account where the private key is the signer
    const simpleAccount = await privateKeyToSimpleSmartAccount(publicClient, {
        privateKey: privateKey,
        factoryAddress: "0x9406Cc6185a346906296840746125a0E44976454",
        entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", // global entrypoint
    });

    // create a smart account client (equivalent to a walletClient)
    const smartAccountClient = createSmartAccountClient({
        chain: rollop,
        account: simpleAccount,
        transport: http("http://localhost:4337"),
        sponsorUserOperation: async (args: { userOperation: UserOperation, entryPoint: Address }) => {
            // console.log("Breakpoint1")
            const userOp = {
                sender: args.userOperation.sender,
                nonce: toHex(args.userOperation.nonce),
                initCode: args.userOperation.initCode,
                callData: args.userOperation.callData,
                paymasterAndData: concat([
                    '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
                    '0x' + '00'.repeat(64) as `0x${string}`,
                    '0x' + '00'.repeat(65) as `0x${string}`
                ]),
                signature: args.userOperation.signature,
                maxFeePerGas: toHex(2_000_000_000),
                maxPriorityFeePerGas: toHex(1_000_000_000),
                callGasLimit: toHex(3_000_000),
                verificationGasLimit: toHex(3_000_000),
                preVerificationGas: toHex(2_000_000)
            }
            const jsonRpcRequest = {
                jsonrpc: '2.0',
                method: 'pm_sponsorUserOperation',
                params: userOp,
                id: 1
            };
            const response = await axios.post("http://localhost:3000", jsonRpcRequest, {
                headers: {
                  'Content-Type': 'application/json',
                },
            });
            return response.data.result;
        }
    });

    // to send a transaction, it will be similar to using walletClient, example below
    /**
    const txHash3 = await smartAccountClient.sendTransaction({
        to: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
        value: BigInt(0),
        data: "0x68656c6c6f"
    });
    */
}