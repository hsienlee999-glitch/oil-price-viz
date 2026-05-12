// Right-side detail panel: stats for the selected day + every conflict event.

const CATEGORY_COLOR = {
  'Conflict Start': '#e84545',
  'Energy Infrastructure': '#ff8a3a',
  'Policy Response': '#4aa3f5',
  'Price Record': '#f5a623',
  'Diplomatic': '#7c5cff',
  'Market Reaction': '#2ec4b6',
};

function colorFor(cat) {
  return CATEGORY_COLOR[cat] || '#8aa1c2';
}

function fmtMoney(v, digits = 2) {
  if (v == null) return '—';
  return `$${Number(v).toFixed(digits)}`;
}

function fmtLongDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  });
}

function fmtShortDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', timeZone: 'UTC',
  });
}

function EventCard({ event, isSelected, onClick }) {
  const c = colorFor(event.category);
  return (
    <div
      className={`event-card ${isSelected ? 'is-selected' : ''}`}
      style={{ borderLeftColor: c }}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="event-card-head">
        <span className="event-date">{fmtShortDate(event.date)}</span>
        {event.war_day != null && (
          <span className="event-warday">
            {event.war_day <= 0 ? `D${event.war_day}` : `Day ${event.war_day}`}
          </span>
        )}
        {event.category && (
          <span
            className="event-cat-chip"
            style={{ background: c + '22', color: c, borderColor: c + '55' }}
          >
            {event.category}
          </span>
        )}
        {event.brent_price != null && (
          <span className="event-brent">Brent {fmtMoney(event.brent_price)}</span>
        )}
      </div>
      <div className="event-title">{event.event_title}</div>
      {event.description && <div className="event-desc">{event.description}</div>}
    </div>
  );
}

export default function DetailPanel({
  selectedDate,
  dayDetail,
  allEvents,
  onSelectDate,
}) {
  const sortedEvents = [...(allEvents || [])].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="pane detail-pane">
      <h2>Daily Snapshot</h2>
      <div className="date-line">
        {fmtLongDate(selectedDate)}
        {dayDetail?.war_day != null && <span> · War day {dayDetail.war_day}</span>}
      </div>

      {!dayDetail ? (
        <div className="loading" style={{ height: 60 }}>Pick a day from the timeline.</div>
      ) : (
        <div className="stat-grid">
          <div className="stat"><div className="lbl">Brent</div><div className="val">{fmtMoney(dayDetail.brent_usd)}</div></div>
          <div className="stat"><div className="lbl">WTI</div><div className="val">{fmtMoney(dayDetail.wti_usd)}</div></div>
          <div className="stat"><div className="lbl">Dubai</div><div className="val">{fmtMoney(dayDetail.dubai_usd)}</div></div>
          <div className="stat"><div className="lbl">US gas avg</div><div className="val">{fmtMoney(dayDetail.us_gas_avg, 3)}</div></div>
          <div className="stat"><div className="lbl">US diesel avg</div><div className="val">{fmtMoney(dayDetail.us_diesel_avg, 3)}</div></div>
          <div className="stat"><div className="lbl">Phase</div><div className="val phase">{dayDetail.phase || '—'}</div></div>
        </div>
      )}

      <p className="section-title">
        All conflict events
        <span className="count-pill">{sortedEvents.length}</span>
      </p>
      <div className="event-list">
        {sortedEvents.length === 0 && (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>No events to display.</div>
        )}
        {sortedEvents.map(e => (
          <EventCard
            key={e.id}
            event={e}
            isSelected={e.date === selectedDate}
            onClick={() => onSelectDate && onSelectDate(e.date)}
          />
        ))}
      </div>
    </div>
  );
}
