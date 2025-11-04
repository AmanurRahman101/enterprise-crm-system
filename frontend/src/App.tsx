import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';

function App() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Routes>
        <Route path="/" element={
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' }}>
            <h1>🚀 Tawasol CRM - Coming Soon</h1>
          </Box>
        } />
      </Routes>
    </Box>
  );
}

export default App;
