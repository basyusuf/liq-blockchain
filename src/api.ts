import express from 'express';
const port = 3000;
const app = express();
import { Blockchain } from './blockchain';
import { ServiceResponse } from './helpers/ServiceResponse';
const liqcoin = new Blockchain();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/blockchain', (req, res, next) => {
    res.send(
        new ServiceResponse({
            status: true,
            statusCode: 200,
            data: liqcoin,
        }).get(),
    );
});

app.post('/transaction', (req, res, next) => {
    console.log('Data:', req.body);
    let blockIndex = liqcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    res.send(
        new ServiceResponse({
            status: true,
            statusCode: 201,
            data: { message: `Block number is: ${blockIndex}` },
        }).get(),
    );
});

app.get('/mine', (req, res, next) => {
    const lastBlock = liqcoin.getLastBlock();
    const previousBlockHash = lastBlock.hash;
    const nonce = liqcoin.proofOfWork(previousBlockHash, liqcoin.getPendingTransaction());
    const blockHash = liqcoin.hashBlock(previousBlockHash, liqcoin.getPendingTransaction(), nonce);
    //Mining rewards
    liqcoin.createNewTransaction(10, '00', 'ABCDEFGHTEREQAQSAD1W');

    const newBlock = liqcoin.createNewBlock(nonce, previousBlockHash, blockHash);

    console.info('New block:', newBlock);
    res.send(
        new ServiceResponse({
            status: true,
            statusCode: 201,
            data: { block: newBlock },
        }).get(),
    );
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
