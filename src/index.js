import dotenv from "dotenv";
dotenv.config({path:'./env'});
import connectDB from "./db/index.js";
import { app } from "./app.js";
// Importing the connectDB function to establish a connection to the database

connectDB()
.then(() => {
  app.listen(process.env.PORT|| 8000, () => {
    console.log(`Server is running on port ${process.env.PORT || 8000}`);
  }); 
})
.catch((error) => {
  console.log("Error connecting to the MongoDB!!", error);
  
});