import React, { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Progress as ChakraProgress,
  Card,
  CardBody,
  Badge,
  List,
  ListItem,
  ListIcon,
  Spinner,
  Button,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon, InfoIcon, TimeIcon } from '@chakra-ui/icons';
import { getProgress, pollProgress } from '../utils/api';

const Progress = ({ taskId, onComplete }) => {
  const [progressData, setProgressData] = useState({
    progress: 0,
    logs: [],
    status: 'running'
  });
  const [error, setError] = useState(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const logBgColor = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    if (!taskId) {
      setError('任务ID不存在');
      return;
    }

    const cleanup = pollProgress(
      taskId,
      (data) => {
        setProgressData(data);
        if (data.status === 'completed' && onComplete) {
          setTimeout(() => onComplete(taskId), 1000);
        }
        if (data.status === 'failed') {
          setError('任务执行失败');
        }
      },
      2000
    );

    return cleanup;
  }, [taskId, onComplete]);

  const getLogIcon = (level) => {
    switch (level) {
      case 'success':
        return CheckCircleIcon;
      case 'error':
        return WarningIcon;
      case 'warning':
        return WarningIcon;
      default:
        return InfoIcon;
    }
  };

  const getLogColor = (level) => {
    switch (level) {
      case 'success':
        return 'green.500';
      case 'error':
        return 'red.500';
      case 'warning':
        return 'yellow.500';
      default:
        return 'blue.500';
    }
  };

  const getStatusBadge = () => {
    const statusMap = {
      running: { label: '执行中', colorScheme: 'blue' },
      completed: { label: '已完成', colorScheme: 'green' },
      failed: { label: '失败', colorScheme: 'red' },
      pending: { label: '等待中', colorScheme: 'gray' }
    };

    const status = statusMap[progressData.status] || statusMap.pending;
    return (
      <Badge colorScheme={status.colorScheme} fontSize="md" px={3} py={1}>
        {status.label}
      </Badge>
    );
  };

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <AlertTitle>错误</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <VStack spacing={6} align="stretch" w="100%">
      <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Heading size="md">任务进度</Heading>
              {getStatusBadge()}
            </HStack>

            <Box>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" color="gray.600">
                  完成度
                </Text>
                <Text fontSize="sm" fontWeight="bold" color="blue.600">
                  {progressData.progress}%
                </Text>
              </HStack>
              <ChakraProgress
                value={progressData.progress}
                size="lg"
                colorScheme={progressData.status === 'failed' ? 'red' : 'blue'}
                borderRadius="md"
                hasStripe
                isAnimated={progressData.status === 'running'}
              />
            </Box>

            {progressData.status === 'running' && (
              <HStack spacing={2} color="gray.600">
                <Spinner size="sm" />
                <Text fontSize="sm">正在执行性能测评...</Text>
              </HStack>
            )}

            {progressData.status === 'completed' && (
              <Alert status="success" borderRadius="md">
                <AlertIcon />
                <AlertTitle>任务已完成</AlertTitle>
                <AlertDescription>正在跳转到报告页面...</AlertDescription>
              </Alert>
            )}
          </VStack>
        </CardBody>
      </Card>

      <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Heading size="md">执行日志</Heading>

            <Box
              maxH="400px"
              overflowY="auto"
              bg={logBgColor}
              borderRadius="md"
              p={4}
            >
              {progressData.logs && progressData.logs.length > 0 ? (
                <List spacing={3}>
                  {progressData.logs.map((log, index) => (
                    <ListItem key={index}>
                      <HStack align="start" spacing={3}>
                        <ListIcon
                          as={getLogIcon(log.level)}
                          color={getLogColor(log.level)}
                          mt={1}
                        />
                        <VStack align="start" spacing={1} flex={1}>
                          <Text fontSize="sm" fontWeight="medium">
                            {log.message}
                          </Text>
                          {log.timestamp && (
                            <HStack spacing={1} fontSize="xs" color="gray.500">
                              <TimeIcon boxSize={3} />
                              <Text>
                                {new Date(log.timestamp).toLocaleTimeString('zh-CN')}
                              </Text>
                            </HStack>
                          )}
                        </VStack>
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Text textAlign="center" color="gray.500" py={8}>
                  暂无日志信息
                </Text>
              )}
            </Box>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default Progress;