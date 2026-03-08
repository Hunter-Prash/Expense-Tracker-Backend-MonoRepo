import express from "express"
import serverlessExpress from "@vendia/serverless-express"
import cors from "cors"

const app = express()

app.use(cors())
app.use(express.json())

// health check
app.get("/health", (req, res) => {
    res.status(200).json({ message: "Alert Service is running" })
})

export const handler = serverlessExpress({ app })
