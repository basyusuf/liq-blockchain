# Liq Blockchain

### How to start

-   git clone https://github.com/basyusuf/liq-blockchain.git && cd liq-blockchain
-   npm install
-   run command for each node: tsc && CURRENT_URL=http://localhost:3000 PORT=3000 node build/networkNode.js
-   you can see documentation http://{baseurl}/documentation (default:http://localhost:3000/documentation)
-   register and broadcast another nodes http://localhost:3000/register-and-broadcast-node
-   you can create transaction with this api (http://localhost:3000/transaction/broadcast)
-   if you need new block then you can mining with this api (http://localhost:3000/mine)
-   And you can import postman collection in docs folder

### Running Nodes Example

![Running Nodes](/docs/running_nodes.png?raw=true)

### Swagger Documentation

![Documentation](/docs/documentation.png?raw=true)
