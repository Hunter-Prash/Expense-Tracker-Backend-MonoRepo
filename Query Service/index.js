import express from "express"
import serverlessExpress from "@vendia/serverless-express"
import userRoute from './routes/authRoute.js'

const app = express()

app.use(express.json())


// route
app.get("/health",(req,res)=>{
    res.status(200).json({message:"Success"})
})

app.use('/api/v1',userRoute)

export const handler = serverlessExpress({ app })//wrap the express app inside the vendia adapter