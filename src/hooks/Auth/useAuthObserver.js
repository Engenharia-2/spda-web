import { useState, useEffect } from 'react';
import { auth, db } from '../../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { AuthService } from '../../services/AuthService';

export const useAuthObserver = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists() && userDoc.data().status === 'approved') {
                        const userData = userDoc.data();
                        const isAdmin = userData.role === 'admin';

                        setCurrentUser({
                            ...user,
                            subscription: userData.subscription || 'free',
                            role: isAdmin ? 'admin' : (userData.role || 'user'),
                            isPro: userData.subscription === 'pro',
                            storage_usage_bytes: userData.storage_usage_bytes || 0, // Add this line
                        });
                    } else {
                        // Add small delay to avoid race condition with signup process
                        // This gives signup time to complete Firestore document creation
                        setTimeout(async () => {
                            await AuthService.logout();
                            setCurrentUser(null);
                        }, 2000);
                    }
                } catch (error) {
                    console.error('Error verifying user status:', error);
                    setCurrentUser(null);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    return { currentUser, loading };
};
