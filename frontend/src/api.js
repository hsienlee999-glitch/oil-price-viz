// Thin axios wrapper around the FastAPI backend (slide 6 endpoint table).
// FastAPI/Pydantic v2 serializes Decimal fields as JSON strings — Recharts
// and D3 need real numbers, so we coerce on the way in.
import axios from 'axios';

const NUMERIC_FIELDS = new Set([
  'brent_usd', 'wti_usd', 'dubai_usd',
  'us_gas_avg', 'us_diesel_avg',
  'gas_price', 'gas_prewar', 'pct_increase', 'vs_national',
  'brent_price',
]);

function coerce(obj) {
  if (Array.isArray(obj)) return obj.map(coerce);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (NUMERIC_FIELDS.has(k) && v != null && v !== '') {
        const n = Number(v);
        out[k] = Number.isFinite(n) ? n : v;
      } else if (v && typeof v === 'object') {
        out[k] = coerce(v);
      } else {
        out[k] = v;
      }
    }
    return out;
  }
  return obj;
}

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Coerce every JSON response.
api.interceptors.response.use(r => { r.data = coerce(r.data); return r; });

export const listOilPrices    = ()           => api.get('/oil-prices').then(r => r.data);
export const getOilPrice      = (date)       => api.get(`/oil-prices/${date}`).then(r => r.data);
export const createOilPrice   = (payload)    => api.post('/oil-prices', payload).then(r => r.data);
export const updateOilPrice   = (id, patch)  => api.put(`/oil-prices/${id}`, patch).then(r => r.data);
export const deleteOilPrice   = (id)         => api.delete(`/oil-prices/${id}`).then(r => r.data);

export const listStatePrices  = (date)       =>
  api.get('/state-prices', { params: date ? { date } : undefined }).then(r => r.data);

export const listEvents       = ()           => api.get('/events').then(r => r.data);

export default api;
