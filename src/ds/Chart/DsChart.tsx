import { useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { LABELS, sampleData, type DatasetKey } from './sampleData'
import { useTokenColors } from './useTokenColors'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
)

export type DsChartProps = {
  type: 'line' | 'bar' | 'doughnut'
  dataset: DatasetKey
  showLegend?: boolean
  title?: string
}

export function DsChart({ type, dataset, showLegend = true, title }: DsChartProps) {
  const scopeRef = useRef<HTMLDivElement>(null)
  const palette = useTokenColors(scopeRef)

  const values = [...sampleData[dataset]]
  const labels = LABELS.slice(0, values.length)

  const options = {
    responsive: true,
    plugins: {
      legend: { display: showLegend },
      title: { display: title != null && title !== '', text: title },
    },
  }

  const renderChart = () => {
    if (palette.length === 0) return null
    if (type === 'doughnut') {
      const data = {
        labels,
        datasets: [{ label: dataset, data: values, backgroundColor: palette }],
      }
      return <Doughnut data={data} options={options} />
    }
    if (type === 'bar') {
      const data = {
        labels,
        datasets: [
          {
            label: dataset,
            data: values,
            backgroundColor: values.map((_, i) => palette[i % palette.length]),
          },
        ],
      }
      return <Bar data={data} options={options} />
    }
    const data = {
      labels,
      datasets: [
        {
          label: dataset,
          data: values,
          borderColor: palette[0],
          backgroundColor: palette[0],
        },
      ],
    }
    return <Line data={data} options={options} />
  }

  return (
    <div ref={scopeRef} style={{ width: 480 }}>
      {renderChart()}
    </div>
  )
}
