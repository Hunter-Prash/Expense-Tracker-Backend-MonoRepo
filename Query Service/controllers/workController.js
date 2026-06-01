import express from 'express'
import { docClient, GetCommand, PutCommand, UpdateCommand } from '../db.js';
import { QueryCommand } from '@aws-sdk/client-dynamodb';


export const getStatus = async (req, res) => {
    const user_id = req.user.id;


}

export const workLogger = async (req, res) => {
    const user_id = req.user.id;
    const { target_hrs, logged_hrs, algo, dev, office, notes } = req.body;

    // Generates a strict IST timestamp: YYYY-MM-DDTHH:mm:ss
    const timestamp = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' }).replace(' ', 'T');

    try {
        // FIXED: Changed 'date' key to match your table's Sort Key attribute name ('timestamp')
        const item = {
            user_id: user_id,
            timestamp: timestamp, 
            target_hrs: target_hrs || 0,
            logged_hrs: logged_hrs || 0,
            algo: algo || 0,
            dev: dev || 0,
            office: office || 0,
            isTargetMet: false, // FIXED: Explicitly set default state on creation
            notes: notes || ""
        };

        // 1. Write the new session to the ledger
        const command = new PutCommand({
            TableName: 'Daily-Work-Logger',
            Item: item
        });
        await docClient.send(command);

        // 2. Fetch all entries for today to calculate cumulative totals
        const currDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        const startOfDay = `${currDate}T00:00:00`;
        const endOfDay = `${currDate}T23:59:59`;

        const response = await docClient.send(new QueryCommand({
            TableName: 'Daily-Work-Logger',
            KeyConditionExpression: "user_id = :uid AND #ts BETWEEN :start AND :end",
            ExpressionAttributeNames: {
                "#ts": "timestamp"
            },
            ExpressionAttributeValues: {
                ":uid": user_id,
                ":start": startOfDay,
                ":end": endOfDay
            }
        }));

        let cumulative_hrs_for_curr_date = 0;

        if (response.Items && response.Items.length > 0) {
            cumulative_hrs_for_curr_date = response.Items.reduce((total, logItem) => {
                return total + (logItem.logged_hrs || 0);
            }, 0);
        }

        // 3. Evaluate if the day's targets are met
        // If the current cumulative hours hit or cross the target_hrs passed in the request
        if (cumulative_hrs_for_curr_date >= target_hrs && response.Items.length > 0) {

            // Get the specific key of the log entry we just created to update it
            const latestSession = response.Items[response.Items.length - 1];

            await docClient.send(new UpdateCommand({
                TableName: 'Daily-Work-Logger',
                Key: {
                    "user_id": user_id,
                    "timestamp": latestSession.timestamp 
                },
                UpdateExpression: "SET isTargetMet = :trueVal",
                ExpressionAttributeValues: {
                    ":trueVal": true
                }
            }));

            
            item.isTargetMet = true;
            console.log("Target reached. Repercussion Engine disarmed.");
        }

        // Return the final confirmed tracking object back to React
        return res.status(200).json({
            message: "Work state saved successfully.",
            item: item,
            cumulativeHoursToday: cumulative_hrs_for_curr_date
        });

    } catch (e) {
        console.error("DynamoDB Process Error:", e);
        return res.status(500).json({
            error: "Failed to process work log cycle",
            details: e.message
        });
    }
};