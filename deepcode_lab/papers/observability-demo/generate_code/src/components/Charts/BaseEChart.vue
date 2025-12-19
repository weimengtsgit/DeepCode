<template>
  <div ref="chartContainer" class="base-echart" :style="{ height: height, width: width }"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, shallowRef, computed } from 'vue';
import * as echarts from 'echarts';
import { useChartTheme } from '@/composables/useChartTheme';

const props = defineProps({
  options: {
    type: Object,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  height: {
    type: String,
    default: '100%',
  },
  width: {
    type: String,
    default: '100%',
  },
});

const chartContainer = ref<HTMLElement | null>(null);
const chartInstance = shallowRef<echarts.ECharts | null>(null);
const { themeOptions, isDark } = useChartTheme();

let resizeObserver: ResizeObserver | null = null;
let resizeTimer: number | null = null;

// Initialize chart
const initChart = () => {
  if (!chartContainer.value) return;

  // Dispose if exists
  if (chartInstance.value) {
    chartInstance.value.dispose();
  }

  // Init with theme
  // We don't use the 'dark' string theme of ECharts, but rather our custom theme options
  // merged into the base options.
  chartInstance.value = echarts.init(chartContainer.value, isDark.value ? 'dark' : undefined, {
    renderer: 'canvas',
  });
  
  updateChart();
};

// Update chart options
const updateChart = () => {
  if (!chartInstance.value) return;

  if (props.loading) {
    chartInstance.value.showLoading('default', {
      text: '',
      color: '#3274d9', // Primary blue
      textColor: '#fff',
      maskColor: 'rgba(11, 12, 14, 0.8)', // Dark background with opacity
      zlevel: 0,
    });
  } else {
    chartInstance.value.hideLoading();
    
    // Merge theme options with prop options
    // Deep merge logic is handled by ECharts usually, but we want to ensure our theme defaults
    // are present if not overridden.
    
    // We apply the theme options first effectively by spreading, but ECharts setOption merges.
    // However, it's safer to let ECharts handle the merge or just pass themeOptions first.
    // Actually, useChartTheme provides global axis/tooltip styles.
    
    // We combine the base theme options and the specific chart options
    const finalOptions = {
      ...themeOptions.value,
      ...props.options,
      // We need to carefully merge nested objects like grid, xAxis, etc. if they exist in both.
      // ECharts setOption merges automatically, but passing two separate objects in setOption
      // is not the API. We'll rely on ECharts setOption to merge new options into existing.
      
      // Better approach: Since setOption merges with current state, we first set theme options,
      // then set specific options. Or we merge them manually before passing.
      
      // Let's use a simple spread for top level, but for nested ECharts objects like tooltip/xAxis
      // it might be tricky.
      // A common pattern is to just let the specific options override the theme.
    };

    // To ensure theme defaults are applied correctly for complex objects (like array vs object for xAxis),
    // we often trust the developer to provide valid overrides.
    
    // Special handling: if props.options has xAxis as array but theme has object, or vice versa.
    // For this demo, we assume the structure matches or we use deep merge if needed.
    // We will rely on ECharts setOption merge behavior for now by passing themeOptions first? 
    // Actually, simply merging objects in JS might lose nested properties if using spread.
    // ECharts `setOption` has a `notMerge` parameter.
    
    // Strategy: Pass themeOptions, then pass props.options.
    chartInstance.value.setOption(themeOptions.value); 
    chartInstance.value.setOption(props.options);
  }
};

// Resize handler with debounce to prevent resize loop
const handleResize = () => {
  if (resizeTimer !== null) {
    clearTimeout(resizeTimer);
  }
  resizeTimer = window.setTimeout(() => {
    chartInstance.value?.resize();
    resizeTimer = null;
  }, 100);
};

onMounted(() => {
  initChart();

  if (chartContainer.value) {
    resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(chartContainer.value);
  }
});

onUnmounted(() => {
  if (resizeTimer !== null) {
    clearTimeout(resizeTimer);
  }
  if (chartInstance.value) {
    chartInstance.value.dispose();
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});

// Watchers
watch(() => props.options, () => {
  updateChart();
}, { deep: true });

watch(() => props.loading, () => {
  updateChart();
});

watch(isDark, () => {
  // Re-init for theme background changes if necessary, 
  // or just update options. ECharts 'dark' theme init param handles background color mainly.
  initChart();
});

</script>

<style lang="scss" scoped>
.base-echart {
  width: 100%;
  height: 100%;
}
</style>
