import dotenv from "dotenv";
dotenv.config();

import express from "express";
import {createServer} from "node:http";

import {connectToSocket} from "./controllers/socketManager.js";

import mongoose from "mongoose";
import cors from "cors";

const app = express();

const server = createServer(app);
const socketIo = connectToSocket(server);


app.use(cors());
app.use(express.json({limit : "40kb"}));
app.use(express.urlencoded({limit:"40kb", extended: true }));

app.get("/home", (req, res) => {
    return res.json({"Hello" : "World"});
});

const PORT = process.env.PORT || 8000;
const MONGO_URL = process.env.MONGO_URL;

const start = async () => {

    const connectionDb = await mongoose.connect(MONGO_URL);
    console.log(`MONGO Connected DB Host : ${connectionDb.connection.host}`);

    server.listen(PORT, () => {
        console.log(`Listening on port ${PORT}`);
    });
}

start();