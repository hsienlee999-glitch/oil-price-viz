"""GET /api/events — feeds the timeline markers."""
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("", response_model=List[schemas.KeyEventOut])
def list_events(db: Session = Depends(get_db)):
    """Return every event marker (chronological)."""
    return crud.list_events(db)
