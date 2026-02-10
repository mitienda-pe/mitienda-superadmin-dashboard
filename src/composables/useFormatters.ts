export function useFormatters() {
  function formatCurrency(value: number, decimals = 0): string {
    return `S/${value.toLocaleString('es-PE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`
  }

  function formatPercent(value: number, decimals = 1): string {
    return `${value.toFixed(decimals)}%`
  }

  function formatNumber(value: number): string {
    return value.toLocaleString('es-PE')
  }

  function formatCompactNumber(value: number): string {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`
    }
    return value.toString()
  }

  function formatDate(date: string | Date): string {
    const d = new Date(date)
    return d.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  function formatMonthYear(monthStr: string): string {
    // Input: "2024-01" -> Output: "Ene 2024"
    const [year, month] = monthStr.split('-')
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    return `${months[parseInt(month) - 1]} ${year}`
  }

  function formatShortMonth(monthStr: string): string {
    // Input: "2024-01" -> Output: "Ene"
    const month = monthStr.split('-')[1]
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    return months[parseInt(month) - 1]
  }

  return {
    formatCurrency,
    formatPercent,
    formatNumber,
    formatCompactNumber,
    formatDate,
    formatMonthYear,
    formatShortMonth
  }
}
