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
    WalletClient
} from 'viem'
import axios from 'axios';
import { getPublicClient } from "wagmi/actions"
import { localhost } from 'viem/chains'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import {
    simpleAccountFactoryAbi,
    simpleAccountAbi,
    paymasterAbi,
    entryPointAbi
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

const publicClient = getPublicClient()

// initialize paymaster
const paymasterAddress = process.env.PAYMASTER_ADDRESS as `0x${string}`
const paymaster = getContract({
    address: paymasterAddress,
    abi: paymasterAbi,
    publicClient
})

// initialize simple account factory
const simpleAccountFactoryAddress = process.env.SIMPLE_ACCOUNT_FACTORY_ADDRESS as `0x${string}`
const simpleAccountFactory = getContract({
    address: simpleAccountFactoryAddress,
    abi: simpleAccountFactoryAbi,
    publicClient
})

// initialize entrypoint
const entrypointAddress = process.env.ENTRYPOINT_ADDRESS as `0x${string}`
const entrypoint = getContract({
    address: entrypointAddress,
    abi: entryPointAbi,
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
    const initCode = concat([
        simpleAccountFactoryAddress,
        encodeFunctionData({
            abi: simpleAccountFactoryAbi,
            functionName: 'createAccount',
            args: [account.address, 0]
        }) // set salt as 0
    ])

    // Generate calldata to execute a transaction
    const to = '0x' + '00'.repeat(40) as `0x${string}`
    const value = 0
    const data = "0x68656c6c6f" // "hello" encoded to utf-8 bytes

    // Execute transaction
    await executeTransaction(to, value, data, initCode, walletClient)
}

export async function executeTransaction(
    to: `0x${string}`,
    value: number,
    data: `0x${string}`,
    initCode: `0x${string}`,
    wallet: WalletClient
) {
    const paymasterRpcUrl = process.env.PAYMASTER_RPC_URL as string;
    const bundlerRpcUrl = process.env.BUNDLER_RPC_URL as string;

    const callData =  encodeFunctionData({
        abi: simpleAccountAbi,
        functionName: 'execute',
        args: [to, value, data]
    })

    // Construct UserOp
    const simpleAccountAddress = await simpleAccountFactory.read.getAddress([wallet.account, 0]) as `0x${string}`
    let userOp: UserOperation = {
        sender: simpleAccountAddress,
        nonce: Number(await paymaster.read.senderNonce([simpleAccountAddress])),
        initCode: initCode,
        callData: callData,
        callGasLimit: 3_000_000, // hardcode it for now at a high value,
        verificationGasLimit: 3_000_000, // hardcode it for now at a high value,
        preVerificationGas: 2_000_000, // hardcode it for now at a high value,
        maxFeePerGas: 2_000_000_000, // hardcode it for now at a high value
        maxPriorityFeePerGas: 1_000_000_000, // hardcode it for now at a high value
        paymasterAndData: concat([
            paymasterAddress,
            `0x${'00'.repeat(64)}`,
            `0x${'00'.repeat(65)}`
        ]) as `0x${string}`,
        signature: '0x' + '00'.repeat(65) as `0x${string}`
    }

    // Send UserOp to paymaster RPC server
    const jsonRpcRequest = {
        jsonrpc: '2.0',
        method: 'pm_sponsorUserOperation',
        params: userOp,
        id: 1
    };
    const response = await axios.post(paymasterRpcUrl, jsonRpcRequest, {
        headers: {
          'Content-Type': 'application/json',
        },
    });
    userOp = response.data.result;

    // User to sign UserOp
    const userOpHash = await entrypoint.read.getUserOpHash([userOp]) as `0x${string}`;
    const [account] = await wallet.getAddresses()
    const signature = await wallet.signMessage({
        account,
        message: userOpHash
    });
    userOp = {
        ...userOp,
        signature: signature
    }
    console.log("Finalized userOp: ", userOp);

    // Estimate gas requred
    const gasEstimationRequest = {
        jsonrpc: '2.0',
        method: 'eth_estimateUserOperationGas',
        params: [userOp, entrypointAddress],
        id: 2
    }

    const gasEstimationResult = await axios.post(bundlerRpcUrl, gasEstimationRequest, {
        headers: {
          'Content-Type': 'application/json',
        },
    });
    console.log("Gas estimation result: ", gasEstimationResult.data.result);

    // Send UserOperation
    const userOperationRequest = {
        jsonrpc: '2.0',
        method: 'eth_sendUserOperation',
        params: [userOp, entrypointAddress],
        id: 2
    }
    const userOperationResult = await axios.post(bundlerRpcUrl, userOperationRequest, {
        headers: {
          'Content-Type': 'application/json',
        },
    });
}