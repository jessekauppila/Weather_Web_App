// seed.js
require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');
const fs = require('fs');

async function seedDatabase() {
  try {
    // Read the SQL file
    const seedSQL = fs.readFileSync('seed.sql', 'utf8');

    // Split the SQL into individual statements
    const statements = seedSQL
      .split(';')
      .filter((stmt) => stmt.trim() !== '');

    // Execute each statement
    for (let statement of statements) {
      try {
        await sql.query(statement);
        console.log('Executed statement successfully');
      } catch (error) {
        console.error('Error executing statement:', error);
        console.error('Statement:', statement);
      }
    }

    console.log('Database seeding completed');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDatabase();
