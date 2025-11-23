// Script to delete all existing deals
const db = require('../db/connection');

async function deleteAllDeals() {
  try {
    console.log('Deleting all deals...');
    const [result] = await db.query('DELETE FROM deals');
    console.log(`✅ Deleted ${result.affectedRows} deals`);
    
    // Close connection
    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting deals:', error);
    await db.end();
    process.exit(1);
  }
}

deleteAllDeals();

