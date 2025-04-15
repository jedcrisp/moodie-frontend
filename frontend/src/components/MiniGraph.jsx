import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function MiniGraph({ data }) {
  return (
    <ResponsiveContainer width="100%" height={60}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="mood" stroke="#6366f1" strokeWidth={2} dot={false} />
        <XAxis dataKey="date" hide />
        <YAxis domain={[1, 5]} hide />
        <Tooltip />
      </LineChart>
    </ResponsiveContainer>
  );
}
