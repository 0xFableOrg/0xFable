/**
 * Implementation of a Wagmi connector for a private key held in local browser storage.
 */

import { Connector, ConnectorData, WalletClient } from "wagmi"
import { Address } from "src/chain"
import { PrivateKeyAccount, privateKeyToAccount } from "viem/accounts"
import { createWalletClient, http } from "viem"
import { localhost } from "wagmi/chains"
import { connect, disconnect, getAccount } from "wagmi/actions"
import { AsyncLock } from "src/utils/asyncLock"

// =================================================================================================

type PrivateKey = `0x${string}`

/**
 * The Anvil ("test ... junk" mnemonic) private keys, that can be used in the connector by referring
 * to their index in this array.
 */
const privateKeys: PrivateKey[] = [
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
    "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
    "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
    "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
    "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",
    "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356",
    "0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
    "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6",
]

// =================================================================================================

/**
 * Wagmi connector for a private key held in local browser storage.
 *
 * Right now, we're testing this with a hardcoded Anvil private key.
 */
export class BurnerConnector extends Connector {
    readonly id = "0xFable-burner"
    readonly name = "0xFable Burner Wallet"
    ready = false

    #chain = localhost
    #connected = false
    #connectLock = new AsyncLock()
    #privKey: PrivateKey = undefined as any
    #account: PrivateKeyAccount = undefined as any
    #walletClient: WalletClient = undefined as any

    constructor() {
        super({
            chains: [localhost],
            options: {},
        })
    }

    private setKey(privkey: PrivateKey) {
        this.#privKey = privkey
        this.#account = privateKeyToAccount(this.#privKey)
        this.#walletClient = createWalletClient({
            account: this.#account,
            chain: this.#chain,
            transport: http(),
        })
        this.ready = true
        if (this.#connected) this.onAccountsChanged([this.#account.address])
    }

    async getAccount(): Promise<Address> {
        return this.#account.address
    }

    async getChainId(): Promise<number> {
        return this.#chain.id
    }

    async getProvider(_config: { chainId?: number } | undefined): Promise<any> {
        return undefined
    }

    /**
     * Ensure that this connector is used to connect to one of the Anvil ("test ... junk" mnemonic)
     * private keys, disconnecting from another connector if necessary.
     */
    async ensureConnectedToIndex(keyIndex: number) {
        if (keyIndex < 0 || keyIndex >= privateKeys.length) throw new Error(`Invalid private key index: ${keyIndex}`)

        if (getAccount().address !== this.#account?.address)
            // Necessary because Web3Connect (possibly others) don't play nice with others and don't
            // disconnect before connecting.
            this.#connected = false

        // Pitfall: if you use a wallet to connect to the same account, you might end up being connected
        // via the wallet, as there is no way to detect how we are connected via a specific connector.
        //
        // It's actually possible to fix this by setting up a listener on the address, and disconnecting
        // whenever we encounter a change that was not triggered by this class. But this is a debugging
        // help anyway, let's just assume that you'll disconnect the Anvil account from your wallet.

        if (this.#privKey !== privateKeys[keyIndex]) this.setKey(privateKeys[keyIndex])

        await this.#connectLock.protect(async () => {
            if (!this.#connected) {
                // The next two functions are wagmi actions, not methods of this class!

                // Unconditional disconnect to avoid issues: `getAccount().isConnect == false`
                // but we still get an `AlreadyConnectedException` if we don't disconnect.
                await disconnect()
                await connect({ connector: this })
            }
        })
    }

    async connect(_config: { chainId?: number } | undefined): Promise<Required<ConnectorData>> {
        const data = {
            chain: {
                id: this.#chain.id,
                unsupported: false,
            },
            account: this.#account.address,
        }
        this.emit("connect", data)
        this.#connected = true
        this.onAccountsChanged([this.#account.address])
        return data
    }

    async disconnect(): Promise<void> {
        this.#connected = false
        return
    }

    async getWalletClient(_config: { chainId?: number } | undefined): Promise<WalletClient> {
        return this.#walletClient
    }

    async isAuthorized(): Promise<boolean> {
        return true
    }

    protected onAccountsChanged(_accounts: Address[]): void {
        this.emit("change", { account: this.#account.address })
    }

    protected onChainChanged(_chain: number | string): void {
        this.emit("change", { chain: { id: this.#chain.id, unsupported: false } })
    }

    protected onDisconnect(_error: Error): void {
        this.emit("disconnect")
    }
}

// =================================================================================================
