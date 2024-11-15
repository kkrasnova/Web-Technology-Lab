const blobService = require('../services/blobService');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const FileController = {
    uploadMiddleware: upload.single('file'),

    async uploadFile(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const result = await blobService.uploadFile(req.file);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async listFiles(req, res) {
        try {
            const files = await blobService.listFiles();
            res.json(files);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async deleteFile(req, res) {
        try {
            const { blobName } = req.params;
            await blobService.deleteFile(blobName);
            res.json({ message: 'File deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = FileController;