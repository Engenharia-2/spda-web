import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

/**
 * Hook customizado para gerenciar a lógica de negócio do UserManagement
 * Encapsula estado e handlers para operações com usuários
 */
const useUserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    /**
     * Busca todos os usuários do Firestore
     */
    const fetchUsers = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'users'));
            const usersList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(usersList);
        } catch (error) {
            console.error("Error fetching users:", error);
            alert("Erro ao carregar usuários.");
        } finally {
            setLoading(false);
        }
    };

    /**
     * Atualiza o status de um usuário (approved/pending)
     * @param {string} userId - ID do usuário
     * @param {string} newStatus - Novo status
     */
    const handleStatusChange = async (userId, newStatus) => {
        try {
            await updateDoc(doc(db, 'users', userId), { status: newStatus });
            setUsers(prev => prev.map(user =>
                user.id === userId ? { ...user, status: newStatus } : user
            ));
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Erro ao atualizar status.");
        }
    };

    /**
     * Atualiza o plano de assinatura de um usuário
     * @param {string} userId - ID do usuário
     * @param {string} newPlan - Novo plano (free/pro)
     */
    const handleSubscriptionChange = async (userId, newPlan) => {
        try {
            await updateDoc(doc(db, 'users', userId), { subscription: newPlan });
            setUsers(prev => prev.map(user =>
                user.id === userId ? { ...user, subscription: newPlan } : user
            ));
        } catch (error) {
            console.error("Error updating subscription:", error);
            alert("Erro ao atualizar plano.");
        }
    };

    /**
     * Atualiza o nível de acesso de um usuário (user/admin)
     * @param {string} userId - ID do usuário
     * @param {string} newRole - Novo nível de acesso
     */
    const handleRoleChange = async (userId, newRole) => {
        if (window.confirm(`Tem certeza que deseja alterar o nível de acesso deste usuário para ${newRole}?`)) {
            try {
                await updateDoc(doc(db, 'users', userId), { role: newRole });
                setUsers(prev => prev.map(user =>
                    user.id === userId ? { ...user, role: newRole } : user
                ));
            } catch (error) {
                console.error("Error updating role:", error);
                alert("Erro ao atualizar nível de acesso.");
            }
        }
    };

    return {
        users,
        loading,
        handleStatusChange,
        handleSubscriptionChange,
        handleRoleChange
    };
};

export default useUserManagement;
