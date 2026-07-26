import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from physics.pv_model import compute_pvlib_expected_power
from models.ml_engine import detect_anomaly, explain_anomaly

app = FastAPI(
    title="SpectraGRID ML & Physics Service",
    description="pvlib physics calculations & ML anomaly engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AssetConfigInput(BaseModel):
    asset_id: Optional[str] = "AST-JAB-ROOF-A"
    latitude: Optional[float] = 23.18
    longitude: Optional[float] = 79.98
    capacity_kwp: Optional[float] = 500.0
    tilt_deg: Optional[float] = 20.0
    azimuth_deg: Optional[float] = 180.0
    temperature_coefficient: Optional[float] = -0.0035
    inverter_efficiency: Optional[float] = 0.96

class ExpectedPowerRequest(BaseModel):
    asset_config: Optional[AssetConfigInput] = Field(default_factory=AssetConfigInput)
    weather_window: List[Dict[str, Any]]

class TelemetryPayload(BaseModel):
    voltage: Optional[float] = 400.0
    current: Optional[float] = 10.0
    power: Optional[float] = 4.0
    irradiance: Optional[float] = 800.0
    temperature: Optional[float] = 45.0
    irradiance_ghi: Optional[float] = None
    ambient_temperature: Optional[float] = None
    module_temperature: Optional[float] = None
    dc_voltage: Optional[float] = None
    dc_current: Optional[float] = None
    dc_power: Optional[float] = None
    ac_voltage: Optional[float] = None
    ac_current: Optional[float] = None
    ac_power: Optional[float] = None
    frequency: Optional[float] = None
    power_factor: Optional[float] = None
    inverter_temperature: Optional[float] = None
    inverter_efficiency: Optional[float] = None

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "spectragrid-ml-service",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.post("/physics/expected-power")
def calculate_expected_power(payload: ExpectedPowerRequest):
    try:
        asset_dict = payload.asset_config.model_dump() if payload.asset_config else {}
        result = compute_pvlib_expected_power(
            asset_config=asset_dict,
            weather_records=payload.weather_window
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"pvlib calculation error: {str(e)}")

@app.post("/ml/detect-anomaly")
def api_detect_anomaly(payload: Dict[str, Any]):
    try:
        return detect_anomaly(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anomaly detection error: {str(e)}")

@app.post("/ml/explain")
def api_explain_anomaly(payload: Dict[str, Any]):
    try:
        return explain_anomaly(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SHAP explanation error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
