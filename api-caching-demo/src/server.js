const express = require('express');
const ProductController = require('./controllers/productController');

const app = express();
const port = 3000;

// Маршрути
app.get('/api/products/memcache', ProductController.getAllProductsMemCache);
app.get('/api/products/redis', ProductController.getAllProductsRedis);

// Запуск сервера
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});