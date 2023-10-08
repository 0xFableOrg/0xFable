/**
 * Utilities to deal with burner accounts.
 *
 * @module utils/accounts
 */

import {
    createWalletClient,
    http,
    getContract,
    concat,
    encodeFunctionData,
    toHex
} from 'viem'
import { mainnet } from 'viem/chains'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { simpleAccountFactoryAbi, simpleAccountAbi } from 'src/utils/abis.ts'

interface UserOperation {
    sender: string
    nonce: BigNumberish
    initCode: BytesLike
    callData: BytesLike
    callGasLimit: BigNumberish
    verificationGasLimit: BigNumberish
    preVerificationGas: BigNumberish
    maxFeePerGas: BigNumberish
    maxPriorityFeePerGas: BigNumberish
    paymasterAndData: BytesLike
    signature: BytesLike
}

const paymasterAddress = process.env.PAYMASTER_ADDRESS as `0x${string}`
const paymaster = getContract({
    address: paymasterAddress,
    abi: paymasterAbi
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
    const client = createWalletClient({
        account,
        chain: mainnet,
        transport: http()
    })

    // Generate initcode
    const simpleAccountFactoryAddress = process.env.SIMPLE_ACCOUNT_FACTORY_ADDRESS as `0x${string}`
    const simpleAccountFactory = getContract({
        address: simpleAccountFactoryAddress,
        abi: simpleAccountFactoryAbi
    })
    const initCode = concat([
        simpleAccountFactoryAddress,
        encodeFunctionData({
            simpleAccountFactoryAbi,
            functionName: 'createAccount',
            args: [account.address, 0]
        }) // set salt as 0
    ])

    // Generate calldata to execute a transaction
    const simpleAccountAddress = await simpleAccountFactory.read.getAddress(account.address, 0)
    const simpleAccount = getContract({
        address: simpleAccountAddress,
        abi: simpleAccountAbi
    })
    const to = '0x' + '00'.repeat(40)
    const value = 0
    const data = "0x68656c6c6f" // "hello" encoded to utf-8 bytes
    const callData =  encodeFunctionData({
        simpleAccountAbi,
        functionName: 'execute',
        args: [to, value, data]
    })

    // Construct UserOp
    let userOp: UserOperation = {
        sender: simpleAccountAddress,
        nonce: Number(await paymaster.read.senderNonce(simpleAccountAddress)),
        initCode: initCode,
        callData: callData,
        callGasLimit: toHex(3_000_000), // hardcode it for now at a high value,
        verificationGasLimit: toHex(3_000_000), // hardcode it for now at a high value,
        preVerificationGas: toHex(2_000_000), // hardcode it for now at a high value,
        maxFeePerGas: toHex(2e9),
        maxPriorityFeePerGas: toHex(1e9),
        paymasterAndData: concat([
            paymasterAddress,
            '0x' + '00'.repeat(64),
            '0x' + '00'.repeat(65)
        ]),
        signature: '0x' + '00'.repeat(65)
    }

    // TODO: submit UserOp to bundler endpoint

}