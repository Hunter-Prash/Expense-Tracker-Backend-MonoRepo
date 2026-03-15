import { docClient, TRANSACTIONS_TABLE, LIMITS_TABLE, QueryCommand, GetCommand } from './db.js';

export const eventhandler = async (event) => {
    console.log("Received EventBridge event:", JSON.stringify(event, null, 2));

    const detail = event.detail || {};
    const amount = Number(detail.transaction?.amount || 0);
    const user_id = detail.transaction?.user_id;

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
    if (amount > limits.daily_limit) {
        //do something**PUBLISH TO SNS TOPIC LATE..
        //for now concole.log()

        console.log('DAily threshold breach')
    }
    console.log('---------Daily Calc Ended---------------')
    
    
    console.log('-----------Weekly calc started-----------')
        const formatShiftedIST = (dateObj) => {
            const pad = (value, length = 2) => String(value).padStart(length, '0');
            return `${dateObj.getUTCFullYear()}-${pad(dateObj.getUTCMonth() + 1)}-${pad(dateObj.getUTCDate())}T${pad(dateObj.getUTCHours())}:${pad(dateObj.getUTCMinutes())}:${pad(dateObj.getUTCSeconds())}.${pad(dateObj.getUTCMilliseconds(), 3)}+05:30`;
        };

        //get the latest monday 
        const now = new Date();
        const istNow = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
        const daysSinceMonday = (istNow.getUTCDay() + 6) % 7;
        const latestMondayIST = new Date(istNow);
        latestMondayIST.setUTCDate(istNow.getUTCDate() - daysSinceMonday);
        latestMondayIST.setUTCHours(0, 0, 0, 0);

        const weekStart = formatShiftedIST(latestMondayIST);
        const weekEnd = formatShiftedIST(istNow);

        console.log(`WeekStartDate= ${weekStart} ,  Weekend/Current Date=${weekEnd}`)

         //get the  all transactions starting from monday to current
    const weeklySum=await docClient.send(new QueryCommand({
        TableName:TRANSACTIONS_TABLE,
        KeyConditionExpression:'user_id = :user_id AND transaction_date BETWEEN :weekStart AND :weekEnd',
        FilterExpression:'#t = :type',
        ExpressionAttributeNames: { '#t': 'type' },
        ExpressionAttributeValues: {
                ':user_id': user_id,
                ':weekStart': weekStart,
                ':weekEnd': weekEnd,
                ':type': 'expense'
            }
    }))
        console.log(weeklySum.Items)

     const weeklyExpenseTotal = (weeklySum.Items || []).reduce((sum, txn) => sum + Number(txn.amount || 0), 0);

     if(weeklyExpenseTotal > Number(limits.weekly_limit || 0)){
        console.log('weekily threshold breach')}

        console.log('-----------Weekly calc ended-----------')


    //HANDLE MONTHLY SUM ;LATER

    return { statusCode: 200, body: JSON.stringify({ message: 'Processed' }) };
}
