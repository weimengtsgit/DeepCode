import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider, Box, extendTheme } from '@chakra-ui/react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Progress from './pages/Progress';
import Report from './pages/Report';

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif'
  },
  colors: {
    brand: {
      50: '#e3f2fd',
      100: '#bbdefb',
      200: '#90caf9',
      300: '#64b5f6',
      400: '#42a5f5',
      500: '#2196f3',
      600: '#1e88e5',
      700: '#1976d2',
      800: '#1565c0',
      900: '#0d47a1'
    }
  },
  styles: {
    global: {
      'html, body': {
        fontFamily: 'Inter, system-ui, sans-serif',
        color: 'gray.800',
        lineHeight: 'tall'
      }
    }
  }
});

const App = () => {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Box minH="100vh" bg="gray.50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/report" element={<Report />} />
          </Routes>
        </Box>
      </Router>
    </ChakraProvider>
  );
};

export default App;