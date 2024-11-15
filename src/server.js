const express = require('express');
const SearchController = require('./controllers/searchController');
const ElasticService = require('./services/elasticService');
const products = require('./data/products');

const app = express();
const port = 3000;

// Ініціалізація даних при запуску
(async () => {
    try {
        await ElasticService.initializeIndex(products);
    } catch (error) {
        console.error('Failed to initialize Elasticsearch:', error);
    }
})();

// Маршрути
app.get('/api/search', SearchController.searchProducts);
app.get('/api/category/:category', SearchController.filterByCategory);

// Запуск сервера
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});