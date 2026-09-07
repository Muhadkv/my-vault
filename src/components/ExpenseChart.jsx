import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatMoney } from '../lib/categories'

const COLORS = ['#3FA796', '#E8735C', '#E8A65C', '#5C9DE8', '#B05CE8', '#E85C9D', '#8B97A6']

export default function ExpenseChart({ data }) {
  if (data.length === 0) return null
  return (
    <div style={{ height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="total" nameKey="category" innerRadius={50} outerRadius={80} paddingAngle={3}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--surface)" strokeWidth={2} />)}
          </Pie>
          <Tooltip
            contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
            formatter={(value) => formatMoney(value)}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
