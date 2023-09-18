const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('company.db');

db.serialize(() => {
  // Create the tables if they don't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY,
      name TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY,
      title TEXT,
      salary REAL,
      department_id INTEGER,
      FOREIGN KEY (department_id) REFERENCES departments (id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      role_id INTEGER,
      manager_id INTEGER,
      FOREIGN KEY (role_id) REFERENCES roles (id),
      FOREIGN KEY (manager_id) REFERENCES employees (id)
    )
  `);
});

module.exports = db;
