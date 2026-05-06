from fastapi import FastAPI
from fastapi.responses import Response
from app.middleware.cors import setup_cors
from app.api import upload, match, cluster, review, ubid, events, analytics, anomalies, audit, lifecycle, notifications, export

app = FastAPI(title="EntityNet Backend", version="1.0.0")

# Setup CORS
setup_cors(app)

# Include all routers
app.include_router(upload.router)
app.include_router(match.router)
app.include_router(cluster.router)
app.include_router(review.router)
app.include_router(ubid.router)
app.include_router(events.router)
app.include_router(analytics.router)
app.include_router(anomalies.router)
app.include_router(audit.router)
app.include_router(lifecycle.router)
app.include_router(notifications.router)
app.include_router(export.router)

@app.get("/")
async def root():
    return {"message": "EntityNet Backend is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=204)