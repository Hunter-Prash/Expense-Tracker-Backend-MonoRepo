import express from "express"
import serverlessExpress from "@vendia/serverless-express"
import cors from "cors"
import userRoute from './routes/authRoute.js'
import transactionRoute from './routes/transactionRoute.js'
import workRoute from './routes/workTrackerRoute.js'

const app = express()

app.use(cors())
app.use(express.json())


// route
app.get("/health", (req, res) => {
    res.status(200).json({ message: "Success" })
})

app.use('/api/v1', userRoute)
app.use('/api/v1/transactions', transactionRoute)
app.use('/api/v1/work',workRoute)

export const handler = serverlessExpress({ app })//wrap the express app inside the vendia adapter
