from fastapi import APIRouter

router = APIRouter()


@router.get("/health", summary="Verifica status da API")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
