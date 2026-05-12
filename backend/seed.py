"""Seed the database from the three source CSVs (slide 4 — `Seed Scripts`).

Run:  python seed.py
Idempotent: clears each table before inserting so re-running won't duplicate.
"""
import csv
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path

from app.database import Base, SessionLocal, engine
from app.models import DailyOilPrice, KeyEvent, StateGasPrice

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


# ---------- helpers ----------

def _parse_date(s: str):
    return datetime.strptime(s.strip(), "%Y-%m-%d").date()


def _to_decimal(s):
    if s is None:
        return None
    s = str(s).strip()
    if s == "" or s.lower() == "none" or s.lower() == "nan":
        return None
    try:
        return Decimal(s)
    except InvalidOperation:
        return None


def _to_int(s):
    if s is None or str(s).strip() == "":
        return None
    try:
        return int(float(s))
    except ValueError:
        return None


# ---------- loaders ----------

def load_daily_oil_prices(db, csv_path: Path):
    print(f"[daily_oil_prices] loading {csv_path.name} ...")
    with csv_path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = []
        for r in reader:
            rows.append(
                DailyOilPrice(
                    date=_parse_date(r["date"]),
                    brent_usd=_to_decimal(r.get("brent_usd_barrel")),
                    wti_usd=_to_decimal(r.get("wti_usd_barrel")),
                    dubai_usd=_to_decimal(r.get("dubai_usd_barrel")),
                    us_gas_avg=_to_decimal(r.get("us_gas_avg_gallon")),
                    us_diesel_avg=_to_decimal(r.get("us_diesel_avg_gallon")),
                    war_day=_to_int(r.get("war_day")),
                    phase=(r.get("phase") or None),
                )
            )
        db.add_all(rows)
        db.commit()
        print(f"  inserted {len(rows)} rows")


def load_state_gas_prices(db, csv_path: Path):
    print(f"[state_gas_prices] loading {csv_path.name} ...")
    # Source column reflects the post-war snapshot date: 2026-03-19.
    snapshot_date = _parse_date("2026-03-19")
    with csv_path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = []
        for r in reader:
            rows.append(
                StateGasPrice(
                    state=r["state"].strip(),
                    region=(r.get("region") or "").strip() or None,
                    snapshot_date=snapshot_date,
                    gas_price=_to_decimal(r.get("gas_price_mar19_2026")),
                    gas_prewar=_to_decimal(r.get("gas_price_prewar_feb27")),
                    pct_increase=_to_decimal(r.get("pct_increase_since_war")),
                    vs_national=_to_decimal(r.get("price_vs_national_avg")),
                )
            )
        db.add_all(rows)
        db.commit()
        print(f"  inserted {len(rows)} rows")


def load_key_events(db, csv_path: Path):
    print(f"[key_events] loading {csv_path.name} ...")
    with csv_path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = []
        for r in reader:
            rows.append(
                KeyEvent(
                    date=_parse_date(r["date"]),
                    event_title=r["event_title"].strip(),
                    description=(r.get("description") or "").strip() or None,
                    war_day=_to_int(r.get("war_day")),
                    category=(r.get("category") or "").strip() or None,
                    brent_price=_to_decimal(r.get("brent_price_that_day")),
                )
            )
        db.add_all(rows)
        db.commit()
        print(f"  inserted {len(rows)} rows")


def main():
    # Make sure tables exist.
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Wipe (idempotent re-run).
        for model in (KeyEvent, StateGasPrice, DailyOilPrice):
            db.query(model).delete()
        db.commit()

        load_daily_oil_prices(db, DATA_DIR / "iran_war_oil_prices_daily_2026.csv")
        load_state_gas_prices(db, DATA_DIR / "iran_war_gas_prices_by_state.csv")
        load_key_events(db, DATA_DIR / "iran_war_key_events_timeline.csv")

        print("\nDone. Counts:")
        print(f"  daily_oil_prices : {db.query(DailyOilPrice).count()}")
        print(f"  state_gas_prices : {db.query(StateGasPrice).count()}")
        print(f"  key_events       : {db.query(KeyEvent).count()}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
