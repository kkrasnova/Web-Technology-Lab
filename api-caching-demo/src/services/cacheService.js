const NodeCache = require('node-cache');
const Redis = require('redis');

// Memory Cache
const memoryCache = new NodeCache({ stdTTL: 60 }); // час життя кешу 60 секунд

// Redis Client
const redisClient = Redis.createClient();

redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Підключаємось до Redis
(async () => {
    await redisClient.connect();
})();

const CacheService = {
    // Memory Cache методи
    async getFromMemoryCache(key) {
        return memoryCache.get(key);
    },

    async setToMemoryCache(key, data) {
        return memoryCache.set(key, data);
    },

    // Redis методи
    async getFromRedis(key) {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    },

    async setToRedis(key, data) {
        await redisClient.set(key, JSON.stringify(data), {
            EX: 60 // час життя кешу 60 секунд
        });
    }
};

module.exports = CacheService;