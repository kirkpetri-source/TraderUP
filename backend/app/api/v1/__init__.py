from fastapi import APIRouter

from . import strategies, alerts, health, simulations

router = APIRouter()
router.include_router(health.router, tags=["health"])
router.include_router(strategies.router, prefix="/strategies", tags=["strategies"])
router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
router.include_router(simulations.router, prefix="/simulations", tags=["simulations"])
