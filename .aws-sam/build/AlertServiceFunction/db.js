import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

// Multi-table names
const USERS_TABLE = process.env.USERS_TABLE || 'Users';
const CATEGORIES_TABLE = process.env.CATEGORIES_TABLE || 'Categories';
const TRANSACTIONS_TABLE = process.env.TRANSACTIONS_TABLE || 'Transactions';
const LIMITS_TABLE = process.env.LIMITS_TABLE || 'Limits';

export { 
    docClient, 
    USERS_TABLE, 
    CATEGORIES_TABLE, 
    TRANSACTIONS_TABLE, 
    LIMITS_TABLE, 
    PutCommand, 
    GetCommand, 
    QueryCommand, 
    UpdateCommand, 
    DeleteCommand,
    ScanCommand
};