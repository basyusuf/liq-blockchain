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
    createNewBlock(nonce: number, previousBlockHash: string, hash: string) {
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
    getLastBlock() {
        let lastBlock = this.chain[this.chain.length - 1];
        return lastBlock;
    }
    createNewTransaction(amount: number, sender: string, recipient: string) {
        let newTransaction: Transaction = {
            id: uuidv1().split('-').join(''),
            amount,
            sender,
            recipient,
            timestamp: new Date().getTime(),
        };
        return newTransaction;
    }
    addTransactionToPendingTransaction(transactionItem: Transaction) {
        this.pendingTransactions.push(transactionItem);
        return this.getLastBlock()['index'] + 1;
    }
    hashBlock(previousBlockHash: string, currentBlockData: Array<Transaction>, nonce: number) {
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
    getPendingTransaction() {
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
}
