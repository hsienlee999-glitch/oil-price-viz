// Recharts timeline with brush + event annotations (slide 2 mock).
// Click an event dot or drag the brush to change the selected day.
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Brush,
  ResponsiveContainer,
  ReferenceDot,
  Legend,
} from 'recharts';

const fmt = d => {
  const dt = new Date(d);
  return `${dt.getUTCMonth() + 1}/${dt.getUTCDate()}`;
};

export default function Timeline({ prices, events, selectedDate, onSelectDate }) {
  if (!prices || prices.length === 0) {
    return <div className="loading">Loading timeline…</div>;
  }

  // Map events to chart coordinates (only events with a matching daily row).
  const dateToBrent = new Map(prices.map(p => [p.date, Number(p.brent_usd)]));
  const eventDots = (events || [])
    .filter(e => dateToBrent.has(e.date))
    .map(e => ({ ...e, y: dateToBrent.get(e.date) }));

  const handleClick = (chartEvent) => {
    if (chartEvent && chartEvent.activeLabel) {
      onSelectDate(chartEvent.activeLabel);
    }
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={prices}
        margin={{ top: 10, right: 20, bottom: 0, left: 0 }}
        onClick={handleClick}
      >
        <CartesianGrid stroke="#243650" strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={fmt}
          stroke="#8aa1c2"
          fontSize={11}
          minTickGap={24}
        />
        <YAxis
          yAxisId="brent"
          stroke="#f5a623"
          fontSize={11}
          tickFormatter={v => `$${v}`}
          domain={['auto', 'auto']}
        />
        <YAxis
          yAxisId="gas"
          orientation="right"
          stroke="#4aa3f5"
          fontSize={11}
          tickFormatter={v => `$${v}`}
          domain={['auto', 'auto']}
        />
        <Tooltip
          contentStyle={{ background: '#1a2a44', border: '1px solid #243650', fontSize: 12 }}
          labelStyle={{ color: '#e8eef9' }}
          formatter={(v, n) => [`$${Number(v).toFixed(2)}`, n]}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />

        <Line
          yAxisId="brent"
          type="monotone"
          dataKey="brent_usd"
          name="Brent ($/bbl)"
          stroke="#f5a623"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          yAxisId="gas"
          type="monotone"
          dataKey="us_gas_avg"
          name="US gas ($/gal)"
          stroke="#4aa3f5"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />

        {/* Selected-day marker */}
        {selectedDate && dateToBrent.has(selectedDate) && (
          <ReferenceDot
            yAxisId="brent"
            x={selectedDate}
            y={dateToBrent.get(selectedDate)}
            r={6}
            fill="#fff"
            stroke="#f5a623"
            strokeWidth={2}
          />
        )}

        {/* Event markers */}
        {eventDots.map(e => (
          <ReferenceDot
            key={e.id}
            yAxisId="brent"
            x={e.date}
            y={e.y}
            r={4}
            fill="#e84545"
            stroke="#fff"
            strokeWidth={1}
            onClick={() => onSelectDate(e.date)}
            style={{ cursor: 'pointer' }}
          />
        ))}

        <Brush
          dataKey="date"
          height={22}
          stroke="#4aa3f5"
          travellerWidth={8}
          tickFormatter={fmt}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
