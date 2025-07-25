import { app } from "./app.js";
import connectToDB from "./db/connection.js";
import dotenv from "dotenv"

dotenv.config({
    path: "./env"
})


connectToDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server started at PORT: ${process.env.PORT}`)
    })
})
.catch((error) => {
    console.log("MongoDB connection failed", error);
})