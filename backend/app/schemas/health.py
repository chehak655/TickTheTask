from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str = "ok"


class DetailedHealthResponse(BaseModel):
    status: str = "ok"
    database: str
    service: str
    version: str
