import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Progress,
  Image,
  Grid,
  GridItem,
  Card,
  CardBody,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  CircularProgress,
  CircularProgressLabel,
  Divider,
  useColorModeValue
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';

const Report = ({ report }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (!report) {
    return (
      <Box p={8} textAlign="center">
        <Text fontSize="lg" color="gray.500">
          暂无报告数据
        </Text>
      </Box>
    );
  }

  const { metrics, screenshots, resources, score } = report;

  const getScoreColor = (score) => {
    if (score >= 90) return 'green.500';
    if (score >= 70) return 'yellow.500';
    return 'red.500';
  };

  const getMetricStatus = (metric, value) => {
    const thresholds = {
      LCP: 2500,
      FCP: 1800,
      TTI: 3500,
      TBT: 200,
      CLS: 0.1
    };
    return value > thresholds[metric] ? 'warning' : 'success';
  };

  const formatMetricValue = (metric, value) => {
    if (metric === 'CLS') {
      return value.toFixed(3);
    }
    return `${Math.round(value)}ms`;
  };

  return (
    <VStack spacing={8} align="stretch" w="100%">
      <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
        <CardBody>
          <VStack spacing={6}>
            <Heading size="lg">性能测评报告</Heading>
            
            <Box textAlign="center" py={4}>
              <CircularProgress
                value={score}
                size="180px"
                thickness="12px"
                color={getScoreColor(score)}
              >
                <CircularProgressLabel>
                  <VStack spacing={1}>
                    <Text fontSize="4xl" fontWeight="bold">
                      {score}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      综合评分
                    </Text>
                  </VStack>
                </CircularProgressLabel>
              </CircularProgress>
            </Box>

            <HStack spacing={4} justify="center" flexWrap="wrap">
              {score >= 90 && (
                <Badge colorScheme="green" fontSize="md" px={3} py={1}>
                  <CheckCircleIcon mr={1} />
                  优秀
                </Badge>
              )}
              {score >= 70 && score < 90 && (
                <Badge colorScheme="yellow" fontSize="md" px={3} py={1}>
                  <WarningIcon mr={1} />
                  良好
                </Badge>
              )}
              {score < 70 && (
                <Badge colorScheme="red" fontSize="md" px={3} py={1}>
                  <WarningIcon mr={1} />
                  需优化
                </Badge>
              )}
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
        <CardBody>
          <Heading size="md" mb={6}>
            性能指标详情
          </Heading>
          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6}>
            {metrics && Object.entries(metrics).map(([key, value]) => (
              <GridItem key={key}>
                <Card
                  variant="outline"
                  borderColor={
                    getMetricStatus(key, value) === 'success'
                      ? 'green.300'
                      : 'yellow.300'
                  }
                >
                  <CardBody>
                    <Stat>
                      <StatLabel fontSize="sm" color="gray.600">
                        {key}
                      </StatLabel>
                      <StatNumber fontSize="2xl">
                        {formatMetricValue(key, value)}
                      </StatNumber>
                      <StatHelpText>
                        {getMetricStatus(key, value) === 'success' ? (
                          <HStack spacing={1}>
                            <CheckCircleIcon color="green.500" />
                            <Text>正常</Text>
                          </HStack>
                        ) : (
                          <HStack spacing={1}>
                            <WarningIcon color="yellow.500" />
                            <Text>需优化</Text>
                          </HStack>
                        )}
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </GridItem>
            ))}
          </Grid>
        </CardBody>
      </Card>

      {screenshots && screenshots.length > 0 && (
        <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <Heading size="md" mb={6}>
              页面截图
            </Heading>
            <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
              {screenshots.map((screenshot, index) => (
                <GridItem key={index}>
                  <Box
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="md"
                    overflow="hidden"
                  >
                    <Image
                      src={screenshot}
                      alt={`截图 ${index + 1}`}
                      w="100%"
                      objectFit="cover"
                    />
                  </Box>
                </GridItem>
              ))}
            </Grid>
          </CardBody>
        </Card>
      )}

      {resources && resources.length > 0 && (
        <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <Heading size="md" mb={6}>
              资源加载清单
            </Heading>
            <VStack spacing={3} align="stretch">
              {resources.map((resource, index) => (
                <Box key={index}>
                  <HStack justify="space-between" p={3} bg="gray.50" borderRadius="md">
                    <Text fontSize="sm" fontWeight="medium">
                      {resource}
                    </Text>
                    <Badge colorScheme="blue">已加载</Badge>
                  </HStack>
                  {index < resources.length - 1 && <Divider />}
                </Box>
              ))}
            </VStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
};

export default Report;