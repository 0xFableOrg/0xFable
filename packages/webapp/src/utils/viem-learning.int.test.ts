/*
* Requires running rpc
*/

import { describe, beforeAll, it, jest, expect } from '@jest/globals';

// do not import generated as to avoid wagmi dependency for now until we setup jest transform
import { gameABI } from "./generated-abi"
import { privateKeyToAccount } from 'viem/accounts';
import * as deployment_ from "../../../contracts/out/deployment.json"
import { sendRawTransaction } from 'viem/actions';
import {  Address,createTestClient, encodeFunctionData, http, publicActions, walletActions } from 'viem'

import { localhost } from 'viem/chains'

const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

const account = privateKeyToAccount(TEST_PRIVATE_KEY) 


const client = createTestClient({
    chain: localhost,
    mode: 'anvil',
    transport: http(), 
  })
    .extend(publicActions) 
    .extend(walletActions) 

jest.setTimeout(1000000)
describe("viem", () => {

    let gameIds: bigint[] = [];

    const createGame = async ()=>{
        
        console.log('create game')
        const createGameData = encodeFunctionData({
            abi: gameABI,
            functionName: 'createGame',
            args: [2],
        });

        const result = await client.sendTransaction({
            to: deployment_.Game as Address,
            data: createGameData,
            account,
        });

        const receipt = await client.waitForTransactionReceipt({hash: result})
        console.log(receipt)


        gameIds.push(BigInt(receipt.logs[0].data));

    }
    const joinGame = async (gameId: bigint)=>{
        console.log('join game', gameId)
        const joinGameData = encodeFunctionData({
            abi: gameABI,
            functionName: 'joinGame',
            args: [gameId, 0, 1n, '0x00'],
        });

        const result = await client.sendTransaction({
            to: deployment_.Game as Address,
            data: joinGameData,
            account,
        });

        const receipt = await client.waitForTransactionReceipt({hash: result})
        console.log('join game completed')
        console.log(receipt)
    }
    
   
    beforeAll(async () => {
        await createGame()
        await createGame()
    });

    it("Should listen to event",  (done) => {

        const eventNames = [
   
            "PlayerJoined",

          ]

        const eventsABI = gameABI.filter((abi) => abi.type === "event" && eventNames.includes(abi.name));
    
        const onLogs = jest.fn().mockImplementation((logs)=>{
            console.log('logs')
            console.log(logs)
        })
    

        console.log('watch')

        client.watchEvent({
            address: deployment_.Game as Address,
            events: eventsABI,
            // @ts-ignore
            args: { gameID: gameIds[0] },
            strict: true,
            onLogs
        })

        setTimeout(async ()=>{
  
            await joinGame(gameIds[0])
            await joinGame(gameIds[1])

        }, 3000)

         
        setTimeout(()=>{
            console.log('done')
            expect(onLogs).toHaveBeenCalledTimes(2)
            expect(onLogs).toHaveBeenCalledWith(1)
            done()
        }, 20000)
      })
      
})