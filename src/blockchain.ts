import { SHA256 } from 'crypto-js';
interface Block {
    index: number;
    timestamp: number;
    transactions: Array<any>;
    nonce: number;
    hash: string;
    previousBlockHash: string;
}
interface Transaction {
    amount: number;
    sender: string;
    recipient: string;
    timestamp: number;
}
class Blockchain {
    chain: Array<Block>;
    pendingTransactions: Array<Transaction>;
    constructor() {
        this.chain = [];
        this.pendingTransactions = [];
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
            amount,
            sender,
            recipient,
            timestamp: new Date().getTime(),
        };

        this.pendingTransactions.push(newTransaction);

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
}
