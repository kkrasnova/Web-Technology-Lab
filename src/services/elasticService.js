const { Client } = require('@elastic/elasticsearch');

const client = new Client({
    node: 'http://localhost:9200'
});

const ElasticService = {
    // Ініціалізація індексу та додавання даних
    async initializeIndex(products) {
        try {
            // Перевірка існування індексу
            const indexExists = await client.indices.exists({
                index: 'products'
            });

            // Якщо індекс існує - видаляємо його
            if (indexExists) {
                await client.indices.delete({ index: 'products' });
            }

            // Створюємо новий індекс
            await client.indices.create({
                index: 'products',
                body: {
                    mappings: {
                        properties: {
                            name: { type: 'text' },
                            description: { type: 'text' },
                            category: { type: 'keyword' },
                            price: { type: 'float' }
                        }
                    }
                }
            });

            // Додаємо документи до індексу
            const operations = products.flatMap(doc => [
                { index: { _index: 'products' } },
                doc
            ]);

            await client.bulk({ refresh: true, operations });
            console.log('Індекс успішно створено та наповнено даними');
        } catch (error) {
            console.error('Помилка при ініціалізації індексу:', error);
            throw error;
        }
    },

    // Пошук продуктів
    async searchProducts(query) {
        try {
            const { body } = await client.search({
                index: 'products',
                body: {
                    query: {
                        multi_match: {
                            query: query,
                            fields: ['name', 'description', 'category']
                        }
                    }
                }
            });

            return body.hits.hits.map(hit => ({
                ...hit._source,
                score: hit._score
            }));
        } catch (error) {
            console.error('Помилка при пошуку:', error);
            throw error;
        }
    },

    // Фільтрація за категорією
    async filterByCategory(category) {
        try {
            const { body } = await client.search({
                index: 'products',
                body: {
                    query: {
                        term: {
                            category: category
                        }
                    }
                }
            });

            return body.hits.hits.map(hit => hit._source);
        } catch (error) {
            console.error('Помилка при фільтрації:', error);
            throw error;
        }
    }
};

module.exports = ElasticService;