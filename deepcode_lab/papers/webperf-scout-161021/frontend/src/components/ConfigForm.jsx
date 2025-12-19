import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Textarea,
  Radio,
  RadioGroup,
  Stack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  Select,
  Card,
  CardBody,
  Heading,
  Text,
  Divider,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertDescription,
  Tooltip,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { InfoIcon, AddIcon } from '@chakra-ui/icons';

const ConfigForm = ({ onSubmit, isLoading }) => {
  const [mode, setMode] = useState('manual');
  const [urls, setUrls] = useState('');
  const [seedUrl, setSeedUrl] = useState('');
  const [maxDepth, setMaxDepth] = useState(2);
  const [maxPages, setMaxPages] = useState(30);
  const [device, setDevice] = useState('Desktop');
  const [network, setNetwork] = useState('4G');
  const [cpuThrottle, setCpuThrottle] = useState(1);
  const [includeDomains, setIncludeDomains] = useState([]);
  const [excludePatterns, setExcludePatterns] = useState([]);
  const [newDomain, setNewDomain] = useState('');
  const [newPattern, setNewPattern] = useState('');

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleAddDomain = () => {
    if (newDomain && !includeDomains.includes(newDomain)) {
      setIncludeDomains([...includeDomains, newDomain]);
      setNewDomain('');
    }
  };

  const handleRemoveDomain = (domain) => {
    setIncludeDomains(includeDomains.filter(d => d !== domain));
  };

  const handleAddPattern = () => {
    if (newPattern && !excludePatterns.includes(newPattern)) {
      setExcludePatterns([...excludePatterns, newPattern]);
      setNewPattern('');
    }
  };

  const handleRemovePattern = (pattern) => {
    setExcludePatterns(excludePatterns.filter(p => p !== pattern));
  };

  const handleSubmit = () => {
    if (mode === 'manual') {
      const urlList = urls.split('\n').filter(u => u.trim());
      if (urlList.length === 0) {
        return;
      }
      onSubmit({ urls: urlList });
    } else {
      if (!seedUrl.trim()) {
        return;
      }
      onSubmit({
        crawler: {
          seedUrl: seedUrl.trim(),
          maxDepth,
          maxPages,
          includeDomains: includeDomains.length > 0 ? includeDomains : undefined,
          excludePatterns: excludePatterns.length > 0 ? excludePatterns : undefined
        },
        device,
        network,
        cpuThrottle
      });
    }
  };

  return (
    <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
      <CardBody>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="md" mb={2}>
              性能测评配置
            </Heading>
            <Text fontSize="sm" color="gray.600">
              选择测评模式并填写相关配置信息
            </Text>
          </Box>

          <Divider />

          <FormControl>
            <FormLabel fontWeight="bold">
              测评模式
              <Tooltip label="手动模式：直接输入URL列表。爬虫模式：自动发现页面链接">
                <InfoIcon ml={2} boxSize={3} color="gray.500" />
              </Tooltip>
            </FormLabel>
            <RadioGroup value={mode} onChange={setMode}>
              <Stack direction="row" spacing={6}>
                <Radio value="manual">手动输入URL</Radio>
                <Radio value="crawler">智能爬虫</Radio>
              </Stack>
            </RadioGroup>
          </FormControl>

          {mode === 'manual' ? (
            <FormControl isRequired>
              <FormLabel fontWeight="bold">目标URL列表</FormLabel>
              <Textarea
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder="请输入URL，每行一个&#10;例如：&#10;https://example.com&#10;https://example.com/about"
                rows={6}
                resize="vertical"
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                每行输入一个完整的HTTPS URL
              </Text>
            </FormControl>
          ) : (
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel fontWeight="bold">种子URL</FormLabel>
                <Input
                  value={seedUrl}
                  onChange={(e) => setSeedUrl(e.target.value)}
                  placeholder="https://example.com"
                  type="url"
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  爬虫将从此URL开始发现页面链接
                </Text>
              </FormControl>

              <HStack spacing={4} align="start">
                <FormControl>
                  <FormLabel fontWeight="bold">爬取深度</FormLabel>
                  <NumberInput
                    value={maxDepth}
                    onChange={(val) => setMaxDepth(Number(val))}
                    min={1}
                    max={5}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    最大深度：1-5
                  </Text>
                </FormControl>

                <FormControl>
                  <FormLabel fontWeight="bold">页面数量上限</FormLabel>
                  <NumberInput
                    value={maxPages}
                    onChange={(val) => setMaxPages(Number(val))}
                    min={1}
                    max={100}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    最多爬取：1-100页
                  </Text>
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel fontWeight="bold">域名白名单（可选）</FormLabel>
                <HStack>
                  <Input
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="example.com"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddDomain()}
                  />
                  <Button
                    leftIcon={<AddIcon />}
                    onClick={handleAddDomain}
                    colorScheme="blue"
                    size="sm"
                  >
                    添加
                  </Button>
                </HStack>
                <Wrap mt={2}>
                  {includeDomains.map((domain) => (
                    <WrapItem key={domain}>
                      <Tag size="md" colorScheme="blue" borderRadius="full">
                        <TagLabel>{domain}</TagLabel>
                        <TagCloseButton onClick={() => handleRemoveDomain(domain)} />
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  限制爬取范围至指定域名
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="bold">路径排除规则（可选）</FormLabel>
                <HStack>
                  <Input
                    value={newPattern}
                    onChange={(e) => setNewPattern(e.target.value)}
                    placeholder="/admin"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddPattern()}
                  />
                  <Button
                    leftIcon={<AddIcon />}
                    onClick={handleAddPattern}
                    colorScheme="blue"
                    size="sm"
                  >
                    添加
                  </Button>
                </HStack>
                <Wrap mt={2}>
                  {excludePatterns.map((pattern) => (
                    <WrapItem key={pattern}>
                      <Tag size="md" colorScheme="red" borderRadius="full">
                        <TagLabel>{pattern}</TagLabel>
                        <TagCloseButton onClick={() => handleRemovePattern(pattern)} />
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  排除包含特定路径的页面
                </Text>
              </FormControl>
            </VStack>
          )}

          <Divider />

          <Box>
            <Heading size="sm" mb={4}>
              设备与网络配置
            </Heading>

            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel fontWeight="bold">模拟设备</FormLabel>
                <Select value={device} onChange={(e) => setDevice(e.target.value)}>
                  <option value="Desktop">桌面端</option>
                  <option value="iPhone 12">iPhone 12</option>
                  <option value="iPhone 13">iPhone 13</option>
                  <option value="Pixel 5">Pixel 5</option>
                  <option value="iPad">iPad</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="bold">网络条件</FormLabel>
                <Select value={network} onChange={(e) => setNetwork(e.target.value)}>
                  <option value="WiFi">WiFi</option>
                  <option value="4G">4G</option>
                  <option value="3G">3G</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="bold">CPU节流倍数</FormLabel>
                <NumberInput
                  value={cpuThrottle}
                  onChange={(val) => setCpuThrottle(Number(val))}
                  min={1}
                  max={4}
                  step={1}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  1 = 无节流，4 = 4倍减速
                </Text>
              </FormControl>
            </VStack>
          </Box>

          {mode === 'manual' && urls.trim() === '' && (
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <AlertDescription>请至少输入一个URL</AlertDescription>
            </Alert>
          )}

          {mode === 'crawler' && seedUrl.trim() === '' && (
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <AlertDescription>请输入种子URL</AlertDescription>
            </Alert>
          )}

          <Button
            colorScheme="blue"
            size="lg"
            onClick={handleSubmit}
            isLoading={isLoading}
            loadingText="启动中..."
            isDisabled={
              (mode === 'manual' && urls.trim() === '') ||
              (mode === 'crawler' && seedUrl.trim() === '')
            }
          >
            开始性能测评
          </Button>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default ConfigForm;