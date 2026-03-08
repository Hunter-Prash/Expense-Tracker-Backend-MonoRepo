import express from "express"
import serverlessExpress from "@vendia/serverless-express"

const app = express()

app.use(express.json())

// health check
app.get("/health", (req, res) => {
    res.status(200).json({ message: "Alert Service is running" })
})

export const handler = serverlessExpress({ app })
