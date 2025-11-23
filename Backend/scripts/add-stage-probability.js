// Script to add default_probability field to deal_stages table
const db = require('../db/connection');

async function addStageProbability() {
  try {
    console.log('Adding default_probability field to deal_stages table...');
    
    // Check if column already exists
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'deal_stages' 
      AND COLUMN_NAME = 'default_probability'
    `);
    
    if (columns.length === 0) {
      console.log('Adding default_probability column...');
      await db.query(`
        ALTER TABLE deal_stages 
        ADD COLUMN default_probability INT DEFAULT 0 
        CHECK (default_probability >= 0 AND default_probability <= 100)
      `);
      console.log('✅ default_probability column added');
    } else {
      console.log('ℹ️  default_probability column already exists');
    }
    
    // Update existing stages with typical probability values
    console.log('Updating existing stages with default probabilities...');
    await db.query("UPDATE deal_stages SET default_probability = 10 WHERE name = 'Lead'");
    await db.query("UPDATE deal_stages SET default_probability = 25 WHERE name = 'Qualified'");
    await db.query("UPDATE deal_stages SET default_probability = 50 WHERE name = 'Proposal'");
    await db.query("UPDATE deal_stages SET default_probability = 75 WHERE name = 'Negotiation'");
    await db.query("UPDATE deal_stages SET default_probability = 100 WHERE name = 'Won'");
    await db.query("UPDATE deal_stages SET default_probability = 0 WHERE name = 'Lost'");
    console.log('✅ Default probabilities updated for existing stages');
    
    console.log('\n✅ Migration complete!');
    
    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating schema:', error);
    await db.end();
    process.exit(1);
  }
}

addStageProbability();

