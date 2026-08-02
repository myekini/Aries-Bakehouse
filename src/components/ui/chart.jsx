import { cn } from '../../lib/utils.js';

export function ChartContainer({ className, children }) {
  return <div className={cn('ui-chart', className)}>{children}</div>;
}

export function ChartTooltipContent({ active, payload, label, labelFormatter, valueFormatter }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="ui-chart-tooltip">
      <p>{labelFormatter ? labelFormatter(label) : label}</p>
      {payload.map((entry) => (
        <div className="ui-chart-tooltip__row" key={entry.dataKey || entry.name}>
          <span className="ui-chart-tooltip__indicator" style={{ background: entry.color || entry.fill }} />
          <span>{entry.name}</span>
          <strong>{valueFormatter ? valueFormatter(entry.value, entry) : entry.value}</strong>
        </div>
      ))}
    </div>
  );
}
