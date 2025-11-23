// Script to update deal_stages table schema
// Removes UNIQUE constraint from name column and adds regular index

const db = require('../db/connection');

async function updateSchema() {
  try {
    console.log('Updating deal_stages schema...');
    
    // Check if the unique constraint exists
    const [indexes] = await db.query(`
      SELECT INDEX_NAME, NON_UNIQUE 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'deal_stages' 
      AND COLUMN_NAME = 'name'
    `);
    
    console.log('Current indexes on name column:', indexes);
    
    // Drop the unique constraint/index if it exists
    const uniqueIndex = indexes.find(idx => idx.NON_UNIQUE === 0);
    if (uniqueIndex) {
      console.log(`Dropping unique index: ${uniqueIndex.INDEX_NAME}`);
      await db.query(`ALTER TABLE deal_stages DROP INDEX ${uniqueIndex.INDEX_NAME}`);
      console.log('✅ Unique constraint removed');
    } else {
      console.log('ℹ️  No unique constraint found on name column');
    }
    
    // Check if regular index already exists
    const regularIndex = indexes.find(idx => idx.NON_UNIQUE === 1 && idx.INDEX_NAME === 'idx_name');
    if (!regularIndex) {
      console.log('Adding regular index: idx_name');
      await db.query('ALTER TABLE deal_stages ADD INDEX idx_name (name)');
      console.log('✅ Regular index added');
    } else {
      console.log('ℹ️  Regular index idx_name already exists');
    }
    
    // Verify the changes
    const [finalIndexes] = await db.query(`
      SELECT INDEX_NAME, NON_UNIQUE 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'deal_stages' 
      AND COLUMN_NAME = 'name'
    `);
    
    console.log('\n✅ Schema update complete!');
    console.log('Final indexes on name column:', finalIndexes);
    
    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating schema:', error);
    await db.end();
    process.exit(1);
  }
}

updateSchema();

