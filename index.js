require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

// verify json web token
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization; 
  if(!authorization) return res.status(401).send({error: true, message: 'Unauthorized Access'}); 

  // bearer token authentication
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(401).send({ error: true, message: 'Unauthorized Access' }); 
    req.decoded = decoded;
    next();
  })
}

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
    const classCollection = client.db('dressxDB').collection('classes');

    // JSON WEB TOKEN 
    app.post('/jwt', (req, res) => {
      const user = req.body; 
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'}); 
      res.send({token});
    })

    // get all the users data (admin only)
    app.get('/users', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    })

    // get all the classes data (admin only)
    app.get('/classes', async (req, res) => {
      const result = await classCollection.find().toArray();
      res.send(result);
    })

    // create users and store thier data to the database (admin only)
    app.post('/users', async (req, res) => {
      const newUser = req.body; 
      const query = {email: newUser.email}
      const existingUser = await userCollection.findOne(query);
      if(existingUser) return res.send({message: 'User already exists'});
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    })

    // update the users role student to admin (admin only)
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

    // update the users role student to instructor (admin only)
    app.patch('/users/instructor/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'instructor'
        }
      }
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    })
    
    // update the instructor classes status approve (admin only)
    app.put('/classes/approve/:id', async (req, res) => {  
      const id = req.params.id; 
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          status: 'approved'
        }
      }
      const result = await classCollection.updateOne(filter, updateDoc); 
      res.send(result);
    })

    // update the instructor classes status deny (admin only)
    app.put('/classes/deny/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: 'denied'
        }
      }
      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

    // send feedback to the instructor (admin only)
    app.put('/classes/feedback/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedClass = req.body;
      const updateDoc = {
        $set: {
          feedback: updatedClass.feedback,
        }
      };
      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);
    });


    // create classes and store the data to the database (instructor only)
    app.post('/classes', async (req, res) => {
      const newClasses = req.body;
      const result = await classCollection.insertOne(newClasses);
      res.send(result);
    })

    // get classes by using email (instructor only)
    app.get('/myclasses', verifyJWT, async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { instructorEmail: req.query.email };
      }

      const decodedEmail = req.decoded.email; 
      if (query.instructorEmail !== decodedEmail) return res.status(403).send({ error: true, message: 'Forbidden Access' });
      
      const result = await classCollection.find(query).toArray();
      res.send(result);
    });

    // get approve classes by using status called approve (instructor only)
    app.get('/approve-classes', async (req, res) => {
      const query = { status: 'approved' };
      const result = await classCollection.find(query).toArray();
      res.send(result);
    });

    // get instructor by using role called instructor (instructor only)
    app.get('/instructors', async (req, res) => {
      const query = { role: 'instructor' };
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });

    // update the classes data (instructor only)
    app.put('/classes/update/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedClass = req.body;
      const updateDoc = {
        $set: {
          feedback: updatedClass.feedback,
          className: updatedClass.className,  
          availableSeats: updatedClass.availableSeats,
          price: updatedClass.price,
          imageUrl: updatedClass.imageUrl,
        }
      };
      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

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
