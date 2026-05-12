"""Pydantic v2 request/response schemas — match the JSON shape the React client expects."""
from datetime import date
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


# ---------- daily_oil_prices ----------

class DailyOilPriceBase(BaseModel):
    date: date
    brent_usd: Optional[Decimal] = None
    wti_usd: Optional[Decimal] = None
    dubai_usd: Optional[Decimal] = None
    us_gas_avg: Optional[Decimal] = None
    us_diesel_avg: Optional[Decimal] = None
    war_day: Optional[int] = None
    phase: Optional[str] = None


class DailyOilPriceCreate(DailyOilPriceBase):
    pass


class DailyOilPriceUpdate(BaseModel):
    brent_usd: Optional[Decimal] = None
    wti_usd: Optional[Decimal] = None
    dubai_usd: Optional[Decimal] = None
    us_gas_avg: Optional[Decimal] = None
    us_diesel_avg: Optional[Decimal] = None
    war_day: Optional[int] = None
    phase: Optional[str] = None


class DailyOilPriceOut(DailyOilPriceBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ---------- key_events ----------

class KeyEventBase(BaseModel):
    date: date
    event_title: str
    description: Optional[str] = None
    war_day: Optional[int] = None
    category: Optional[str] = None
    brent_price: Optional[Decimal] = None


class KeyEventOut(KeyEventBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ---------- state_gas_prices ----------

class StateGasPriceBase(BaseModel):
    state: str
    region: Optional[str] = None
    snapshot_date: date
    gas_price: Optional[Decimal] = None
    gas_prewar: Optional[Decimal] = None
    pct_increase: Optional[Decimal] = None
    vs_national: Optional[Decimal] = None


class StateGasPriceOut(StateGasPriceBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ---------- composite responses ----------

class OilPriceWithEvents(DailyOilPriceOut):
    """GET /api/oil-prices/{date} — single day with attached events."""
    events: List[KeyEventOut] = []
