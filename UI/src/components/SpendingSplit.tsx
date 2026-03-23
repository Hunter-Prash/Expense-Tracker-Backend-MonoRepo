import axios from 'axios';
import React, { useEffect } from 'react'
import { useAuth } from '../AuthContext';

const SpendingSplit = () => {
    const API_BASE = 'https://0ao6yod173.execute-api.ap-south-1.amazonaws.com/prod/query/api/v1';
    const {token}=useAuth()

   
    const ALERT_API_BASE = 'https://0ao6yod173.execute-api.ap-south-1.amazonaws.com/prod/alert/api/v1';

    return (
        <div>

        </div>
    )
}

export default SpendingSplit
