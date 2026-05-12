"""GET /api/state-prices — feeds the choropleth map."""
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/state-prices", tags=["state-prices"])


@router.get("", response_model=List[schemas.StateGasPriceOut])
def list_state_prices(
    on_date: Optional[date] = Query(
        None,
        alias="date",
        description="Snapshot date. Omit to use the latest snapshot in the DB.",
    ),
    db: Session = Depends(get_db),
):
    """Return per-state gas prices for the requested snapshot date.

    Convention from the spec deck: the choropleth uses *one* snapshot at a
    time (a `snapshot_date`). If no date is supplied we fall back to the most
    recent snapshot we have on file.
    """
    if on_date is None:
        on_date = crud.latest_state_snapshot_date(db)
    return crud.list_state_prices(db, on=on_date)
