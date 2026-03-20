import { docClient, TRANSACTIONS_TABLE, LIMITS_TABLE, QueryCommand, GetCommand, UpdateCommand } from './db.js';
import {
  SNSClient,
  PublishCommand
} from "@aws-sdk/client-sns";


async function sendToSNS(mssg) {
    try {
        const client = new SNSClient({
            region: 'ap-south-1'
        })
        let topic_arn = 'arn:aws:sns:ap-south-1:345594574524:Expense-Breach-Alert'
        const command = new PublishCommand({
            Message: mssg,
            TopicArn: topic_arn
        })
        const response = await client.send(command)
        console.log(`Message successfully sent to subscribers. MessageId=${response.MessageId}`)
    } catch (err) {
        console.error('Failed to publish SNS alert:', err)
    }

}


export const eventhandler = async (event) => {
    console.log("Received EventBridge event:", JSON.stringify(event, null, 2));

    const detail = event.detail || {};
    const user_id = detail.transaction?.user_id;
    const formatShiftedIST = (dateObj) => {
        const pad = (value, length = 2) => String(value).padStart(length, '0');
        return `${dateObj.getUTCFullYear()}-${pad(dateObj.getUTCMonth() + 1)}-${pad(dateObj.getUTCDate())}T${pad(dateObj.getUTCHours())}:${pad(dateObj.getUTCMinutes())}:${pad(dateObj.getUTCSeconds())}.${pad(dateObj.getUTCMilliseconds(), 3)}+05:30`;
    };
    const now = new Date();
    const istNow = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));

    //get the limits values
    const result = await docClient.send(new GetCommand({
        TableName: LIMITS_TABLE,
        Key: { user_id: user_id }
    }));

    const limits = result.Item;
    if (!limits) {
        console.log("No limits found for user:", user_id);
        return { statusCode: 200, body: JSON.stringify({ limits: { daily_limit: null, weekly_limit: null, monthly_limit: null } }) };
    }

    console.log('---------Daily Calc Started---------------')
    const startOfCurrentDayIST = new Date(istNow);
    startOfCurrentDayIST.setUTCHours(0, 0, 0, 0);
    const currentDayStart = formatShiftedIST(startOfCurrentDayIST);
    const currentDayNow = formatShiftedIST(istNow);
    console.log(`CurrentDayStart= ${currentDayStart} , CurrentDayNow=${currentDayNow}`)

    const dailySum = await docClient.send(new QueryCommand({
        TableName: TRANSACTIONS_TABLE,
        KeyConditionExpression: 'user_id = :user_id AND transaction_date BETWEEN :currentDayStart AND :currentDayNow',
        FilterExpression: '#t = :type',
        ExpressionAttributeNames: { '#t': 'type' },
        ExpressionAttributeValues: {
            ':user_id': user_id,
            ':currentDayStart': currentDayStart,
            ':currentDayNow': currentDayNow,
            ':type': 'expense'
        }
    }))

    const dailyExpenseTotal = (dailySum.Items || []).reduce((sum, txn) => sum + Number(txn.amount || 0), 0);
    const isDailyBreached = dailyExpenseTotal > Number(limits.daily_limit || 0);
    if (isDailyBreached) {
        await sendToSNS(`Daily threshold breached for user ${user_id}. daily_total=${dailyExpenseTotal}, daily_limit=${limits.daily_limit}`)

        console.log('DAily threshold breach')
    }
    console.log('---------Daily Calc Ended---------------')
    
    
    console.log('-----------Weekly calc started-----------')
        //get the latest monday 
        const daysSinceMonday = (istNow.getUTCDay() + 6) % 7;
        const latestMondayIST = new Date(istNow);
        latestMondayIST.setUTCDate(istNow.getUTCDate() - daysSinceMonday);
        latestMondayIST.setUTCHours(0, 0, 0, 0);

        const currentWeekStart = formatShiftedIST(latestMondayIST);
        const currentWeekNow = formatShiftedIST(istNow);

        console.log(`CurrentWeekStart= ${currentWeekStart} , CurrentWeekNow=${currentWeekNow}`)

         //get the  all transactions starting from monday to current
    const weeklySum=await docClient.send(new QueryCommand({
        TableName:TRANSACTIONS_TABLE,
        KeyConditionExpression:'user_id = :user_id AND transaction_date BETWEEN :currentWeekStart AND :currentWeekNow',
        FilterExpression:'#t = :type',
        ExpressionAttributeNames: { '#t': 'type' },
        ExpressionAttributeValues: {
                ':user_id': user_id,
                ':currentWeekStart': currentWeekStart,
                ':currentWeekNow': currentWeekNow,
                ':type': 'expense'
            }
    }))
        console.log(weeklySum.Items)

     const weeklyExpenseTotal = (weeklySum.Items || []).reduce((sum, txn) => sum + Number(txn.amount || 0), 0);

     const isWeeklyBreached = weeklyExpenseTotal > Number(limits.weekly_limit || 0);
     if(isWeeklyBreached){
        await sendToSNS(`Weekly threshold breached for user ${user_id}. weekly_total=${weeklyExpenseTotal}, weekly_limit=${limits.weekly_limit}`)
        console.log('weekily threshold breach')}

        console.log('-----------Weekly calc ended-----------')


    console.log('-----------Monthly calc started-----------')
    const firstDayOfCurrentMonthIST = new Date(istNow);
    firstDayOfCurrentMonthIST.setUTCDate(1);
    firstDayOfCurrentMonthIST.setUTCHours(0, 0, 0, 0);

    const currentMonthStart = formatShiftedIST(firstDayOfCurrentMonthIST);
    const currentMonthNow = formatShiftedIST(istNow);

    console.log(`CurrentMonthStart= ${currentMonthStart} , CurrentMonthNow=${currentMonthNow}`)

    const monthlySum = await docClient.send(new QueryCommand({
        TableName: TRANSACTIONS_TABLE,
        KeyConditionExpression: 'user_id = :user_id AND transaction_date BETWEEN :currentMonthStart AND :currentMonthNow',
        FilterExpression: '#t = :type',
        ExpressionAttributeNames: { '#t': 'type' },
        ExpressionAttributeValues: {
            ':user_id': user_id,
            ':currentMonthStart': currentMonthStart,
            ':currentMonthNow': currentMonthNow,
            ':type': 'expense'
        }
    }))

    const monthlyExpenseTotal = (monthlySum.Items || []).reduce((sum, txn) => sum + Number(txn.amount || 0), 0);

    const isMonthlyBreached = monthlyExpenseTotal > Number(limits.monthly_limit || 0);
    if (isMonthlyBreached) {
        await sendToSNS(`Monthly threshold breached for user ${user_id}. monthly_total=${monthlyExpenseTotal}, monthly_limit=${limits.monthly_limit}`)
        console.log('monthly threshold breach')
    }

    console.log('-----------Monthly calc ended-----------')

    await docClient.send(new UpdateCommand({
        TableName: LIMITS_TABLE,
        Key: { user_id },
        UpdateExpression: 'SET daily_breached = :daily_breached, weekly_breached = :weekly_breached, monthly_breached = :monthly_breached',
        ExpressionAttributeValues: {
            ':daily_breached': isDailyBreached,
            ':weekly_breached': isWeeklyBreached,
            ':monthly_breached': isMonthlyBreached
        }
    }))

    return { statusCode: 200, body: JSON.stringify({ message: 'Processed' }) };
}
