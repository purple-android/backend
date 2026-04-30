require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const dns = require('dns');
const cors = require('cors');

const notesRoutes = require('./routes/notes');
const userRoutes = require('./routes/user');

// express app
const app = express();

// middleware
app.use(cors());
app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

// routes
app.use('/api/notes', notesRoutes);
app.use('/api/user', userRoutes);

dns.setServers(['8.8.8.8', '1.1.1.1']);

// connect to db
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