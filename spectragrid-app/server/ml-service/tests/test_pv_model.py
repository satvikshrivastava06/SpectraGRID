import sys
import os
import pytest
from fastapi.testclient import TestClient

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from physics.pv_model import compute_pvlib_expected_power

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "spectragrid-ml-service"

def test_pvlib_physics_different_weather_windows():
    asset_config = {
        "asset_id": "TEST-PANEL",
        "latitude": 23.18,
        "longitude": 79.98,
        "capacity_kwp": 500.0,
        "tilt_deg": 20.0,
        "azimuth_deg": 180.0
    }
    
    # Sunny high-irradiance window
    high_irradiance_weather = [
        {"ghi": 950.0, "dni": 750.0, "dhi": 200.0, "temp_air": 32.0, "wind_speed": 2.0} for _ in range(8)
    ]
    
    # Overcast low-irradiance window
    low_irradiance_weather = [
        {"ghi": 250.0, "dni": 100.0, "dhi": 150.0, "temp_air": 22.0, "wind_speed": 4.0} for _ in range(8)
    ]
    
    res_high = compute_pvlib_expected_power(asset_config, high_irradiance_weather)
    res_low = compute_pvlib_expected_power(asset_config, low_irradiance_weather)
    
    assert res_high["total_expected_kwh"] > res_low["total_expected_kwh"]
    assert res_high["data_points"] == 8

def test_pvlib_physics_tilt_variation():
    weather = [
        {"ghi": 800.0, "dni": 600.0, "dhi": 200.0, "temp_air": 28.0, "wind_speed": 2.0} for _ in range(8)
    ]
    
    config_tilt_20 = {
        "asset_id": "TEST-PANEL",
        "latitude": 23.18,
        "longitude": 79.98,
        "capacity_kwp": 500.0,
        "tilt_deg": 20.0,
        "azimuth_deg": 180.0
    }
    
    config_tilt_60 = {
        "asset_id": "TEST-PANEL",
        "latitude": 23.18,
        "longitude": 79.98,
        "capacity_kwp": 500.0,
        "tilt_deg": 60.0,
        "azimuth_deg": 180.0
    }
    
    res_20 = compute_pvlib_expected_power(config_tilt_20, weather)
    res_60 = compute_pvlib_expected_power(config_tilt_60, weather)
    
    # Tilting changes total POA irradiance and calculated power
    assert res_20["total_expected_kwh"] != res_60["total_expected_kwh"]

def test_physics_expected_power_fastapi_route():
    payload = {
        "asset_config": {
            "asset_id": "FASTAPI-TEST",
            "latitude": 28.61,  # Dynamic latitude (Delhi)
            "longitude": 77.20, # Dynamic longitude (Delhi)
            "capacity_kwp": 1000.0,
            "tilt_deg": 25.0
        },
        "weather_window": [
            {"ghi": 900.0, "temp_air": 30.0, "wind_speed": 2.0}
        ]
    }
    
    response = client.post("/physics/expected-power", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "total_expected_kwh" in data
    assert data["latitude"] == 28.61
    assert data["longitude"] == 77.20

def test_ml_detect_anomaly_route():
    # Nominal sample
    nominal_payload = {
        "irradiance_ghi": 850.0, "ambient_temperature": 28.0, "module_temperature": 40.0,
        "dc_voltage": 640.0, "dc_current": 10.5, "dc_power": 6.72,
        "ac_voltage": 400.0, "ac_current": 9.5, "ac_power": 6.45,
        "frequency": 50.0, "power_factor": 0.99, "inverter_temperature": 48.0, "inverter_efficiency": 0.96
    }
    
    resp_nom = client.post("/ml/detect-anomaly", json=nominal_payload)
    assert resp_nom.status_code == 200
    data_nom = resp_nom.json()
    assert "isAnomalous" in data_nom
    assert "anomalyScore" in data_nom
    
    # Anomaly sample (Thermal degradation)
    anomalous_payload = {
        "irradiance": 850.0, "temperature": 75.0, "power": 1.2,
        "inverter_temperature": 85.0, "inverter_efficiency": 0.65
    }
    resp_anom = client.post("/ml/detect-anomaly", json=anomalous_payload)
    assert resp_anom.status_code == 200
    data_anom = resp_anom.json()
    assert data_anom["isAnomalous"] is True

def test_ml_explain_route_and_shap_attributions():
    # Sample 1: Thermal degradation
    sample_1 = {
        "irradiance": 850.0, "temperature": 78.0, "power": 1.0,
        "inverter_temperature": 88.0, "inverter_efficiency": 0.68
    }
    # Sample 2: Soiling yield deficit
    sample_2 = {
        "irradiance_ghi": 900.0, "ambient_temperature": 25.0, "module_temperature": 35.0,
        "dc_voltage": 640.0, "dc_current": 4.0, "dc_power": 2.56,
        "ac_voltage": 400.0, "ac_current": 3.6, "ac_power": 2.45,
        "frequency": 50.0, "power_factor": 0.99, "inverter_temperature": 40.0, "inverter_efficiency": 0.95
    }
    
    resp_1 = client.post("/ml/explain", json=sample_1)
    resp_2 = client.post("/ml/explain", json=sample_2)
    
    assert resp_1.status_code == 200
    assert resp_2.status_code == 200
    
    data_1 = resp_1.json()
    data_2 = resp_2.json()
    
    assert "predictedClass" in data_1
    assert "shapAttribution" in data_1
    assert "confidence" in data_1
    assert data_1["isEfficiencyPropertyValid"] is True
    
    # SHAP attributions differ between two distinct fault samples
    assert data_1["shapAttribution"] != data_2["shapAttribution"]

