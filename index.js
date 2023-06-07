require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());





app.get('/', (req, res) => {
  res.send('DRESSX IS RUNING!');
})

app.listen(port, () => {
  console.log(`DRESSX IS RUNING ON PORT ${port}`);
})
