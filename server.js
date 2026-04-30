require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());

app.get("/", (req, res) => {
    res.send({
        message: "Welcome to backend"
    });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log("server is running on PORT: ", PORT);
});