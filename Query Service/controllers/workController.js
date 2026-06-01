import express from 'express';
import { docClient, PutCommand, UpdateCommand, QueryCommand } from '../db.js';

export const getStatus = async (req, res) => {
    const user_id = req.user.id;
    
    // 2. Fetch all entries for today to calculate cumulative totals
    const currDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const startOfDay = `${currDate}T00:00:00`;
    const endOfDay = `${currDate}T23:59:59`;

    try {
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

        let target_hrs = 2; 
        if (response.Items && response.Items.length > 0) {
            target_hrs = response.Items[response.Items.length - 1].target_hrs || 2;
        }

        // 3. Evaluate if the day's targets are met
        if (cumulative_hrs_for_curr_date >= target_hrs && response.Items.length > 0) {

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

            console.log("Target reached. Repercussion Engine disarmed.");
            
            return res.status(200).json({
                isTargetMet: true,
                cumulativeHoursToday: cumulative_hrs_for_curr_date,
                target_hrs: target_hrs
            });
        }

        return res.status(200).json({
            isTargetMet: false,
            cumulativeHoursToday: cumulative_hrs_for_curr_date,
            target_hrs: target_hrs
        });

    } catch (e) {
        console.error("DynamoDB GetStatus Error:", e);
        return res.status(500).json({ error: "Internal Server Error", details: e.message });
    }
};


export const workLogger = async (req, res) => {
    const user_id = req.user.id;
    const { target_hrs, logged_hrs, algo, dev, office, notes } = req.body;

    const timestamp = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' }).replace(' ', 'T');

    try {
        const item = {
            user_id: user_id,
            timestamp: timestamp, 
            target_hrs: target_hrs || 0,
            logged_hrs: logged_hrs || 0,
            algo: algo || 0,
            dev: dev || 0,
            office: office || 0,
            isTargetMet: false, 
            notes: notes || ""
        };

        
        const command = new PutCommand({
            TableName: 'Daily-Work-Logger',
            Item: item
        });
        await docClient.send(command);

        return res.status(200).json({
            message: "Work state saved successfully.",
            item: item
        });

    } catch (e) {
        console.error("DynamoDB Process Error:", e);
        return res.status(500).json({
            error: "Failed to process work log cycle",
            details: e.message
        });
    }
};