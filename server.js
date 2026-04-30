require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const dns = require('dns');
const cors = require('cors');
const path = require('path');

const userRoutes = require('./routes/user');
const fileRoutes = require('./routes/files');

const app = express();

app.use(cors());

app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

app.use('/api/files', fileRoutes);

app.use('/api/user', userRoutes);

app.get('/', (req, res) => {
  res.json({ message: "Backend is running" });
});

dns.setServers(['8.8.8.8', '1.1.1.1']);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to database');
    app.listen(process.env.PORT, () => {
      console.log('Listening for requests on port', process.env.PORT);
    });
  })
  .catch((err) => {
    console.log(err);
  });
