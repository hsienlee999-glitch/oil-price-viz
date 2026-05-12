"""FastAPI entrypoint — mounts the three CRUD routers from slide 6."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import events, oil_prices, state_prices

# Create tables on first boot. For production, switch to Alembic migrations.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Oil Price Visualization API",
    description=(
        "CRUD REST backend for the 2026 Israel-Iran conflict oil-price viewer.\n\n"
        "Architecture: FastAPI + SQLAlchemy + PostgreSQL (slide 4).\n"
        "Interactive docs: /docs"
    ),
    version="1.0.0",
)

# Vite dev server runs on 5173 by default. Add prod origins as needed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(oil_prices.router)
app.include_router(state_prices.router)
app.include_router(events.router)


@app.get("/", tags=["meta"])
def root():
    return {
        "name": "Oil Price Visualization API",
        "docs": "/docs",
        "openapi": "/openapi.json",
    }


@app.get("/api/health", tags=["meta"])
def health():
    return {"status": "ok"}
