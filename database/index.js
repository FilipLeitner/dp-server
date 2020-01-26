const pgp = require("pg-promise")({});

const cn = {
  host: "localhost",
  port: 5432,
  database: "dp-app",
  user: "postgres",
  password: "postgres"
};

const db = pgp(cn);

module.exports = db;
