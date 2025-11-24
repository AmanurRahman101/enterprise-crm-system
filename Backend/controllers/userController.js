// User Controller
const db = require('../db/connection');

// Get all users (for assignment dropdowns, etc.)
const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT id, email, full_name as name, phone, user_type
       FROM users
       ORDER BY full_name ASC`
    );

    res.status(200).json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        name: user.full_name || user.email,
        email: user.email,
        phone: user.phone,
        userType: user.user_type
      }))
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users.',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers
};
