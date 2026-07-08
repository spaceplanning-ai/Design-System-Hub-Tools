import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Card } from '../components/molecules';
import {
  LineChart,
  DonutChart,
  BarChart,
  RadarChart,
  Gauge,
  Heatmap,
} from '../components/molecules';
import { Table } from '../components/organisms';
import type { TableColumn } from '../components/organisms/Table';
import { Sparkline, Badge } from '../components/atoms';

const meta: Meta = {
  title: 'Examples/대시보드 Dashboard',
  parameters: { layout: 'padded' },
};
export default meta;

const CardHead = ({ title }: { title: ReactNode }) => <Card.Header title={title} />;

function StatTile({
  label,
  value,
  delta,
  up,
  spark,
  color,
}: {
  label: string;
  value: string;
  delta: string;
  up: boolean;
  spark: number[];
  color: '1' | '2' | '3' | '4';
}) {
  return (
    <Card variant="outlined" padding="md">
      <Card.Body>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 13, color: 'var(--tds-color-fg-muted)' }}>{label}</span>
          <span style={{ fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {value}
          </span>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginTop: 4,
            }}
          >
            <Badge size="sm" tone={up ? 'success' : 'danger'} variant="soft">
              {up ? '▲' : '▼'} {delta}
            </Badge>
            <Sparkline data={spark} color={color} width={96} height={28} />
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

type Product = { name: string; sales: number; share: string };
const productCols: TableColumn<Product>[] = [
  { key: 'name', header: '상품' },
  {
    key: 'sales',
    header: '판매',
    align: 'end',
    sortable: true,
    render: (r) => r.sales.toLocaleString(),
  },
  { key: 'share', header: '비중', align: 'end' },
];
const PRODUCTS: Product[] = [
  { name: '무선 이어버드', sales: 1284, share: '28%' },
  { name: '스마트워치', sales: 940, share: '20%' },
  { name: '노트북 스탠드', sales: 612, share: '13%' },
  { name: '기계식 키보드', sales: 508, share: '11%' },
];

// 요일 × 시간대 활동 (히트맵)
const HEAT_ROWS = ['월', '화', '수', '목', '금', '토', '일'];
const HEAT_COLS = ['0–6', '6–12', '12–18', '18–24'];
const HEAT_DATA = [
  [3, 28, 42, 30],
  [4, 31, 45, 33],
  [2, 26, 40, 29],
  [5, 34, 52, 38],
  [6, 30, 48, 44],
  [12, 20, 26, 22],
  [10, 14, 18, 16],
];

/** An analytics dashboard: stat tiles, line/donut/bar/gauge/radar charts, a heatmap, and a table. */
export const Dashboard: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 980, display: 'grid', gap: 16 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 16,
        }}
      >
        <StatTile
          label="월 매출"
          value="₩42.0M"
          delta="12.4%"
          up
          spark={[20, 24, 22, 28, 26, 34, 42]}
          color="1"
        />
        <StatTile
          label="방문자"
          value="264K"
          delta="8.1%"
          up
          spark={[12, 14, 13, 17, 21, 24, 26]}
          color="2"
        />
        <StatTile
          label="가입자"
          value="1,520"
          delta="3.2%"
          up
          spark={[4, 6, 5, 9, 12, 12, 15]}
          color="4"
        />
        <StatTile
          label="이탈률"
          value="32.4%"
          delta="1.1%"
          up={false}
          spark={[40, 38, 39, 36, 34, 33, 32]}
          color="3"
        />
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 16 }}
      >
        <Card variant="outlined">
          <CardHead title="월별 방문 · 가입" />
          <Card.Body>
            <LineChart
              labels={['1월', '2월', '3월', '4월', '5월', '6월']}
              series={[
                { name: '방문자', points: [120, 145, 132, 178, 210, 264] },
                { name: '가입자', points: [40, 62, 55, 90, 120, 150] },
              ]}
              format={(v) => v.toLocaleString()}
              height={200}
            />
          </Card.Body>
        </Card>
        <Card variant="outlined">
          <CardHead title="유입 경로" />
          <Card.Body>
            <DonutChart
              data={[
                { label: '검색', value: 4200 },
                { label: '직접', value: 2600 },
                { label: 'SNS', value: 1800 },
                { label: '추천', value: 900 },
              ]}
              format={(v) => v.toLocaleString()}
            />
          </Card.Body>
        </Card>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        <Card variant="outlined">
          <CardHead title="월 목표 달성률" />
          <Card.Body>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Gauge value={72} max={100} label="목표 대비" format={(v) => `${v}%`} color="1" />
            </div>
          </Card.Body>
        </Card>
        <Card variant="outlined">
          <CardHead title="카테고리 성과" />
          <Card.Body>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <RadarChart
                axes={['품질', '가격', '배송', '서비스', '디자인']}
                series={[
                  { name: '자사', values: [82, 68, 90, 75, 88] },
                  { name: '경쟁사', values: [70, 80, 65, 72, 60] },
                ]}
                max={100}
                size={220}
              />
            </div>
          </Card.Body>
        </Card>
      </div>

      <Card variant="outlined">
        <CardHead title="요일 × 시간대 활동" />
        <Card.Body>
          <Heatmap data={HEAT_DATA} rows={HEAT_ROWS} cols={HEAT_COLS} format={(v) => `${v}건`} />
        </Card.Body>
      </Card>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 16,
        }}
      >
        <Card variant="outlined">
          <CardHead title="요일별 주문" />
          <Card.Body>
            <BarChart
              data={[
                { label: '월', value: 32 },
                { label: '화', value: 48 },
                { label: '수', value: 27 },
                { label: '목', value: 61 },
                { label: '금', value: 54 },
                { label: '토', value: 18 },
                { label: '일', value: 12 },
              ]}
              color="2"
              height={180}
            />
          </Card.Body>
        </Card>
        <Card variant="outlined">
          <CardHead title="상위 상품" />
          <Card.Body>
            <Table<Product>
              columns={productCols}
              data={PRODUCTS}
              size="sm"
              type="B"
              getRowId={(r) => r.name}
              defaultSortState={{ columnKey: 'sales', direction: 'desc' }}
            />
          </Card.Body>
        </Card>
      </div>
    </div>
  ),
};

type DayRow = { time: string; orders: number; revenue: string };
const dayCols: TableColumn<DayRow>[] = [
  { key: 'time', header: '시간대' },
  { key: 'orders', header: '주문', align: 'end' },
  { key: 'revenue', header: '매출', align: 'end' },
];
const DAYS = [
  { label: '월', value: 32 },
  { label: '화', value: 48 },
  { label: '수', value: 27 },
  { label: '목', value: 61 },
  { label: '금', value: 54 },
  { label: '토', value: 18 },
  { label: '일', value: 12 },
];
const breakdown = (total: number): DayRow[] => [
  { time: '오전', orders: Math.round(total * 0.3), revenue: `₩${(total * 0.3 * 24).toFixed(0)}K` },
  {
    time: '오후',
    orders: Math.round(total * 0.45),
    revenue: `₩${(total * 0.45 * 24).toFixed(0)}K`,
  },
  {
    time: '저녁',
    orders: Math.round(total * 0.25),
    revenue: `₩${(total * 0.25 * 24).toFixed(0)}K`,
  },
];

/** Linked interaction: click a bar (or donut slice) and the detail panel updates. */
export const Linked: StoryObj = {
  render: () => {
    const [sel, setSel] = useState<number | null>(3);
    const day = sel != null ? DAYS[sel] : null;
    return (
      <div
        style={{
          maxWidth: 860,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 16,
        }}
      >
        <Card variant="outlined">
          <CardHead title="요일별 주문 · 막대를 클릭하세요" />
          <Card.Body>
            <BarChart
              data={DAYS}
              color="1"
              height={200}
              selectedIndex={sel}
              onSelect={(_, i) => setSel(i)}
            />
          </Card.Body>
        </Card>
        <Card variant="outlined">
          <CardHead title={day ? `${day.label}요일 상세` : '상세'} />
          <Card.Body>
            {day ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 24, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {day.value}건
                </div>
                <Table<DayRow>
                  columns={dayCols}
                  data={breakdown(day.value)}
                  size="sm"
                  getRowId={(r) => r.time}
                />
              </div>
            ) : (
              <span style={{ color: 'var(--tds-color-fg-muted)' }}>
                막대를 클릭하면 상세가 표시됩니다.
              </span>
            )}
          </Card.Body>
        </Card>
      </div>
    );
  },
};
