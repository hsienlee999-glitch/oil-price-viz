"""CRUD routes for /api/oil-prices — covers all 5 oil-price endpoints in slide 6."""
from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/oil-prices", tags=["oil-prices"])


@router.get("", response_model=List[schemas.DailyOilPriceOut])
def list_oil_prices(db: Session = Depends(get_db)):
    """List every daily oil price record (chronologically)."""
    return crud.list_oil_prices(db)


@router.get("/{on_date}", response_model=schemas.OilPriceWithEvents)
def get_oil_price_for_date(on_date: date, db: Session = Depends(get_db)):
    """Return the daily record for `on_date` along with any events on that day."""
    obj = crud.get_oil_price_by_date(db, on_date)
    if obj is None:
        raise HTTPException(status_code=404, detail=f"No oil price record on {on_date}")
    events = crud.events_on(db, on_date)
    payload = schemas.OilPriceWithEvents.model_validate(obj).model_dump()
    payload["events"] = [schemas.KeyEventOut.model_validate(e).model_dump() for e in events]
    return payload


@router.post("", response_model=schemas.DailyOilPriceOut, status_code=status.HTTP_201_CREATED)
def create_oil_price(
    payload: schemas.DailyOilPriceCreate, db: Session = Depends(get_db)
):
    """Create a new daily oil price record."""
    if crud.get_oil_price_by_date(db, payload.date) is not None:
        raise HTTPException(
            status_code=409,
            detail=f"A record for {payload.date} already exists.",
        )
    return crud.create_oil_price(db, payload)


@router.put("/{oil_id}", response_model=schemas.DailyOilPriceOut)
def update_oil_price(
    oil_id: int,
    payload: schemas.DailyOilPriceUpdate,
    db: Session = Depends(get_db),
):
    """Patch any subset of fields on an existing record."""
    obj = crud.get_oil_price(db, oil_id)
    if obj is None:
        raise HTTPException(status_code=404, detail=f"id={oil_id} not found")
    return crud.update_oil_price(db, obj, payload)


@router.delete("/{oil_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_oil_price(oil_id: int, db: Session = Depends(get_db)):
    """Delete a record by primary key."""
    obj = crud.get_oil_price(db, oil_id)
    if obj is None:
        raise HTTPException(status_code=404, detail=f"id={oil_id} not found")
    crud.delete_oil_price(db, obj)
    return None
