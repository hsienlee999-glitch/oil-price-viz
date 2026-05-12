"""CRUD helpers — keep router code thin."""
from datetime import date
from typing import List, Optional

from sqlalchemy.orm import Session

from . import models, schemas


# ---------- daily_oil_prices ----------

def list_oil_prices(db: Session) -> List[models.DailyOilPrice]:
    return (
        db.query(models.DailyOilPrice)
        .order_by(models.DailyOilPrice.date.asc())
        .all()
    )


def get_oil_price_by_date(db: Session, d: date) -> Optional[models.DailyOilPrice]:
    return (
        db.query(models.DailyOilPrice)
        .filter(models.DailyOilPrice.date == d)
        .first()
    )


def get_oil_price(db: Session, oil_id: int) -> Optional[models.DailyOilPrice]:
    return db.get(models.DailyOilPrice, oil_id)


def create_oil_price(db: Session, payload: schemas.DailyOilPriceCreate) -> models.DailyOilPrice:
    obj = models.DailyOilPrice(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_oil_price(
    db: Session, obj: models.DailyOilPrice, payload: schemas.DailyOilPriceUpdate
) -> models.DailyOilPrice:
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def delete_oil_price(db: Session, obj: models.DailyOilPrice) -> None:
    db.delete(obj)
    db.commit()


# ---------- state_gas_prices ----------

def list_state_prices(db: Session, on: Optional[date] = None) -> List[models.StateGasPrice]:
    q = db.query(models.StateGasPrice)
    if on is not None:
        q = q.filter(models.StateGasPrice.snapshot_date == on)
    return q.order_by(models.StateGasPrice.state.asc()).all()


def latest_state_snapshot_date(db: Session) -> Optional[date]:
    row = (
        db.query(models.StateGasPrice.snapshot_date)
        .order_by(models.StateGasPrice.snapshot_date.desc())
        .first()
    )
    return row[0] if row else None


# ---------- key_events ----------

def list_events(db: Session) -> List[models.KeyEvent]:
    return db.query(models.KeyEvent).order_by(models.KeyEvent.date.asc()).all()


def events_on(db: Session, d: date) -> List[models.KeyEvent]:
    return db.query(models.KeyEvent).filter(models.KeyEvent.date == d).all()
