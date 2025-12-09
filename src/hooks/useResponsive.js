import { useState, useEffect } from 'react';

const useResponsive = (breakpoint = 768) => {
    const [isMobileLayout, setIsMobileLayout] = useState(window.innerWidth <= breakpoint);
    const [isMobileDevice, setIsMobileDevice] = useState(false);

    useEffect(() => {
        // Check for layout on resize
        const handleResize = () => {
            setIsMobileLayout(window.innerWidth <= breakpoint);
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check

        // Check for mobile device
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const deviceCheck = 
            /android/i.test(userAgent) ||
            (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

        setIsMobileDevice(deviceCheck);

        // Cleanup listener
        return () => window.removeEventListener('resize', handleResize);
    }, [breakpoint]);

    return { isMobileLayout, isMobileDevice };
};

export default useResponsive;
