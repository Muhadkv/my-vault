import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatMoney } from '../lib/categories'

const COLORS = ['#3FA796', '#E8735C', '#E8A65C', '#5C9DE8', '#B05CE8', '#E85C9D', '#8B97A6', '#6FCF97', '#F2994A', '#9B51E0']

export default function ExpenseChart({ data, currency = 'AED' }) {
  if (data.length === 0) return null
  return (
    <div style={{ height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="category"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--surface)" strokeWidth={2} />)}
          </Pie>
          <Tooltip
            contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
            formatter={(value) => formatMoney(value, currency)}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)', paddingTop: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
