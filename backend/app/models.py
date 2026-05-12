"""SQLAlchemy ORM models — one-to-one with the schema diagram on slide 3.

Three normalized tables:
  - daily_oil_prices  : time-series core (Brent/WTI/Dubai + US gas/diesel averages)
  - state_gas_prices  : choropleth feed (per-state gas price snapshot)
  - key_events        : timeline markers (FK on date → daily_oil_prices)

All `date` columns are indexed (B-tree) to accelerate timeline queries.
"""
from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    Numeric,
    Text,
    Index,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from .database import Base


class DailyOilPrice(Base):
    __tablename__ = "daily_oil_prices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=False, unique=True, index=True)
    brent_usd = Column(Numeric(6, 2))
    wti_usd = Column(Numeric(6, 2))
    dubai_usd = Column(Numeric(6, 2))
    us_gas_avg = Column(Numeric(5, 3))
    us_diesel_avg = Column(Numeric(5, 3))
    war_day = Column(Integer)
    phase = Column(String(64))

    events = relationship(
        "KeyEvent",
        primaryjoin="DailyOilPrice.date == foreign(KeyEvent.date)",
        viewonly=True,
    )


class StateGasPrice(Base):
    __tablename__ = "state_gas_prices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    state = Column(String(64), nullable=False, index=True)
    region = Column(String(32))
    snapshot_date = Column(Date, nullable=False, index=True)
    gas_price = Column(Numeric(5, 3))
    gas_prewar = Column(Numeric(5, 3))
    pct_increase = Column(Numeric(5, 2))
    vs_national = Column(Numeric(5, 2))


class KeyEvent(Base):
    __tablename__ = "key_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    # FK is logical (by date). Kept as a plain indexed Date column so events can
    # exist on days we haven't yet ingested into daily_oil_prices.
    date = Column(Date, nullable=False, index=True)
    event_title = Column(String(255), nullable=False)
    description = Column(Text)
    war_day = Column(Integer)
    category = Column(String(64))
    brent_price = Column(Numeric(6, 2))


# Extra composite indexes for the most common query patterns.
Index("ix_state_gas_state_date", StateGasPrice.state, StateGasPrice.snapshot_date)
Index("ix_events_category_date", KeyEvent.category, KeyEvent.date)
