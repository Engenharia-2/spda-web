import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Custom hook to manage unsaved changes warnings.
 * Handles both in-app navigation blocking (React Router) and browser navigation (beforeunload).
 * 
 * @param {boolean} isDirty - Indicates if there are unsaved changes
 * @returns {object} - Contains the blocker object from React Router
 */
export const useUnsavedChanges = (isDirty) => {
    // React Router Blocker (prevents navigation within the app)
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && currentLocation.pathname !== nextLocation.pathname
    );

    // Handle blocked navigation with confirmation dialog
    useEffect(() => {
        if (blocker.state === "blocked") {
            const confirmLeave = window.confirm(
                "Você tem alterações não salvas. Deseja sair sem salvar?"
            );
            if (confirmLeave) {
                blocker.proceed();
            } else {
                blocker.reset();
            }
        }
    }, [blocker]);

    // Handle browser navigation/refresh with beforeunload event
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = ''; // Trigger browser built-in dialog
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    return { blocker };
};
