const pgp = require("pg-promise")({});

const cn = {
  host: "10.0.0.26",
  port: 5432,
  database: "fleitner",
  user: "fleitner",
};

const db = pgp(cn);

module.exports = db;
