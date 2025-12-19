import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
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
  AlertDescription,
  Divider,
  Flex,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon, InfoIcon, TimeIcon, ArrowBackIcon, CloseIcon } from '@chakra-ui/icons';
import { getProgress, pollProgress, cancelTask } from '../utils/api';

const Progress = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const taskId = searchParams.get('taskId');
  
  const [progressData, setProgressData] = useState({
    progress: 0,
    logs: [],
    status: 'running'
  });
  const [error, setError] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const logBgColor = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    if (!taskId) {
      setError('缺少任务ID参数');
      return;
    }

    const cleanup = pollProgress(
      taskId,
      (data) => {
        setProgressData(data);
        if (data.status === 'completed') {
          setTimeout(() => {
            navigate(`/report?taskId=${taskId}`);
          }, 1500);
        }
        if (data.status === 'failed') {
          setError('任务执行失败，请检查配置后重试');
        }
        if (data.status === 'cancelled') {
          toast({
            title: '任务已取消',
            description: '任务已被用户取消',
            status: 'warning',
            duration: 3000,
            isClosable: true,
            position: 'top'
          });
        }
      },
      2000
    );

    return cleanup;
  }, [taskId, navigate]);

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
      pending: { label: '等待中', colorScheme: 'gray' },
      cancelled: { label: '已取消', colorScheme: 'orange' }
    };

    const status = statusMap[progressData.status] || statusMap.pending;
    return (
      <Badge colorScheme={status.colorScheme} fontSize="md" px={4} py={2} borderRadius="full">
        {status.label}
      </Badge>
    );
  };

  const handleCancelTask = async () => {
    try {
      setIsCancelling(true);
      await cancelTask(taskId);
      onClose();
      toast({
        title: '取消成功',
        description: '任务已成功取消',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    } catch (error) {
      toast({
        title: '取消失败',
        description: error.message || '取消任务失败，请重试',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top'
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

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
                任务执行失败
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
              size="lg"
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
            borderColor={borderColor}
          >
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
              <VStack align="start" spacing={1}>
                <Heading size="lg" color="blue.600">
                  性能测评进度
                </Heading>
                <Text fontSize="sm" color="gray.600">
                  任务ID: {taskId}
                </Text>
              </VStack>
              <HStack spacing={3}>
                {getStatusBadge()}
                {progressData.status === 'running' && (
                  <Button
                    leftIcon={<CloseIcon />}
                    colorScheme="red"
                    variant="outline"
                    size="md"
                    onClick={onOpen}
                  >
                    取消任务
                  </Button>
                )}
              </HStack>
            </Flex>
          </Box>

          <Card bg={cardBgColor} borderColor={borderColor} borderWidth="1px" shadow="sm">
            <CardBody>
              <VStack spacing={5} align="stretch">
                <HStack justify="space-between">
                  <Heading size="md">任务进度</Heading>
                  <Text fontSize="lg" fontWeight="bold" color="blue.600">
                    {progressData.progress}%
                  </Text>
                </HStack>

                <Box>
                  <ChakraProgress
                    value={progressData.progress}
                    size="lg"
                    colorScheme={progressData.status === 'failed' ? 'red' : 'blue'}
                    borderRadius="full"
                    hasStripe
                    isAnimated={progressData.status === 'running'}
                  />
                </Box>

                {progressData.status === 'running' && (
                  <HStack spacing={3} color="gray.600" justify="center" py={2}>
                    <Spinner size="md" thickness="3px" color="blue.500" />
                    <Text fontSize="md" fontWeight="medium">
                      正在执行性能测评，请稍候...
                    </Text>
                  </HStack>
                )}

                {progressData.status === 'completed' && (
                  <Alert status="success" borderRadius="md" variant="subtle">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>任务已完成</AlertTitle>
                      <AlertDescription>正在跳转到报告页面...</AlertDescription>
                    </Box>
                  </Alert>
                )}

                {progressData.status === 'cancelled' && (
                  <Alert status="warning" borderRadius="md" variant="subtle">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>任务已取消</AlertTitle>
                      <AlertDescription>任务已被用户手动取消</AlertDescription>
                    </Box>
                  </Alert>
                )}
              </VStack>
            </CardBody>
          </Card>

          <Card bg={cardBgColor} borderColor={borderColor} borderWidth="1px" shadow="sm">
            <CardBody>
              <VStack spacing={5} align="stretch">
                <HStack justify="space-between">
                  <Heading size="md">执行日志</Heading>
                  <Badge colorScheme="gray" fontSize="sm">
                    共 {progressData.logs?.length || 0} 条
                  </Badge>
                </HStack>

                <Divider />

                <Box
                  maxH="500px"
                  overflowY="auto"
                  bg={logBgColor}
                  borderRadius="md"
                  p={4}
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  {progressData.logs && progressData.logs.length > 0 ? (
                    <List spacing={4}>
                      {progressData.logs.map((log, index) => (
                        <ListItem key={index}>
                          <HStack align="start" spacing={3} p={3} borderRadius="md" bg={cardBgColor}>
                            <ListIcon
                              as={getLogIcon(log.level)}
                              color={getLogColor(log.level)}
                              mt={1}
                              boxSize={5}
                            />
                            <VStack align="start" spacing={1} flex={1}>
                              <Text fontSize="sm" fontWeight="medium" color="gray.800">
                                {log.message}
                              </Text>
                              {log.timestamp && (
                                <HStack spacing={1} fontSize="xs" color="gray.500">
                                  <TimeIcon boxSize={3} />
                                  <Text>
                                    {new Date(log.timestamp).toLocaleString('zh-CN', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                      hour12: false
                                    })}
                                  </Text>
                                </HStack>
                              )}
                            </VStack>
                          </HStack>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <VStack spacing={3} py={12}>
                      <InfoIcon boxSize={10} color="gray.400" />
                      <Text textAlign="center" color="gray.500" fontSize="md">
                        暂无日志信息
                      </Text>
                    </VStack>
                  )}
                </Box>
              </VStack>
            </CardBody>
          </Card>

          <Button
            leftIcon={<ArrowBackIcon />}
            variant="outline"
            colorScheme="blue"
            onClick={handleBackToHome}
            alignSelf="center"
            size="lg"
          >
            返回首页
          </Button>
        </VStack>
      </Container>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>确认取消任务</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="start">
              <Text>
                确定要取消当前任务吗？取消后将无法恢复任务进度。
              </Text>
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  任务ID: {taskId}
                </AlertDescription>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              继续执行
            </Button>
            <Button
              colorScheme="red"
              onClick={handleCancelTask}
              isLoading={isCancelling}
              loadingText="取消中..."
            >
              确认取消
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Progress;