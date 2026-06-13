import { createTheme } from '@mui/material/styles';

export const getTheme = (mode, customColors = {}) => {
  const lightBase = {
    primary: '#4A76A8',
    secondary: '#7A9BCB',
    background: '#EDEEF0',
    paper: '#FFFFFF',
    text: '#000000',
  };
  const darkBase = {
    primary: '#6A8DB5',
    secondary: '#8DA6CE',
    background: '#1A1A1C',
    paper: '#232324',
    text: '#E1E1E1',
  };
  const base = mode === 'dark' ? darkBase : lightBase;
  const primary = customColors?.primary?.trim() || base.primary;
  const secondary = customColors?.secondary?.trim() || base.secondary;

  return createTheme({
    palette: {
      mode,
      primary: { main: primary },
      secondary: { main: secondary },
      background: { default: base.background, paper: base.paper },
      text: { primary: base.text },
    },
    typography: {
      fontFamily: '"Inter", "Nunito", "Roboto", sans-serif',
      h4: { fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.2 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      body1: { fontSize: '0.95rem' },
      body2: { fontSize: '0.85rem' },
    },
    shape: { borderRadius: 10 },            // лаконичные скругления
    shadows: [
      'none',
      '0px 4px 12px rgba(0,0,0,0.05)',
      '0px 6px 16px rgba(0,0,0,0.08)',
      '0px 8px 24px rgba(0,0,0,0.10)',
      '0px 10px 32px rgba(0,0,0,0.12)',
    ],
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0px 8px 24px rgba(0,0,0,0.08)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 8,
            padding: '8px 20px',
            transition: 'all 0.2s ease',
            background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
            color: '#fff',
            boxShadow: `0 4px 12px ${primary}40`,
            '&:hover': {
              boxShadow: `0 6px 20px ${primary}60`,
              transform: 'translateY(-1px)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          },
          outlined: {
            background: 'transparent',
            color: primary,
            borderColor: primary,
            '&:hover': {
              background: `${primary}10`,
              borderColor: primary,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            backdropFilter: 'blur(10px)',
            background: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
            border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: `0px 12px 30px ${primary}20`,
              borderColor: primary,
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: '2px 8px',
            transition: 'all 0.2s ease',
            '&.active': {
              background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
              color: '#fff',
              boxShadow: `0 4px 12px ${primary}40`,
            },
            '&:hover': {
              background: `${primary}10`,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 600,
          },
        },
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            paddingLeft: { xs: 16, md: 24 },
            paddingRight: { xs: 16, md: 24 },
          },
        },
      },
    },
  });
};