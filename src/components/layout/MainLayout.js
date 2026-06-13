import React from 'react';
import Sidebar from './Sidebar';
import { Box } from '@mui/material';

export default function MainLayout({ children }) {
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: { md: '2px' },
          pt: { xs: '64px', md: '56px' },
          minHeight: '100vh',
          backgroundColor: 'background.default',
          transition: 'margin-left 0.3s ease',
          px: { xs: 2, md: 0 },
          py: { xs: 2, md: 7 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}