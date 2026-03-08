import express from "express"
import serverlessExpress from "@vendia/serverless-express"
import cors from "cors"
import userRoute from './routes/authRoute.js'
import categoryRoute from './routes/categoryRoute.js'

const app = express()

app.use(cors())
app.use(express.json())


// route
app.get("/health", (req, res) => {
    res.status(200).json({ message: "Success" })
})

app.use('/api/v1', userRoute)
app.use('/api/v1/categories', categoryRoute)

export const handler = serverlessExpress({ app })//wrap the express app inside the vendia adapter