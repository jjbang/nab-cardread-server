const { Pool } = require("pg");
const pool = new Pool();

module.exports = {
  query: (text, params, callback) => {
    return pool.query(text, params, (err, res) => {
      callback(err, res);
    });
  },
  getClient: (callback) => {
    pool.connect((err, client, done) => {
      const query = client.query;
      client.query = (...args) => {
        client.lastQuery = args;
        return query.apply(client, args);
      };
      const timeout = setTimeout(() => {
        console.error("A client has been checked out for more than 5 seconds!");
        console.error(
          `The last executed query on this client was: ${client.lastQuery}`
        );
      }, 5000);
      const release = (err) => {
        done(err);
        clearTimeout(timeout);
        client.query = query;
      };
      callback(err, client, release);
    });
  },
  async getClientAsync() {
    return pool.connect();
  },
};
