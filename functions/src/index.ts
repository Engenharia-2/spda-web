import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

// Inicializa o Admin SDK
admin.initializeApp();
const db = admin.firestore();

/**
 * Função auxiliar para extrair o userId e validar o caminho
 * Suporta:
 * - reports/{userId}/...
 * - settings/{userId}/...
 */
function extractUserIdFromPath(filePath: string): string | null {
    const parts = filePath.split('/');
    
    // Verifica se tem profundidade suficiente (pasta/userId/arquivo...)
    if (parts.length < 2) return null;

    const rootFolder = parts[0];
    const userId = parts[1];

    if ((rootFolder === 'reports' || rootFolder === 'settings') && userId) {
        return userId;
    }
    
    return null;
}

// v1 usa functions.storage.object().onFinalize
export const trackStorageUpload = functions.storage.object().onFinalize(async (object: functions.storage.ObjectMetadata) => {
    if (!object || !object.name) return;

    const userId = extractUserIdFromPath(object.name);
    
    if (userId) {
        const fileSize = Number(object.size);
        const userRef = db.collection("users").doc(userId);

        try {
            await userRef.set({
                storage_usage_bytes: admin.firestore.FieldValue.increment(fileSize),
                storage_updated_at: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log(`✅ [Upload v1] Usuário ${userId} +${fileSize} bytes. (Path: ${object.name})`);
        } catch (error) {
            console.error("❌ Erro ao atualizar Firestore:", error);
        }
    } else {
        console.log(`ℹ️ [Upload v1] Ignorado: ${object.name} (Fora de reports/ ou settings/)`);
    }
});

// v1 usa functions.storage.object().onDelete
export const trackStorageDelete = functions.storage.object().onDelete(async (object: functions.storage.ObjectMetadata) => {
    if (!object || !object.name) return;

    const userId = extractUserIdFromPath(object.name);

    if (userId) {
        const fileSize = Number(object.size);
        const userRef = db.collection("users").doc(userId);

        try {
            await userRef.update({
                storage_usage_bytes: admin.firestore.FieldValue.increment(-fileSize)
            });
            console.log(`✅ [Delete v1] Usuário ${userId} -${fileSize} bytes. (Path: ${object.name})`);
        } catch (error) {
            console.error("❌ Erro ao subtrair do Firestore:", error);
        }
    }
});