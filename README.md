# Gelato Limit Order SDK

Place limit buy and sell orders on Uniswap v2 using Gelato Network.

## Mainnet & Ropsten Demo

<a href="https://www.sorbet.finance/order" target="_blank">
     <img src="https://i.imgur.com/66yH4SO.png"
          alt="Gelato Limit orders"
          style="width: 640px;" 
     />
</a>

## Installation

`yarn add @gelatonetwork/limit-orders-lib`

or

`npm install @gelatonetwork/limit-orders-lib`

## Getting Started (using ethers.js, but also works with web3.js)

1. Create the limit order payload

```
import { getLimitOrderPayload } from '@gelatonetwork/limit-orders-lib'

// Supported networks: Mainnet = 1; Ropsten = 3
const chainId = 1

// Token to sell
const inToken = "0x6b175474e89094c44da98b954eedeac495271d0f"; // DAI

// Token to buy
const outToken = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"; // ETH

// Amount to sell
const inputAmount = ethers.utils.parseUnits("2000", "18");

// Minimum amount of outTOken which the users wants to receive back
const minimumReturn = ethers.utils.parseEther("1", "18");

// Address of user who places the order (must be same as signer address)
const userAddress = "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B"

// If 1 ETH is above 2000 DAI, then the user will buy 1 ETH if it is less than 2000 DAI
// If 1 ETH is below 2000 DAI, then the user will buy 1 ETH if it is greater than 2000 DAI
const txData = await getLimitOrderPayload(
    chainId,
    inToken,
    outToken,
    inputAmount,
    minimumReturn,
    userAddress
);
```

2. Place the order by sending the transaction

```
// Use Front End web3 provider library of your choice
import Web3Modal from "web3modal";
import { useWeb3React } from '@web3-react/core'

// If using Web3Modal
const web3Modal = new Web3Modal();
const web3ModalProvider = await web3Modal.connect();
const provider = new ethers.providers.Web3Provider(web3ModalProvider);

// If using Web3React
const { library } = useWeb3React()
const provider = new ethers.providers.Web3Provider(library.provider);

// Submit Limit Order
const tx = await provider.getSigner().sendTransaction(txData)

// Print out hash
console.log(`Hash: ${tx.hash}`)

// Wait for tx to be mined
await tx.wait()
```

3. Fetch all orders

```
import { getAllOpenOrders } from '@gelatonetwork/limit-orders-lib'

const openOrders = await getAllOpenOrders(userAddress, chainId)
```

4. Cancel pending order

```
import { getAllOpenOrders } from '@gelatonetwork/limit-orders-lib'
import { getCancelLimitOrderPayload } from '@gelatonetwork/limit-orders-lib'

const openOrders = await getAllOpenOrders(userAddress, chainId)
if (openOrders.length === 0) throw Error("No orders found");
const order = openOrders[0]

const { module, inputToken, outputToken, minReturn, owner, witness } = order

const txData = await getCancelLimitOrderPayload(chainId, inputToken, outputToken, minReturn, owner, witness)

const tx = await provider.getSigner().sendTransaction(txData);

await tx.wait()
```

5. Get successfully executed orders

```
import { getExecutedOrders } from '@gelatonetwork/limit-orders-lib'

const executedOrders = await getExecutedOrders(userAddress, chainId)
```

6. Get cancelled orders

```
import { getCancelledOrders } from '@gelatonetwork/limit-orders-lib'

const cancelledOrders = await getCancelledOrders(userAddress, chainId)
```

## Types

```
export interface Order {
  id: number;
  inputToken: string;
  outputToken: string;
  inputAmount: BigNumber;
  minReturn: BigNumber;
  bought: BigNumber;
  status: string;
  cancelledTxHash: BytesLike;
  executedTxHash: BytesLike;
  updatedAt: string;
}

export interface TransactionData {
  to: string;
  data: BytesLike;
  value: BigNumber;
}

export interface TransactionDataWithSecret {
  txData: TransactionData;
  secret: string;
  witness: string;
}
```

### Need help?

Reach out to us on [Telegram](https://t.me/therealgelatonetwork), [Discord](https://discord.gg/ApbA39BKyJ) or [Twitter](https://twitter.com/gelatonetwork)
