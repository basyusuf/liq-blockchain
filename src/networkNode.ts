import express from 'express';
const PORT = process.env.PORT || 3000;
const app = express();
import { Block, Blockchain } from './blockchain';
import { ServiceResponse } from './helpers/ServiceResponse';
import CustomAxios from './helpers/CustomAxios';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { v1 as uuidv1 } from 'uuid';
const liqcoin = new Blockchain();
const nodeAddress = uuidv1().split('-').join('');

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

app.get('/mine', async (req, res, next) => {
    const lastBlock = liqcoin.getLastBlock();
    const previousBlockHash = lastBlock.hash;
    const nonce = liqcoin.proofOfWork(previousBlockHash, liqcoin.getPendingTransaction());
    const blockHash = liqcoin.hashBlock(previousBlockHash, liqcoin.getPendingTransaction(), nonce);
    const newBlock = liqcoin.createNewBlock(nonce, previousBlockHash, blockHash);
    console.info('New block:', newBlock);

    await Promise.all(
        liqcoin.networkNodes.map(async (network_node: string) => {
            const requestOption: AxiosRequestConfig = {
                url: `${network_node}/receive-new-block`,
                method: 'POST',
                data: { newBlock },
            };
            const result = await CustomAxios(requestOption);
            console.info('Mine result:', result);
        }),
    );
    const requestOptionForRewards: AxiosRequestConfig = {
        url: `${liqcoin.currentNodeUrl}/transaction/broadcast`,
        method: 'POST',
        data: {
            amount: 10,
            sender: '00',
            recipient: nodeAddress,
        },
    };
    let resultForRewards = await CustomAxios(requestOptionForRewards);
    console.info('Result for rewards:', resultForRewards);
    res.json(
        new ServiceResponse({
            status: true,
            statusCode: 201,
            data: { block: newBlock },
        }).get(),
    );
});

app.post('/receive-new-block', (req, res, next) => {
    const newBlock = req.body.newBlock as Block;
    const lastBlock = liqcoin.getLastBlock();
    const isCorrectHash = lastBlock.hash === newBlock.previousBlockHash;
    const isCorrectIndex = lastBlock.index + 1 === newBlock.index;
    if (isCorrectHash && isCorrectIndex) {
        liqcoin.chain.push(newBlock);
        liqcoin.pendingTransactions = [];
        console.info('Pending transaction clear. Data:', liqcoin.pendingTransactions);
        res.json(new ServiceResponse({ status: true, statusCode: 200, data: { newBlock } }).get());
    } else {
        res.json(new ServiceResponse({ status: false, statusCode: 400, data: { newBlock } }).get());
    }
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

app.get('/consensus', async (req, res, next) => {
    const blockchains: Array<Blockchain> = [];
    await Promise.all(
        liqcoin.networkNodes.map(async (network_node) => {
            const requestOption: AxiosRequestConfig = {
                url: `${network_node}/blockchain`,
                method: 'GET',
            };
            const result = await CustomAxios(requestOption);
            blockchains.push(result.data.data);
        }),
    );
    const currentChainLink = liqcoin.chain.length;
    let maxChainLength = currentChainLink;
    let newLongestChain = null;
    let newPendingTransaction = null;
    console.info('Blockchains:', blockchains);
    blockchains.map((blockchain_item) => {
        if (blockchain_item.chain.length > maxChainLength) {
            maxChainLength = blockchain_item.chain.length;
            newLongestChain = blockchain_item.chain;
            newPendingTransaction = blockchain_item.pendingTransactions;
        }
    });
    console.info({
        currentChainLink,
        maxChainLength,
        newLongestChain,
        newPendingTransaction,
    });
    if (!newLongestChain || (newLongestChain && !liqcoin.chainIsValid(newLongestChain))) {
        res.json(
            new ServiceResponse({
                status: false,
                statusCode: 200,
                data: {
                    message: 'Current chain has not been replaced.',
                    chain: liqcoin.chain,
                },
            }).get(),
        );
    } else {
        liqcoin.chain = newLongestChain;
        liqcoin.pendingTransactions = newPendingTransaction;
        res.json(
            new ServiceResponse({
                status: true,
                statusCode: 200,
                data: {
                    message: 'This chain has been replaced.',
                    chain: liqcoin.chain,
                },
            }).get(),
        );
    }
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
