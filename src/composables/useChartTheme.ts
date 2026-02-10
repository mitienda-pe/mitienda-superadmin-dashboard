export function useChartTheme() {
  const colors = {
    primary: '#00b2a6',
    primaryLight: '#33bfaf',
    primaryDark: '#009688',
    secondary: '#333333',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    gray: {
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151'
    }
  }

  // Palette for stacked/grouped charts
  const palette = [
    '#00b2a6', // primary - Large
    '#3b82f6', // blue - Medium
    '#f59e0b', // amber - Small
    '#8b5cf6', // violet - Micro
    '#ef4444', // red
    '#22c55e', // green
    '#ec4899', // pink
    '#06b6d4'  // cyan
  ]

  const baseChartOptions = {
    grid: {
      top: 40,
      right: 20,
      bottom: 30,
      left: 60,
      containLabel: false
    },
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#374151',
        fontSize: 13
      }
    },
    legend: {
      bottom: 0,
      textStyle: {
        color: '#6b7280',
        fontSize: 12
      },
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 16
    }
  }

  return {
    colors,
    palette,
    baseChartOptions
  }
}
