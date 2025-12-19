import React from 'react';
import {
  Box,
  Flex,
  HStack,
  Text,
  Link,
  Container,
  useColorModeValue,
  Icon,
  Heading
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { FaChartLine, FaHome, FaClipboardList } from 'react-icons/fa';

const Navbar = () => {
  const location = useLocation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const activeColor = useColorModeValue('blue.600', 'blue.200');

  const menuItems = [
    { path: '/', label: '首页', icon: FaHome },
    { path: '/progress', label: '进度监控', icon: FaClipboardList }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <Box
      as="nav"
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      position="sticky"
      top={0}
      zIndex={1000}
      boxShadow="sm"
    >
      <Container maxW="container.xl">
        <Flex h={16} alignItems="center" justifyContent="space-between">
          <HStack spacing={4} alignItems="center">
            <Icon as={FaChartLine} boxSize={8} color="blue.500" />
            <Heading
              size="md"
              bgGradient="linear(to-r, blue.500, blue.600)"
              bgClip="text"
              fontWeight="bold"
            >
              WebPerf Scout
            </Heading>
          </HStack>

          <HStack spacing={1}>
            {menuItems.map((item) => (
              <Link
                key={item.path}
                as={RouterLink}
                to={item.path}
                px={4}
                py={2}
                borderRadius="md"
                bg={isActive(item.path) ? activeBg : 'transparent'}
                color={isActive(item.path) ? activeColor : 'gray.600'}
                fontWeight={isActive(item.path) ? 'semibold' : 'normal'}
                _hover={{
                  bg: activeBg,
                  color: activeColor,
                  textDecoration: 'none'
                }}
                transition="all 0.2s"
              >
                <HStack spacing={2}>
                  <Icon as={item.icon} boxSize={4} />
                  <Text fontSize="sm">{item.label}</Text>
                </HStack>
              </Link>
            ))}
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
};

export default Navbar;