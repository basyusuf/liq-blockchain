import express from 'express';
const PORT = process.env.PORT || 3000;
const app = express();
import { Blockchain } from './blockchain';
import { ServiceResponse } from './helpers/ServiceResponse';
import CustomAxios from './helpers/CustomAxios';
import { AxiosResponse } from 'axios';
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

//Register a node and broadcast it the network
app.post('/register-and-broadcast-node', async (req, res, next) => {
    const newNodeUrl = req.body.newNodeUrl;
    if (!liqcoin.networkNodes.includes(newNodeUrl)) {
        liqcoin.networkNodes.push(newNodeUrl);
    }
    const registerNodeResults: AxiosResponse<any>[] = [];
    await Promise.all(
        liqcoin.networkNodes.map(async (networkNode) => {
            const requestOption = {
                url: `${networkNode}/register-node`,
                Method: 'POST',
                body: { newNodeUrl },
            };
            let result = await CustomAxios(requestOption);
            console.info(`Network Node:${networkNode} Result:`, result);
            registerNodeResults.push(result);
        }),
    );
    console.info('Register node results:', registerNodeResults);
    const bulkRegisterOption = {
        url: `${newNodeUrl}/register-nodes-bulk`,
        Method: 'POST',
        body: {
            allNetworkNodes: [...liqcoin.networkNodes, liqcoin.currentNodeUrl],
        },
    };
    let result = await CustomAxios(bulkRegisterOption);
    res.send(
        new ServiceResponse({
            status: true,
            statusCode: 201,
            data: {
                message: 'New node registered with network successfully!',
            },
        }).get(),
    );
});

//Register a node with the network
app.post('/register-node', (req, res, next) => {
    const newNodeUrl = req.body.newNodeUrl;
});

//Register multiple nodes at once
app.post('/register-nodes-bulk', (req, res, next) => {
    const newNodeUrl = req.body.newNodeUrl;
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
