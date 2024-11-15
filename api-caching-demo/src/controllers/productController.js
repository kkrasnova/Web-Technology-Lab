const products = require('../data/products');
const CacheService = require('../services/cacheService');

const ProductController = {
    // Отримання всіх продуктів з Memory Cache
    async getAllProductsMemCache(req, res) {
        try {
            // Спроба отримати дані з кешу
            const cachedProducts = await CacheService.getFromMemoryCache('all_products');
            
            if (cachedProducts) {
                console.log('Повернення даних з Memory Cache');
                return res.json(cachedProducts);
            }

            // Якщо даних немає в кеші, отримуємо їх з "бази даних"
            console.log('Отримання даних з БД та збереження в Memory Cache');
            await CacheService.setToMemoryCache('all_products', products);
            
            res.json(products);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Отримання всіх продуктів з Redis Cache
    async getAllProductsRedis(req, res) {
        try {
            // Спроба отримати дані з Redis
            const cachedProducts = await CacheService.getFromRedis('all_products');
            
            if (cachedProducts) {
                console.log('Повернення даних з Redis Cache');
                return res.json(cachedProducts);
            }

            // Якщо даних немає в кеші, отримуємо їх з "бази даних"
            console.log('Отримання даних з БД та збереження в Redis');
            await CacheService.setToRedis('all_products', products);
            
            res.json(products);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = ProductController;