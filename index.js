require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.anttmlo.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db('dressxDB').collection('users');

    // get all the users data
    app.get('/users', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    })

    // create users and store thier data to the database
    app.post('/users', async (req, res) => {
      const user = req.body; 
      const query = {email: user.email}
      const existingUser = await userCollection.findOne(query);
      console.log(existingUser);
      if(existingUser) return res.send({message: 'User already exists'});
      const result = await userCollection.insertOne(user);
      res.send(result);
    })

    // update the users role student to admin by using their id
    app.patch('/users/admin/:id', async (req, res) => {  
      const id = req.params.id; 
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updateDoc); 
      res.send(result);
    })

    // update the users role student to instructor by using their id
    app.patch('/users/instructor/:id', async (req, res) => {  
      const id = req.params.id; 
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          role: 'instructor'
        }
      }
      const result = await userCollection.updateOne(filter, updateDoc); 
      res.send(result);
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('DRESSX IS RUNING!');
})

app.listen(port, () => {
  console.log(`DRESSX IS RUNING ON PORT ${port}`);
})
