// D3 choropleth of the lower-48 + AK/HI, colored by per-state gas price.
// Uses the public us-atlas TopoJSON (no GIS dependency, per slide 5 rationale).
import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';

const US_ATLAS = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

// FIPS id → state name (us-atlas uses 2-digit string FIPS).
const FIPS_TO_STATE = {
  '01': 'Alabama', '02': 'Alaska', '04': 'Arizona', '05': 'Arkansas',
  '06': 'California', '08': 'Colorado', '09': 'Connecticut', '10': 'Delaware',
  '11': 'District of Columbia', '12': 'Florida', '13': 'Georgia', '15': 'Hawaii',
  '16': 'Idaho', '17': 'Illinois', '18': 'Indiana', '19': 'Iowa', '20': 'Kansas',
  '21': 'Kentucky', '22': 'Louisiana', '23': 'Maine', '24': 'Maryland',
  '25': 'Massachusetts', '26': 'Michigan', '27': 'Minnesota', '28': 'Mississippi',
  '29': 'Missouri', '30': 'Montana', '31': 'Nebraska', '32': 'Nevada',
  '33': 'New Hampshire', '34': 'New Jersey', '35': 'New Mexico', '36': 'New York',
  '37': 'North Carolina', '38': 'North Dakota', '39': 'Ohio', '40': 'Oklahoma',
  '41': 'Oregon', '42': 'Pennsylvania', '44': 'Rhode Island', '45': 'South Carolina',
  '46': 'South Dakota', '47': 'Tennessee', '48': 'Texas', '49': 'Utah',
  '50': 'Vermont', '51': 'Virginia', '53': 'Washington', '54': 'West Virginia',
  '55': 'Wisconsin', '56': 'Wyoming',
};

export default function USMap({ statePrices }) {
  const svgRef = useRef(null);
  const [topology, setTopology] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  // Fetch the TopoJSON once.
  useEffect(() => {
    let cancelled = false;
    fetch(US_ATLAS)
      .then(r => r.json())
      .then(t => {
        if (!cancelled) setTopology(t);
      })
      .catch(err => console.error('Failed to load US topology', err));
    return () => { cancelled = true; };
  }, []);

  // Look up table: state name → row.
  const byState = useMemo(() => {
    const m = new Map();
    (statePrices || []).forEach(row => m.set(row.state, row));
    return m;
  }, [statePrices]);

  const colorScale = useMemo(() => {
    const vals = (statePrices || []).map(r => Number(r.gas_price)).filter(Number.isFinite);
    if (vals.length === 0) return () => '#2a3d5a';
    const min = d3.min(vals);
    const max = d3.max(vals);
    return d3.scaleSequential()
      .domain([min, max])
      .interpolator(d3.interpolateYlOrRd);
  }, [statePrices]);

  useEffect(() => {
    if (!topology || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = svgRef.current.getBoundingClientRect();
    const states = feature(topology, topology.objects.states);

    const projection = d3.geoAlbersUsa().fitSize([width, height], states);
    const path = d3.geoPath(projection);

    svg.append('g')
      .selectAll('path')
      .data(states.features)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('fill', d => {
        const name = FIPS_TO_STATE[d.id];
        const row = byState.get(name);
        if (!row || row.gas_price == null) return '#2a3d5a';
        return colorScale(Number(row.gas_price));
      })
      .on('mousemove', (event, d) => {
        const name = FIPS_TO_STATE[d.id] || `FIPS ${d.id}`;
        const row = byState.get(name);
        setTooltip({
          x: event.clientX,
          y: event.clientY,
          state: name,
          row,
        });
      })
      .on('mouseleave', () => setTooltip(null));
  }, [topology, byState, colorScale]);

  const vals = (statePrices || []).map(r => Number(r.gas_price)).filter(Number.isFinite);
  const lo = vals.length ? d3.min(vals).toFixed(2) : '';
  const hi = vals.length ? d3.max(vals).toFixed(2) : '';

  return (
    <div className="us-map" style={{ flex: 1, minHeight: 0, position: 'relative' }}>
      <svg ref={svgRef} />
      <div className="legend">
        <span>Gas $/gal</span>
        <span>${lo}</span>
        <span className="swatch" />
        <span>${hi}</span>
      </div>
      {tooltip && (
        <div
          className="tooltip"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          <div className="ttl">{tooltip.state}</div>
          {tooltip.row ? (
            <>
              <div className="row"><span>Region</span><span>{tooltip.row.region || '—'}</span></div>
              <div className="row"><span>Gas (Mar 19)</span><span>${Number(tooltip.row.gas_price).toFixed(2)}</span></div>
              <div className="row"><span>Pre-war (Feb 27)</span><span>${Number(tooltip.row.gas_prewar).toFixed(2)}</span></div>
              <div className="row"><span>% increase</span><span>{Number(tooltip.row.pct_increase).toFixed(1)}%</span></div>
              <div className="row"><span>vs national</span><span>{Number(tooltip.row.vs_national) >= 0 ? '+' : ''}${Number(tooltip.row.vs_national).toFixed(2)}</span></div>
            </>
          ) : (
            <div className="row"><span>No data</span></div>
          )}
        </div>
      )}
    </div>
  );
}
