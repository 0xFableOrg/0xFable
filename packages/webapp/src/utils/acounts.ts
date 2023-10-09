/**
 * Utilities to deal with burner accounts.
 *
 * @module utils/accounts
 */

import {
    createPublicClient,
    createWalletClient,
    http,
    getContract,
    concat,
    encodeFunctionData,
} from 'viem'
import { localhost } from 'viem/chains'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import {
    simpleAccountFactoryAbi,
    simpleAccountAbi,
    paymasterAbi
} from 'src/utils/abis'

interface UserOperation {
    sender: `0x${string}`
    nonce: number
    initCode: `0x${string}`
    callData: `0x${string}`
    callGasLimit: number
    verificationGasLimit: number
    preVerificationGas: number
    maxFeePerGas: number
    maxPriorityFeePerGas: number
    paymasterAndData: `0x${string}`
    signature: `0x${string}`
}

const publicClient = createPublicClient({
    chain: localhost,
    transport: http()
})

const paymasterAddress = process.env.PAYMASTER_ADDRESS as `0x${string}`
const paymaster = getContract({
    address: paymasterAddress,
    abi: paymasterAbi,
    publicClient
})

export async function createAccount() {

    // use simple account factory to deploy a new smart account
    // get the address of the smart account
    // create sdk that reads private key from the browser storage and signs transactions

    const privateKey = generatePrivateKey()
    // store this private key in browser storage (is this secure?)
    localStorage.setItem("privateKey", privateKey)

    const account = privateKeyToAccount(privateKey)

    // TODO: change chain
    const walletClient = createWalletClient({
        account,
        chain: localhost,
        transport: http()
    })

    // Generate initcode
    const simpleAccountFactoryAddress = process.env.SIMPLE_ACCOUNT_FACTORY_ADDRESS as `0x${string}`
    const simpleAccountFactory = getContract({
        address: simpleAccountFactoryAddress,
        abi: simpleAccountFactoryAbi,
        publicClient
    })
    const initCode = concat([
        simpleAccountFactoryAddress,
        encodeFunctionData({
            abi: simpleAccountFactoryAbi,
            functionName: 'createAccount',
            args: [account.address, 0]
        }) // set salt as 0
    ])

    // Generate calldata to execute a transaction
    const simpleAccountAddress = await simpleAccountFactory.read.getAddress([account.address, 0]) as `0x${string}`
    const simpleAccount = getContract({
        address: simpleAccountAddress,
        abi: simpleAccountAbi
    })
    const to = '0x' + '00'.repeat(40)
    const value = 0
    const data = "0x68656c6c6f" // "hello" encoded to utf-8 bytes
    const callData =  encodeFunctionData({
        abi: simpleAccountAbi,
        functionName: 'execute',
        args: [to, value, data]
    })

    // Construct UserOp
    let userOp: UserOperation = {
        sender: simpleAccountAddress,
        nonce: Number(await paymaster.read.senderNonce([simpleAccountAddress])),
        initCode: initCode,
        callData: callData,
        callGasLimit: 3_000_000, // hardcode it for now at a high value,
        verificationGasLimit: 3_000_000, // hardcode it for now at a high value,
        preVerificationGas: 2_000_000, // hardcode it for now at a high value,
        maxFeePerGas: 2e9,
        maxPriorityFeePerGas: 1e9,
        paymasterAndData: concat([
            paymasterAddress,
            `0x${'00'.repeat(64)}`,
            `0x${'00'.repeat(65)}`
        ]) as `0x${string}`,
        signature: '0x' + '00'.repeat(65) as `0x${string}`
    }

    // TODO: submit UserOp to bundler endpoint

}