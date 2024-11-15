const ElasticService = require('../services/elasticService');

const SearchController = {
    // Пошук продуктів
    async searchProducts(req, res) {
        try {
            const { query } = req.query;
            if (!query) {
                return res.status(400).json({ error: 'Query parameter is required' });
            }

            const results = await ElasticService.searchProducts(query);
            res.json(results);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Фільтрація за категорією
    async filterByCategory(req, res) {
        try {
            const { category } = req.params;
            if (!category) {
                return res.status(400).json({ error: 'Category parameter is required' });
            }

            const results = await ElasticService.filterByCategory(category);
            res.json(results);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = SearchController;