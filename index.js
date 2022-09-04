const express = require('express');
const cors = require('cors');
var jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

//JWT
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized Access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' });
        }
        req.decoded = decoded;
        next();
    })
}



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.m12jl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const productsCollection = client.db('gear-up').collection('products');
        const orderCollection = client.db('gear-up').collection('orders');
        const userCollection = client.db('gear-up').collection('users');


        //get all products
        app.get('/products', async (req, res) => {
            const query = {};

            const cursor = productsCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        })

        //get a single products by id
        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };

            const cursor = await productsCollection.findOne(query);
            res.send(cursor);
        })

        // update a product by id 
        app.put('/update-product/:id', async (req, res) => {
            const id = req.params.id;
            const updatedProduct = req.body;
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    quantity: updatedProduct.quantity,
                }
            };

            // console.log('updatedProduct:', updatedProduct);
            // console.log('updatedDoc:', updatedDoc);
            // console.log(id);

            const result = await productsCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        //add a new order
        app.post('/confirm-purchase', async (req, res) => {
            const orderDetails = req.body;
            const result = await orderCollection.insertOne(orderDetails);

            res.send(result);
        })

        //delete an order
        app.delete('/delete-order', async (req, res) => {
            const id = req.query.id;
            const query = { _id: ObjectId(id) };

            const result = await orderCollection.deleteOne(query);
            res.send(result);

        })

        //get orders by user email
        app.get('/my-orders', async (req, res) => {
            const email = req.query.email;

            const query = { customerEmail: email };
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();

            res.send(orders)
        })


        //create a new user
        app.put('/create-user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;

            const filter = { email: email };
            const options = { upsert: true };

            const updatedDoc = {
                $set: user,
            };

            const result = await userCollection.updateOne(filter, updatedDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10d' });
            res.send({ result, token });

        })

        //get a single user from DB
        app.get('/user', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };

            const result = await userCollection.findOne(query);
            res.send(result)
        })

    }

    finally {

    }
}

run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('E-Mart-BD server is Running')
})

app.listen(port, () => {
    console.log(`E-Mart-BD server is listening on port ${port}`)
})