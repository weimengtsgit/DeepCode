import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription
} from '@chakra-ui/react';
import ConfigForm from '../components/ConfigForm';
import { startTask } from '../utils/api';

const Home = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleSubmit = async (config) => {
    try {
      setIsLoading(true);
      const response = await startTask(config);
      
      if (response.taskId) {
        toast({
          title: '任务已启动',
          description: `任务ID: ${response.taskId}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top'
        });
        
        navigate(`/progress?taskId=${response.taskId}`);
      } else {
        throw new Error('未获取到任务ID');
      }
    } catch (error) {
      toast({
        title: '启动失败',
        description: error.message || '请检查配置后重试',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <Box
            bg={cardBgColor}
            p={8}
            borderRadius="lg"
            boxShadow="sm"
            borderWidth="1px"
            borderColor={borderColor}
            textAlign="center"
          >
            <VStack spacing={4}>
              <Heading
                size="xl"
                bgGradient="linear(to-r, blue.500, blue.600)"
                bgClip="text"
              >
                WebPerf Scout
              </Heading>
              <Text fontSize="lg" color="gray.600">
                智能爬虫 + 性能分析 + 可视化报告
              </Text>
              <Text fontSize="md" color="gray.500" maxW="2xl">
                从一个入口URL出发，自动发现页面、完成专业级Web性能测评，
                并通过可视化界面输出详细报告
              </Text>
            </VStack>
          </Box>

          <Alert status="info" borderRadius="md" variant="left-accent">
            <AlertIcon />
            <AlertDescription fontSize="sm">
              支持手动输入URL列表或配置智能爬虫参数，系统将自动完成性能测评并生成可视化报告
            </AlertDescription>
          </Alert>

          <ConfigForm onSubmit={handleSubmit} isLoading={isLoading} />

          <Box
            bg={cardBgColor}
            p={6}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <VStack spacing={3} align="start">
              <Heading size="sm" color="gray.700">
                功能特性
              </Heading>
              <VStack spacing={2} align="start" pl={4}>
                <Text fontSize="sm" color="gray.600">
                  ✓ 自动发现页面链接并执行性能测评
                </Text>
                <Text fontSize="sm" color="gray.600">
                  ✓ 支持多设备模拟（桌面端、移动端）
                </Text>
                <Text fontSize="sm" color="gray.600">
                  ✓ 采集 Web Vitals 核心指标（LCP/FCP/CLS/TTI/TBT）
                </Text>
                <Text fontSize="sm" color="gray.600">
                  ✓ 实时进度反馈与日志流展示
                </Text>
                <Text fontSize="sm" color="gray.600">
                  ✓ 生成专业级可视化报告
                </Text>
              </VStack>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default Home;