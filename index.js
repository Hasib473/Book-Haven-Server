const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const  admin = require("firebase-admin");

const serviceAccount = require("./serviceKey.json");


const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.a2dvrcg.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyToken = async (req, res, next) =>{
   const authorization = req.headers.authorization;

   if (!authorization) {
    return res.status(401).send({message : 'Unauthorized access'})
   }
   const token = authorization.split(' ')[1];
    try{
      const decode = await admin.auth().verifyIdToken(token);
      next();
    }
    catch(error){
      res.status(401).send({message : 'Unauthorized access'})
    }
}

async function run() {
  try {

    const db = client.db('Book_Haven');
    const booksCollection =db.collection('AllBooks');
    const commentsCollection = db.collection('Comments');


    app.get('/allbooks', async(req, res) => {

        const result = await booksCollection.find().toArray()  // return promise 
        console.log(result);
        res.send(result)
    })

    app.get('/mybooks',verifyToken, async(req, res) => {
      const email = req.query.email;
      const result = await booksCollection.find({userEmail: email}).toArray()  // return promise
      res.send(result);
    }
  )

    app.get('/allbooks/:id',verifyToken, async(req, res) => {
        const {id}= req.params;
        const objectId = new ObjectId(id);
        const result = await booksCollection.findOne({_id  : objectId});
        res.send(result);
    })

    app.post('/allbooks', async(req, res) => {

        const book = req.body;
        console.log(book);
        const result = await booksCollection.insertOne(book);
        res.send(result);
    })


    app.put('/allbooks/:id', async(req, res) => {
        const {id} = req.params;
        const objectId = new ObjectId(id);
        const updatedBook = req.body;
        const result = await booksCollection.updateOne({_id : objectId}, {$set : updatedBook});
        res.send(result);
    })


    //delete books

    app.delete('/allbooks/:id', async(req, res) => {
        const {id} = req.params;
        const objectId = new ObjectId(id);
        const result = await booksCollection.deleteOne({_id : objectId});
        res.send(result);
    }); 



    app.get('/latest_books', async(req, res) => {
        const result = await booksCollection
        .find()
        .sort({ _id: -1 }) // Sort by _id in descending order to get the latest documents
        .limit(6)
        .toArray();

        res.send(result);
    })

    app.post('/comments', async (req, res) => {

  const comment = req.body;

  const result = await commentsCollection.insertOne(comment);

  res.send(result);

});


app.get('/comments/:bookId', async (req, res) => {

  const { bookId } = req.params;

  const result = await commentsCollection
    .find({ bookId: bookId })
    .toArray();

  res.send(result);

});


    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) =>{
    res.send('server is running successfully')
})



app.listen(PORT , () => {
    console.log(`server is running on port ${PORT}`);
})