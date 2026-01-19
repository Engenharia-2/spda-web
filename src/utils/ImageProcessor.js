import imageCompression from 'browser-image-compression';
import { LocalStorageService } from '../services/LocalStorageService';

/**
 * Comprime uma imagem usando as configurações padrão do aplicativo.
 * @param {File} file O arquivo de imagem a ser comprimido.
 * @returns {Promise<File>} O arquivo de imagem comprimido.
 */
export const compressImage = async (file) => {
    console.log(`[ImageProcessor] compressImage chamado para: ${file.name}`);
    console.log(`[ImageProcessor] Tamanho original: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
    };

    try {
        const compressedFile = await imageCompression(file, options);
        console.log(`[ImageProcessor] Tamanho comprimido: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
        return compressedFile;
    } catch (error) {
        console.error('[ImageProcessor] Erro durante a compressão, retornando arquivo original.', error);
        return file; // Retorna o arquivo original em caso de falha
    }
};

/**
 * Resolve uma URL de imagem, especialmente para o esquema 'local-image://'.
 * @param {string} url A URL da imagem a ser resolvida.
 * @returns {Promise<string>} A URL resolvida (pode ser uma blob URL ou a original).
 */
export const resolveImageUrl = async (url) => {
    console.log(`[ImageProcessor] resolveImageUrl chamado com URL: ${url}`);
    if (url && url.startsWith('local-image://')) {
        console.log('[ImageProcessor] Esquema local-image detectado, delegando para LocalStorageService.');
        return await LocalStorageService.resolveImageUrl(url);
    }
    console.log('[ImageProcessor] URL não é um esquema local, retornando URL original.');
    return url;
};
