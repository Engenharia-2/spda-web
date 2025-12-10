import React, { useState } from 'react';
import { useEquipmentSettings } from '../../../hooks/Settings/ReportData/useEquipmentSettings';
import EquipmentList from './EquipmentList';
import EquipmentForm from './EquipmentForm';
import './styles.css';

const EquipmentSettings = ({ hookData }) => {
    const ownHook = useEquipmentSettings();

    // Allow hook injection for testing or parent control, otherwise use internal hook
    const {
        equipmentList,
        loading,
        handleAdd,
        handleUpdate,
        handleDelete,
        handleSetDefault
    } = hookData || ownHook;

    const [isEditing, setIsEditing] = useState(false);
    const [currentEquipment, setCurrentEquipment] = useState(null);

    const handleOpenForm = (equipment = null) => {
        setCurrentEquipment(equipment);
        setIsEditing(true);
    };

    const handleCloseForm = () => {
        setCurrentEquipment(null);
        setIsEditing(false);
    };

    const handleFormSubmit = (data) => {
        if (currentEquipment) {
            handleUpdate(currentEquipment.id, data);
        } else {
            handleAdd(data);
        }
        handleCloseForm();
    };

    if (loading) return <div>Carregando configurações de equipamento...</div>;

    if (isEditing) {
        return (
            <EquipmentForm
                initialData={currentEquipment}
                onSubmit={handleFormSubmit}
                onCancel={handleCloseForm}
            />
        );
    }

    return (
        <EquipmentList
            equipmentList={equipmentList}
            onAdd={() => handleOpenForm(null)}
            onEdit={handleOpenForm}
            onDelete={handleDelete}
            onSetDefault={handleSetDefault}
        />
    );
};

export default EquipmentSettings;
