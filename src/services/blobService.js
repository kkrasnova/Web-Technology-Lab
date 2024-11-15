const { BlobServiceClient } = require('@azure/storage-blob');
const config = require('../config/azure');

class BlobService {
    constructor() {
        this.blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionString);
        this.containerClient = this.blobServiceClient.getContainerClient(config.containerName);
    }

    async uploadFile(file) {
        try {
            const blobName = `${Date.now()}-${file.originalname}`;
            const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
            
            await blockBlobClient.uploadData(file.buffer, {
                blobHTTPHeaders: { blobContentType: file.mimetype }
            });

            return {
                url: blockBlobClient.url,
                name: blobName
            };
        } catch (error) {
            console.error('Error uploading to blob storage:', error);
            throw error;
        }
    }

    async listFiles() {
        const files = [];
        for await (const blob of this.containerClient.listBlobsFlat()) {
            files.push({
                name: blob.name,
                url: `${this.containerClient.url}/${blob.name}`,
                contentType: blob.properties.contentType,
                size: blob.properties.contentLength
            });
        }
        return files;
    }

    async deleteFile(blobName) {
        try {
            const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
            await blockBlobClient.delete();
            return true;
        } catch (error) {
            console.error('Error deleting from blob storage:', error);
            throw error;
        }
    }
}

module.exports = new BlobService();