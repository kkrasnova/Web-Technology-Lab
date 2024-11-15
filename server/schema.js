const { makeExecutableSchema } = require('@graphql-tools/schema');

const typeDefs = `
  type CryptoPrice {
    bitcoin: Float!
    ethereum: Float!
    timestamp: String!
  }

  type Query {
    getCryptoPrices: CryptoPrice!
    getBitcoinPrice: Float!
    getEthereumPrice: Float!
  }

  type Subscription {
    priceUpdates: CryptoPrice!
  }
`;

// Зберігаємо останні ціни в пам'яті
let latestPrices = {
    bitcoin: 0,
    ethereum: 0,
    timestamp: new Date().toISOString()
};

const resolvers = {
    Query: {
        getCryptoPrices: () => latestPrices,
        getBitcoinPrice: () => latestPrices.bitcoin,
        getEthereumPrice: () => latestPrices.ethereum
    }
};

const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
});

module.exports = { schema, latestPrices };