import './config/instrument.js'
import express from 'express'
import cors from 'cors'
import connectDB from './config/db.js'
import dotenv from 'dotenv'
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
const PORT = process.env.PORT || 5003



// Routes
app.get('/', (req, res) => res.send('API IS WORKING'))
app.post('/clerk',express.json(), clerkWebhooks)


//
app.listen(PORT, ()=> {
    console.log('Your Server Is Running on http://localhost:'+ PORT);
    
})

