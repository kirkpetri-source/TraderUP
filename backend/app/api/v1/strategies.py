from fastapi import APIRouter, HTTPException, status

from app.schemas.strategy import StrategyCreate, StrategyRead, StrategyUpdate
from app.services.strategy_store import strategy_store
from app.services.market_stream import market_stream_service

router = APIRouter()


@router.get("/", response_model=list[StrategyRead])
async def list_strategies() -> list[StrategyRead]:
    return list(strategy_store.list())


@router.post("/", response_model=StrategyRead, status_code=status.HTTP_201_CREATED)
async def create_strategy(payload: StrategyCreate) -> StrategyRead:
    strategy = strategy_store.create(payload)
    await market_stream_service.register_strategy(strategy)
    return strategy


@router.get("/{strategy_id}", response_model=StrategyRead)
async def get_strategy(strategy_id: int) -> StrategyRead:
    strategy = strategy_store.get(strategy_id)
    if not strategy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estratégia não encontrada")
    return strategy


@router.patch("/{strategy_id}", response_model=StrategyRead)
async def update_strategy(strategy_id: int, payload: StrategyUpdate) -> StrategyRead:
    existing = strategy_store.get(strategy_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estratégia não encontrada")
    await market_stream_service.unregister_strategy(existing)
    updated = strategy_store.update(strategy_id, payload)
    await market_stream_service.register_strategy(updated)
    return updated


@router.delete("/{strategy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_strategy(strategy_id: int) -> None:
    strategy = strategy_store.get(strategy_id)
    if not strategy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estratégia não encontrada")
    await market_stream_service.unregister_strategy(strategy)
    strategy_store.delete(strategy_id)
