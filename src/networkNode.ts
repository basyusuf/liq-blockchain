import express from 'express';
const PORT = process.env.PORT || 3000;
const app = express();
import { Blockchain } from './blockchain';
import { ServiceResponse } from './helpers/ServiceResponse';
import CustomAxios from './helpers/CustomAxios';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
const liqcoin = new Blockchain();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/blockchain', (req, res, next) => {
    res.json(
        new ServiceResponse({
            status: true,
            statusCode: 200,
            data: liqcoin,
        }).get(),
    );
});

app.post('/transaction', (req, res, next) => {
    console.log('Request Body:', req.body);
    const { id, amount, sender, recipient, timestamp } = req.body;
    const blockIndex = liqcoin.addTransactionToPendingTransaction({
        id,
        amount,
        sender,
        recipient,
        timestamp,
    });
    res.json(
        new ServiceResponse({
            status: true,
            statusCode: 201,
            data: {
                message: `Transaction will be added in block: ${blockIndex}`,
            },
        }).get(),
    );
});

app.post('/transaction/broadcast', async (req, res, next) => {
    const newTransaction = liqcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    liqcoin.addTransactionToPendingTransaction(newTransaction);

    await Promise.all(
        liqcoin.networkNodes.map(async (network_node) => {
            let requestOption: AxiosRequestConfig = {
                url: `${network_node}/transaction`,
                method: 'POST',
                data: newTransaction,
            };
            let result = await CustomAxios(requestOption);
            console.info('Result:', result);
        }),
    );
    res.json(
        new ServiceResponse({
            status: true,
            statusCode: 201,
            data: {
                message: 'Transaction created and broadcast successfully!',
            },
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
    res.json(
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
    await Promise.all(
        liqcoin.networkNodes.map(async (networkNode) => {
            const requestOption: AxiosRequestConfig = {
                url: `${networkNode}/register-node`,
                method: 'POST',
                data: { newNodeUrl },
            };
            try {
                let result = await CustomAxios(requestOption);
                console.info(`Network Node:${networkNode} Result:`, result);
            } catch (err) {
                console.info('Register request have error:', err);
            }
        }),
    );
    const bulkRegisterOption: AxiosRequestConfig = {
        url: `${newNodeUrl}/register-nodes-bulk`,
        method: 'POST',
        data: {
            allNetworkNodes: [...liqcoin.networkNodes, liqcoin.currentNodeUrl],
        },
    };
    let result = await CustomAxios(bulkRegisterOption);
    console.info('Bulk register result:', result);
    res.json(
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
    if (!liqcoin.networkNodes.includes(newNodeUrl) && liqcoin.currentNodeUrl != newNodeUrl) {
        liqcoin.networkNodes.push(newNodeUrl);
    }
    res.json(
        new ServiceResponse({
            status: true,
            statusCode: 201,
            data: {
                message: 'New node registered successfully!',
            },
        }).get(),
    );
});

//Register multiple nodes at once
app.post('/register-nodes-bulk', (req, res, next) => {
    const allNetworkNodes = req.body.allNetworkNodes;
    allNetworkNodes.map((network_node: string) => {
        if (!liqcoin.networkNodes.includes(network_node) && liqcoin.currentNodeUrl != network_node) {
            liqcoin.networkNodes.push(network_node);
        }
    });
    res.json(
        new ServiceResponse({
            status: true,
            statusCode: 201,
            data: {
                message: 'Bulk registriation successfull!',
            },
        }).get(),
    );
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
