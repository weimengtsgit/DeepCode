import { computed } from 'vue';
import { useGlobalStore } from '@/stores/globalStore';

/**
 * Provides reactive ECharts theme configuration based on the application's global theme state.
 * Currently optimized for the "Grafana-like" Dark Mode.
 */
export function useChartTheme() {
  const globalStore = useGlobalStore();

  const isDark = computed(() => globalStore.isDarkTheme);

  // Grafana-inspired Dark Theme Palette
  const darkTheme = {
    backgroundColor: 'transparent', // Allow container bg to show through (#1f1f24 usually)
    textStyle: {
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    title: {
      textStyle: {
        color: '#c7d0d9',
      },
    },
    // Colors for series (Blue, Green, Yellow, Orange, Red, Purple, Cyan)
    color: [
      '#3274d9', // Primary Blue
      '#73bf69', // Success Green
      '#fade2a', // Warning Yellow
      '#ff9f30', // Orange
      '#f2495c', // Error Red
      '#a071ff', // Purple
      '#5794f2', // Light Blue
    ],
    grid: {
      top: 30,
      bottom: 20,
      left: 30,
      right: 20,
      containLabel: true,
      borderColor: '#2c3235',
    },
    legend: {
      textStyle: {
        color: '#c7d0d9',
      },
      pageIconColor: '#c7d0d9',
      pageTextStyle: {
        color: '#c7d0d9',
      },
    },
    tooltip: {
      backgroundColor: '#0b0c0e',
      borderColor: '#2c3235',
      textStyle: {
        color: '#c7d0d9',
      },
      axisPointer: {
        lineStyle: {
          color: '#2c3235',
        },
        label: {
          backgroundColor: '#0b0c0e',
          color: '#c7d0d9',
        },
      },
    },
    categoryAxis: {
      axisLine: {
        show: true,
        lineStyle: {
          color: '#2c3235',
        },
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        show: true,
        color: '#c7d0d9',
      },
      splitLine: {
        show: false,
        lineStyle: {
          color: ['#2c3235'],
        },
      },
    },
    valueAxis: {
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        show: true,
        color: '#c7d0d9',
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: ['#2c3235'],
          type: 'dashed',
        },
      },
      splitArea: {
        show: false,
      },
    },
    dataZoom: {
      textStyle: {
        color: '#c7d0d9',
      },
      borderColor: '#2c3235',
    },
  };

  // Light theme fallback (if needed in future, currently minimal)
  const lightTheme = {
    backgroundColor: 'transparent',
    color: ['#3274d9', '#73bf69', '#fade2a', '#ff9f30', '#f2495c'],
    title: { textStyle: { color: '#000' } },
    tooltip: { backgroundColor: '#fff', textStyle: { color: '#000' } },
    legend: { textStyle: { color: '#000' } },
    categoryAxis: { axisLabel: { color: '#000' } },
    valueAxis: { axisLabel: { color: '#000' }, splitLine: { lineStyle: { color: '#eee' } } },
  };

  const themeOptions = computed(() => (isDark.value ? darkTheme : lightTheme));

  return {
    isDark,
    themeOptions,
  };
}
