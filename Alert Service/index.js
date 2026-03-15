import express from "express"
import serverlessExpress from "@vendia/serverless-express"
import cors from "cors"
import limitsRoute from './routes/limitsRoute.js'
import { eventhandler } from './eventHandler.js'

const app = express()

app.use(cors())
app.use(express.json())

// health check
app.get("/health", (req, res) => {
    res.status(200).json({ message: "Alert Service is running" })
})

// routes
app.use('/api/v1/limits', limitsRoute)

const apiHandler = serverlessExpress({ app })

export const handler = async (event, context) => {
    const isEventBridgeEvent =
        event &&
        typeof event === 'object' &&
        typeof event.source === 'string' &&
        typeof event['detail-type'] === 'string' &&
        event.detail !== undefined;

    if (isEventBridgeEvent) {
        return eventhandler(event, context);
    }

    return apiHandler(event, context);
}
