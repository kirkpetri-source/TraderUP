from fastapi import APIRouter, status

from app.schemas.alert import AlertCreate, AlertRead
from app.services.alert_store import alert_store

router = APIRouter()


@router.get("/", response_model=list[AlertRead])
async def list_alerts() -> list[AlertRead]:
    return list(alert_store.list())


@router.post("/", response_model=AlertRead, status_code=status.HTTP_201_CREATED)
async def create_alert(payload: AlertCreate) -> AlertRead:
    # Endpoint útil para testes e simulações enquanto integração real não está pronta
    return alert_store.create(payload)
