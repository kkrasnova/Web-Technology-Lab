const express = require('express');
const FileController = require('./controllers/fileController');

const app = express();
const port = process.env.PORT || 3000;

// Маршрути для роботи з файлами
app.post('/api/upload', 
    FileController.uploadMiddleware, 
    FileController.uploadFile
);

app.get('/api/files', FileController.listFiles);

app.delete('/api/files/:blobName', FileController.deleteFile);

// Базовий HTML для тестування
app.get('/', (req, res) => {
    res.send(`
        <html>
            <body>
                <h2>Upload File to Azure Blob Storage</h2>
                <form action="/api/upload" method="post" enctype="multipart/form-data">
                    <input type="file" name="file" required>
                    <button type="submit">Upload</button>
                </form>
            </body>
        </html>
    `);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});