import './config/instrument.js'
import express from 'express'
import cors from 'cors'
import connectDB from './config/db.js'
import dotenv from 'dotenv'
import * as Sentry from "@sentry/node";
import { clerkWebhooks } from './controllers/webHooks.js'



dotenv.config();



// initialize express
const app = express()

//connect to databe
await connectDB()


//middlewares
app.use(cors())

app.use(express.json())


// PORT
const PORT = process.env.PORT || 5000

// sentry setup
Sentry.setupExpressErrorHandler(app);


// Routes
app.get('/', (req, res) => res.send('API IS WORKING'))
app.get("/debug-sentry", function mainHandler(req, res) {
    throw new Error("My first Sentry error!");
});
app.post('/webhooks', clerkWebhooks)


//
app.listen(PORT, ()=> {
    console.log('Your Server Is Running on http://localhost:'+ PORT);
    
})

