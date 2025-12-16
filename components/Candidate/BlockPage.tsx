// BlockedPage.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BlockedPage: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect to signup after 5 seconds
        const timer = setTimeout(() => {
            navigate('/signup');
        }, 5000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh', 
            textAlign: 'center',
            background: '#ffe6e6',
            color: '#cc0000'
        }}>
            <h1>You are blocked by the admin</h1>
            <p>Please register with a different email to continue.</p>
            <p>Redirecting to signup...</p>
        </div>
    );
};

export default BlockedPage;
