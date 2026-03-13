import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

const SessionTimeout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const lastActivityTimeRef = useRef(Date.now());

    useEffect(() => {
        // Skip tracking on login page
        if (location.pathname === '/login' || location.pathname === '/') {
            return;
        }

        const updateActivity = () => {
            lastActivityTimeRef.current = Date.now();
        };

        const checkTimeout = () => {
            const currentTime = Date.now();
            const timeSinceLastActivity = currentTime - lastActivityTimeRef.current;

            if (timeSinceLastActivity >= TIMEOUT_MS) {
                // Logout the user
                const isAuth = localStorage.getItem('isAuthenticated') === 'true' || 
                               sessionStorage.getItem('isAuthenticated') === 'true';

                if (isAuth) {
                    localStorage.removeItem('isAuthenticated');
                    localStorage.removeItem('user');
                    sessionStorage.removeItem('isAuthenticated');
                    sessionStorage.removeItem('user');
                    navigate('/login');
                }
            }
        };

        // Track user activity
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => {
            window.addEventListener(event, updateActivity, { passive: true });
        });

        // Check timeout every 5 minutes (or 1 minute)
        const checkInterval = setInterval(checkTimeout, 60 * 1000); 

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, updateActivity);
            });
            clearInterval(checkInterval);
        };
    }, [navigate, location.pathname]);

    return null;
};

export default SessionTimeout;
