import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Heading,
  Spinner,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Flex
} from '@chakra-ui/react';
import { ArrowBackIcon, DownloadIcon } from '@chakra-ui/icons';
import ReportComponent from '../components/Report';
import { getReport } from '../utils/api';

const Report = () => {
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get('taskId');
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBgColor = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    if (!taskId) {
      setError('缺少任务ID参数');
      setLoading(false);
      return;
    }

    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getReport(taskId);
        setReport(data);
      } catch (err) {
        setError(err.message || '获取报告失败');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [taskId]);

  const handleExportJSON = () => {
    if (!report) return;
    
    const dataStr = JSON.stringify(report, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `webperf-report-${taskId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleBackToHome = () => {
    window.location.hash = '#/';
  };

  if (loading) {
    return (
      <Box bg={bgColor} minH="100vh" py={8}>
        <Container maxW="container.xl">
          <Flex justify="center" align="center" minH="60vh" direction="column">
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Text mt={4} fontSize="lg" color="gray.600">
              正在加载报告数据...
            </Text>
          </Flex>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box bg={bgColor} minH="100vh" py={8}>
        <Container maxW="container.xl">
          <VStack spacing={6} align="stretch">
            <Alert
              status="error"
              variant="subtle"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              borderRadius="md"
              py={8}
            >
              <AlertIcon boxSize="40px" mr={0} />
              <AlertTitle mt={4} mb={1} fontSize="lg">
                加载失败
              </AlertTitle>
              <AlertDescription maxWidth="sm">
                {error}
              </AlertDescription>
            </Alert>
            
            <Button
              leftIcon={<ArrowBackIcon />}
              colorScheme="blue"
              onClick={handleBackToHome}
              alignSelf="center"
            >
              返回首页
            </Button>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={6} align="stretch">
          <Box
            bg={cardBgColor}
            p={6}
            borderRadius="lg"
            boxShadow="sm"
            borderWidth="1px"
            borderColor={useColorModeValue('gray.200', 'gray.700')}
          >
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
              <VStack align="start" spacing={1}>
                <Heading size="lg" color="blue.600">
                  性能测评报告
                </Heading>
                <Text fontSize="sm" color="gray.600">
                  任务ID: {taskId}
                </Text>
              </VStack>

              <HStack spacing={3}>
                <Button
                  leftIcon={<DownloadIcon />}
                  colorScheme="green"
                  size="md"
                  onClick={handleExportJSON}
                >
                  导出JSON
                </Button>
                <Button
                  leftIcon={<ArrowBackIcon />}
                  variant="outline"
                  colorScheme="blue"
                  size="md"
                  onClick={handleBackToHome}
                >
                  返回首页
                </Button>
              </HStack>
            </Flex>
          </Box>

          <ReportComponent report={report} />
        </VStack>
      </Container>
    </Box>
  );
};

export default Report;