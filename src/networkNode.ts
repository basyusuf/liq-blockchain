import express from 'express';
const PORT = process.env.PORT || 3000;
const app = express();
import { Block, Blockchain } from './blockchain';
import { ServiceResponse } from './helpers/ServiceResponse';
import CustomAxios from './helpers/CustomAxios';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { v1 as uuidv1 } from 'uuid';
import { Validation } from './middleware/Validation';
import { GetTransactionDTO } from './dto/GetTransaction.dto';
import { GetAddressDTO } from './dto/GetAddress.dto';
import { GetBlockDTO } from './dto/GetBlock.dto';
import { CreateTransactionDTO } from './dto/CreateTransaction.dto';
import { CreateTransactionBroadcastDTO } from './dto/CreateTransactionBroadcast.dto';
import SwaggerUI from 'swagger-ui-express';
import SwaggerJsDoc from 'swagger-jsdoc';

const liqcoin = new Blockchain();
const nodeAddress = uuidv1().split('-').join('');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/**
 * @swagger
 * /blockchain:
 *   get:
 *     description: Get blockchain full detail
 *     tags:
 *       - Blockchain
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: List blockchain object
 */
app.get('/blockchain', (req, res, next) => {
    res.json(
        new ServiceResponse({
            status: true,
            statusCode: 200,
            data: liqcoin,
        }).get(),
    );
});

/**
 * @swagger
 * /transaction:
 *   post:
 *     description: Create transaction by Broadcast Automatically
 *     tags:
 *       - Transaction
 *     parameters:
 *       - name: id
 *         description: Transaction Id
 *         in: formData
 *         required: true
 *         type: number
 *       - name: amount
 *         description: Transaction Amount
 *         in: formData
 *         required: true
 *         type: number
 *       - name: sender
 *         description: Transaction Sender
 *         in: formData
 *         required: true
 *         type: string
 *       - name: recipient
 *         description: Transaction Recipient
 *         in: formData
 *         required: true
 *         type: string
 *       - name: timestamp
 *         description: Transaction Timestamp
 *         in: formData
 *         required: true
 *         type: number
 *     produces:
 *       - application/json
 *     responses:
 *       201:
 *         description: Created Transaction By Broadcast
 *       400:
 *         description: Validation Error
 */
app.post('/transaction', Validation(CreateTransactionDTO), (req, res, next) => {
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

/**
 * @swagger
 * /transaction/broadcast:
 *   post:
 *     description: Create transaction
 *     tags:
 *       - Transaction
 *     parameters:
 *       - name: amount
 *         description: Transaction Amount
 *         in: formData
 *         required: true
 *         type: number
 *       - name: sender
 *         description: Transaction Sender
 *         in: formData
 *         required: true
 *         type: string
 *       - name: recipient
 *         description: Transaction Recipient
 *         in: formData
 *         required: true
 *         type: string
 *     produces:
 *       - application/json
 *     responses:
 *       201:
 *         description: Created Transaction
 *       400:
 *         description: Validation Error
 */
app.post('/transaction/broadcast', Validation(CreateTransactionBroadcastDTO), async (req, res, next) => {
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

/**
 * @swagger
 * /mine:
 *   get:
 *     description: Mine block
 *     tags:
 *       - Mine
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Mine completed
 */
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

/**
 * @swagger
 * /receive-new-block:
 *   post:
 *     description: Receive new block used by Mine
 *     tags:
 *       - Mine
 *     parameters:
 *       - name: newBlock
 *         description: New Block Item
 *         in: body
 *         required: true
 *         type: object
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Created Transaction
 *       400:
 *         description: Isn't correct hash or correct index
 */
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

/**
 * @swagger
 * /register-and-broadcast-node:
 *   post:
 *     description: Register blockchain and broadcast all nodes. Sync action.
 *     tags:
 *       - Blockchain
 *     parameters:
 *       - name: newNodeUrl
 *         description: New node url for registering
 *         in: formData
 *         required: true
 *         type: string
 *     produces:
 *       - application/json
 *     responses:
 *       201:
 *         description: Register Successfully!
 */
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

/**
 * @swagger
 * /register-node:
 *   post:
 *     description: Register a node with the network.
 *     tags:
 *       - Blockchain
 *     parameters:
 *       - name: newNodeUrl
 *         description: New node url for registering
 *         in: formData
 *         required: true
 *         type: string
 *     produces:
 *       - application/json
 *     responses:
 *       201:
 *         description: Register Successfully!
 */
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

/**
 * @swagger
 * /register-nodes-bulk:
 *   post:
 *     description: Register a node with the network.
 *     tags:
 *       - Blockchain
 *     parameters:
 *       - name: allNetworkNodes
 *         description: All network nodes on blockchain
 *         in: body
 *         required: true
 *         type: array
 *     produces:
 *       - application/json
 *     responses:
 *       201:
 *         description: Bulk registriation successfull!
 */
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

/**
 * @swagger
 * /consensus:
 *   get:
 *     description: Execute consensus method
 *     tags:
 *       - Blockchain
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: This chain has been replaced
 */
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

/**
 * @swagger
 * /block/{hash}:
 *   post:
 *     description: Get block detail
 *     tags:
 *       - Blockchain
 *     parameters:
 *       - name: hash
 *         description: Block hash
 *         in: path
 *         required: true
 *         type: string
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: All information for this block
 */
app.get('/block/:hash', Validation(GetBlockDTO), async (req, res, next) => {
    let hash = req.params.hash;
    let findHash = liqcoin.getBlock(hash);
    if (findHash) {
        res.json(
            new ServiceResponse({
                status: true,
                statusCode: 200,
                data: {
                    block: findHash,
                },
            }).get(),
        );
    } else {
        res.json(
            new ServiceResponse({
                status: false,
                statusCode: 200,
                data: {
                    chain: findHash,
                },
            }).get(),
        );
    }
});

/**
 * @swagger
 * /transaction/{transactionId}:
 *   post:
 *     description: Get transaction detail
 *     tags:
 *       - Transaction
 *     parameters:
 *       - name: transactionId
 *         description: Transaction Id
 *         in: path
 *         required: true
 *         type: string
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: All information for this transaction
 */
app.get('/transaction/:transactionId', Validation(GetTransactionDTO), async (req, res, next) => {
    let transactionId = req.params.transactionId;
    let hasTransactionData = liqcoin.getTransaction(transactionId);
    console.info('Has transaction data:', hasTransactionData);
    if (hasTransactionData.status) {
        res.json(
            new ServiceResponse({
                status: true,
                statusCode: 200,
                data: hasTransactionData,
            }).get(),
        );
    } else {
        res.json(
            new ServiceResponse({
                status: false,
                statusCode: 200,
                data: hasTransactionData,
            }).get(),
        );
    }
});

/**
 * @swagger
 * /address/{address}:
 *   post:
 *     description: Get address detail
 *     tags:
 *       - Blockchain
 *     parameters:
 *       - name: address
 *         description: Address Id
 *         in: path
 *         required: true
 *         type: string
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: All information for this address
 */
app.get('/address/:address', Validation(GetAddressDTO), async (req, res, next) => {
    const address = req.params.address;
    let addressData = liqcoin.getAddressData(address);
    res.json(
        new ServiceResponse({
            status: true,
            statusCode: 200,
            data: addressData,
        }).get(),
    );
});

//Swagger API Documentation
const swaggerDefinition = {
    info: {
        title: 'Liq Blockchain Swagger API',
        version: '1.0.0',
        description: 'Endpoints to test the all routes',
    },
    //On server host:domain.com OR local: localhost:3000
    host: 'localhost:3000',
    basePath: '/',
};
const swaggerOptions = {
    swaggerDefinition,
    apis: [__filename],
};
const swaggerSpec = SwaggerJsDoc(swaggerOptions);
app.use('/documentation', SwaggerUI.serve, SwaggerUI.setup(swaggerSpec));

//Starting node
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
