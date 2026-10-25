import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import initialize_database, test_db_connection
from routes.health import router as health_router
from routes.reconciliation import router as reconciliation_router
from routes.upload import router as upload_router
from routes.reviews import router as reviews_router
from routes.export import router as export_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize application tables safely on startup
    db_status = test_db_connection()
    if db_status["connected"]:
        initialize_database()
        print(f"LedgerLens Backend ready. Exasol DB connected: {db_status['version']}")
    else:
        print(f"WARNING: Exasol DB not connected on startup: {db_status['error']}")
    yield

app = FastAPI(
    title="LedgerLens API",
    description="Financial Reconciliation Engine powered by Exasol SQL for ExaThon India 2026",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
origins = [o.strip() for o in origins_str.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Route Handlers
app.include_router(health_router)
app.include_router(reconciliation_router)
app.include_router(upload_router)
app.include_router(reviews_router)
app.include_router(export_router)

@app.get("/")
def root():
    return {
        "product": "LedgerLens",
        "tagline": "Every discrepancy has a story. Find the evidence behind it.",
        "status": "operational",
        "engine": "Exasol SQL Analytical Backend",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("APP_HOST", "127.0.0.1")
    port = int(os.getenv("APP_PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=True)
