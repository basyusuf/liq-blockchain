import { SHA256 } from 'crypto-js';
import { v1 as uuidv1 } from 'uuid';
const CURRENT_NODE_URL = process.env.CURRENT_URL || 'http://localhost:3000';
console.info('Current Node Url:', CURRENT_NODE_URL);
export interface Block {
    index: number;
    timestamp: number;
    transactions: Array<any>;
    nonce: number;
    hash: string;
    previousBlockHash: string;
}
export interface Transaction {
    id: string;
    amount: number;
    sender: string;
    recipient: string;
    timestamp: number;
}
export class Blockchain {
    chain: Array<Block>;
    pendingTransactions: Array<Transaction>;
    networkNodes: Array<string>;
    currentNodeUrl: string;
    constructor() {
        this.chain = [];
        this.pendingTransactions = [];
        this.currentNodeUrl = CURRENT_NODE_URL;
        this.networkNodes = [];
        //Genesis block
        this.createNewBlock(100, '0', '0');
    }
    createNewBlock(nonce: number, previousBlockHash: string, hash: string): Block {
        const newBlock: Block = {
            index: this.chain.length + 1,
            timestamp: new Date().getTime(),
            transactions: this.pendingTransactions,
            nonce,
            hash,
            previousBlockHash,
        };
        //Clear previous transaction
        this.pendingTransactions = [];
        //Push block to chain
        this.chain.push(newBlock);
        return newBlock;
    }
    getLastBlock(): Block {
        let lastBlock = this.chain[this.chain.length - 1];
        return lastBlock;
    }
    createNewTransaction(amount: number, sender: string, recipient: string): Transaction {
        let newTransaction: Transaction = {
            id: uuidv1().split('-').join(''),
            amount,
            sender,
            recipient,
            timestamp: new Date().getTime(),
        };
        return newTransaction;
    }
    addTransactionToPendingTransaction(transactionItem: Transaction): number {
        this.pendingTransactions.push(transactionItem);
        return this.getLastBlock()['index'] + 1;
    }
    hashBlock(previousBlockHash: string, currentBlockData: Array<Transaction>, nonce: number): string {
        let dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
        const hash = SHA256(dataAsString);
        return String(hash);
    }
    proofOfWork(previousBlockHash: string, currentBlockData: Array<Transaction>) {
        let nonce = 0;
        let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        while (hash.substring(0, 4) !== '0000') {
            nonce += 1;
            hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
            console.info(hash);
        }
        return nonce;
    }
    getPendingTransaction(): Array<Transaction> {
        return this.pendingTransactions;
    }
    chainIsValid(blocks: Array<Block>): boolean {
        let validStatus = true;
        //Started index 1. Skip genesis block
        for (let index = 1; index < blocks.length; index++) {
            let currentBlock = blocks[index];
            let prevBlock = blocks[index - 1];
            let blockHash = this.hashBlock(prevBlock.hash, currentBlock.transactions, currentBlock.nonce);
            if (blockHash.substring(0, 4) !== '0000') {
                validStatus = false;
            }
            if (currentBlock.previousBlockHash !== prevBlock.hash) {
                validStatus = false;
            }
        }
        const genesisBlock = blocks[0];
        const correctNonce = genesisBlock.nonce === 100;
        const correctPreviousBlockHash = genesisBlock.previousBlockHash === '0';
        const correctHash = genesisBlock.hash === '0';
        const correctTransaction = genesisBlock.transactions.length === 0;

        if (!correctNonce || !correctPreviousBlockHash || !correctHash || !correctTransaction) {
            validStatus = false;
        }
        return validStatus;
    }
    getBlock(hash: string): Block | null {
        let targetBlock = this.chain.filter((block_item) => block_item.hash == hash);
        return targetBlock.length > 0 ? targetBlock[0] : null;
    }
    getTransaction(transactionId: string): { block: null | Block; transaction: null | Transaction; status: boolean } {
        console.info('Transaction Id:', transactionId);
        let correctTransactionAndBlock: { block: null | Block; transaction: null | Transaction; status: boolean } = {
            block: null,
            transaction: null,
            status: false,
        };
        this.chain.map((block_item) => {
            block_item.transactions.map((transaction_item: Transaction) => {
                if (transaction_item.id == transactionId) {
                    correctTransactionAndBlock.transaction = transaction_item;
                    correctTransactionAndBlock.block = block_item;
                    correctTransactionAndBlock.status = true;
                }
            });
        });
        return correctTransactionAndBlock;
    }
    getAddressData(address: string): { addressTransactions: Array<Transaction>; addressBalance: number } {
        let addressData: Array<Transaction> = [];
        this.chain.map((block_item: Block) => {
            block_item.transactions.map((transaction_item: Transaction) => {
                if (transaction_item.recipient == address || transaction_item.recipient) {
                    addressData.push(transaction_item);
                }
            });
        });
        let balance = 0;
        addressData.map((transaction_item: Transaction) => {
            if (transaction_item.recipient == address) {
                balance += transaction_item.amount;
            } else {
                balance -= transaction_item.amount;
            }
        });
        return {
            addressTransactions: addressData,
            addressBalance: balance,
        };
    }
}
