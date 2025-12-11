import { useState, useEffect } from 'react';

const defaultFormState = {
    equipmentName: '',
    serialNumber: '',
    calibrationDate: '',
    calibrationValidity: ''
};

/**
 * Custom hook for managing equipment form state
 * Handles form data, synchronization with initial data, and form submission
 * @param {Object} initialData - Initial form data for editing (optional)
 * @param {Function} onSubmit - Callback function when form is submitted
 * @returns {Object} Form state and handlers
 */
export const useEquipmentForm = (initialData, onSubmit) => {
    const [formData, setFormData] = useState(defaultFormState);

    // Sync with initialData when editing
    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData(defaultFormState);
        }
    }, [initialData]);

    /**
     * Handle input changes
     * @param {Event} e - Input change event
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    /**
     * Handle form submission
     * @param {Event} e - Form submit event
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    /**
     * Reset form to default state
     */
    const resetForm = () => {
        setFormData(defaultFormState);
    };

    return {
        formData,
        handleChange,
        handleSubmit,
        resetForm
    };
};
