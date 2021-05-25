interface Block {
    index:number;
    timestamp:number;
    transactions:Array<any>;
    nonce:number;
    hash:string;
    previousBlockHash:string;
}
class Blockchain {
    chain: Array<Block>;
    transactions: Array<any>;
    constructor() {
        this.chain = [];
        this.transactions = [];
    }
    createNewBlock(nonce:any,previousBlockHash:any,hash:any) {
        const newBlock:Block = {
            index:this.chain.length+1,
            timestamp:new Date().getTime(),
            transactions:this.transactions,
            nonce,
            hash,
            previousBlockHash
        };
        //Clear previous transaction
        this.transactions = [];
        this.chain.push(newBlock);
        return newBlock;
    }
}
