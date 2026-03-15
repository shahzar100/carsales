/**
 * Mock for @/backend/mongodb
 *
 * Provides a lazy "thenable" clientPromise that defers connection
 * until first awaited, ensuring process.env.MONGODB_URI is available
 * (set by jest.setup.js beforeAll after MongoMemoryServer starts).
 */
const { MongoClient } = require("mongodb");

let client = null;
let clientPromise = null;

function getClientPromise() {
  if (!clientPromise) {
    client = new MongoClient(process.env.MONGODB_URI);
    clientPromise = client.connect();
  }
  return clientPromise;
}

// A thenable object: when `await`ed, it lazily connects.
const lazyClientPromise = {
  then(onFulfilled, onRejected) {
    return getClientPromise().then(onFulfilled, onRejected);
  },
  catch(onRejected) {
    return getClientPromise().catch(onRejected);
  },
};

module.exports = {
  __esModule: true,
  default: lazyClientPromise,
};
