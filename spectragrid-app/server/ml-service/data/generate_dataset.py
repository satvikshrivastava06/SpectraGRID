import os
import argparse
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def fetch_weather_series(latitude: float, longitude: float, start_year: int = 2023, end_year: int = 2024):
    """
    Attempts to fetch NASA POWER hourly weather via pvlib.iotools.get_nasa_power.
    Falls back to high-fidelity synthetic weather if offline or network rate-limited.
    """
    try:
        import socket
        socket.setdefaulttimeout(10)
        import pvlib
        start_date = f"{start_year}0101"
        end_date = f"{end_year}1231"
        print(f"[DATASET] Fetching NASA POWER weather for lat={latitude}, lon={longitude}...")
        df_nasa, meta = pvlib.iotools.get_nasa_power(
            latitude=latitude,
            longitude=longitude,
            start=start_date,
            end=end_date,
            parameters=['ghi', 'dni', 'dhi', 'temp_air', 'wind_speed']
        )
        df_nasa = df_nasa.rename(columns={'temp_air': 'ambient_temperature'})
        # Resample to 15-min intervals
        df_15m = df_nasa.resample('15min').interpolate(method='linear')
        print(f"[DATASET] NASA POWER weather fetched successfully. {len(df_15m)} rows.")
        return df_15m
    except Exception as e:
        print(f"[DATASET] NASA POWER API notice ({e}). Generating high-fidelity solar weather time series...")
        dates = pd.date_range(start=f"{start_year}-01-01", end=f"{end_year}-12-31 23:45:00", freq="15min")
        n = len(dates)
        
        # Diurnal Solar Cycle simulation based on latitude
        day_of_year = dates.dayofyear.values
        hour_of_day = dates.hour.values + dates.minute.values / 60.0
        
        # Solar declination & hour angle approximation
        declination = 23.45 * np.sin(np.radians(360 / 365 * (day_of_year - 81)))
        hour_angle = (hour_of_day - 12) * 15
        lat_rad = np.radians(latitude)
        dec_rad = np.radians(declination)
        
        cos_zenith = np.sin(lat_rad) * np.sin(dec_rad) + np.cos(lat_rad) * np.cos(dec_rad) * np.cos(np.radians(hour_angle))
        cos_zenith = np.clip(cos_zenith, 0, 1)
        
        # Clear sky GHI estimate
        ghi = 1000 * cos_zenith ** 1.2
        # Add random cloud transients
        cloud_factor = np.random.uniform(0.8, 1.0, size=n)
        cloud_events = np.random.choice([0.2, 0.4, 0.6, 1.0], size=n, p=[0.02, 0.03, 0.05, 0.90])
        ghi = ghi * cloud_factor * cloud_events
        
        dni = np.where(ghi > 10, ghi * 0.75 + np.random.normal(0, 20, n), 0)
        dhi = np.where(ghi > 10, ghi * 0.25 + np.random.normal(0, 10, n), 0)
        
        # Ambient temperature seasonal + diurnal variation
        base_temp = 25.0 + 8.0 * np.sin(2 * np.pi * (day_of_year - 100) / 365)
        diurnal_temp = 6.0 * np.sin(2 * np.pi * (hour_of_day - 9) / 24)
        ambient_temp = base_temp + diurnal_temp + np.random.normal(0, 1.5, n)
        
        wind_speed = np.random.weibull(2.0, size=n) * 3.5
        humidity = np.clip(60 - (diurnal_temp * 2) + np.random.normal(0, 5, n), 15, 95)
        
        df_sim = pd.DataFrame({
            'ghi': np.clip(ghi, 0, 1200),
            'dni': np.clip(dni, 0, 1100),
            'dhi': np.clip(dhi, 0, 500),
            'ambient_temperature': ambient_temp,
            'wind_speed': np.clip(wind_speed, 0.1, 20),
            'humidity': humidity
        }, index=dates)
        
        return df_sim

def generate_asset_metadata(latitude: float, longitude: float):
    """
    Creates asset metadata hierarchy table for a campus location.
    """
    assets = [
        {
            "asset_id": "AST-JAB-ROOF-A",
            "campus_id": "camp-1",
            "building_id": "bld-1",
            "rooftop_id": "roof-1a",
            "array_id": "arr-1",
            "string_id": "str-1",
            "inverter_id": "inv-1",
            "capacity_kwp": 500.0,
            "panel_count": 1250,
            "panel_model": "SpectraMono-400W",
            "panel_efficiency": 0.215,
            "temperature_coefficient": -0.0035,
            "tilt_deg": 20.0,
            "azimuth_deg": 180.0,
            "inverter_capacity_kw": 500.0,
            "inverter_model": "SpectraGrid-500K",
            "commission_date": "2022-03-15",
            "latitude": latitude,
            "longitude": longitude
        },
        {
            "asset_id": "AST-JAB-ROOF-B",
            "campus_id": "camp-1",
            "building_id": "bld-2",
            "rooftop_id": "roof-2a",
            "array_id": "arr-2",
            "string_id": "str-2",
            "inverter_id": "inv-2",
            "capacity_kwp": 350.0,
            "panel_count": 875,
            "panel_model": "SpectraMono-400W",
            "panel_efficiency": 0.215,
            "temperature_coefficient": -0.0035,
            "tilt_deg": 15.0,
            "azimuth_deg": 180.0,
            "inverter_capacity_kw": 350.0,
            "inverter_model": "SpectraGrid-350K",
            "commission_date": "2022-06-10",
            "latitude": latitude,
            "longitude": longitude
        },
        {
            "asset_id": "AST-JAB-CARPORT",
            "campus_id": "camp-1",
            "building_id": "bld-3",
            "rooftop_id": "carport-1",
            "array_id": "arr-3",
            "string_id": "str-3",
            "inverter_id": "inv-3",
            "capacity_kwp": 250.0,
            "panel_count": 625,
            "panel_model": "Bifacial-400W",
            "panel_efficiency": 0.220,
            "temperature_coefficient": -0.0033,
            "tilt_deg": 10.0,
            "azimuth_deg": 180.0,
            "inverter_capacity_kw": 250.0,
            "inverter_model": "SpectraGrid-250K",
            "commission_date": "2023-01-20",
            "latitude": latitude,
            "longitude": longitude
        }
    ]
    return pd.DataFrame(assets)

def generate_canonical_dataset(latitude: float = 23.18, longitude: float = 79.98, output_dir: str = "."):
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Weather series
    weather_df = fetch_weather_series(latitude, longitude, start_year=2023, end_year=2024)
    assets_df = generate_asset_metadata(latitude, longitude)
    
    telemetry_rows = []
    fault_events = []
    maintenance_rows = []
    
    event_counter = 1
    maint_counter = 1
    
    print(f"[DATASET] Synthesizing telemetry and fault events for {len(assets_df)} assets...")
    
    # Process for main asset AST-JAB-ROOF-A
    asset = assets_df.iloc[0]
    asset_id = asset["asset_id"]
    capacity_kwp = asset["capacity_kwp"]
    
    timestamps = weather_df.index
    n_records = len(timestamps)
    
    # Generate ground truth state array
    # Target distribution: Normal 75%, Soiling 8%, Shading 4%, Inverter degradation 4%, Inverter trip 2%, Grid events 2%, Sensor anomalies 2%, String fault 3%
    fault_states = np.full(n_records, "NORMAL", dtype=object)
    
    # Inject Fault Intervals
    # 1. Soiling events (2023 train window + 2024 test window)
    s1_start, s1_end = int(n_records * 0.15), int(n_records * 0.20)
    s2_start, s2_end = int(n_records * 0.65), int(n_records * 0.70)
    fault_states[s1_start:s1_end] = "SOILING"
    fault_states[s2_start:s2_end] = "SOILING"
    
    fault_events.extend([
        {
            "event_id": f"FLT-{event_counter:04d}",
            "asset_id": asset_id,
            "start_time": str(timestamps[s1_start]),
            "end_time": str(timestamps[s1_end]),
            "fault_type": "SOILING",
            "severity": "warning",
            "root_cause": "Dust & particulates accumulation during dry spell",
            "affected_capacity_kw": capacity_kwp * 0.25,
            "ground_truth": "SOILING"
        },
        {
            "event_id": f"FLT-{event_counter+1:04d}",
            "asset_id": asset_id,
            "start_time": str(timestamps[s2_start]),
            "end_time": str(timestamps[s2_end]),
            "fault_type": "SOILING",
            "severity": "warning",
            "root_cause": "Dust & particulates accumulation during dry spell",
            "affected_capacity_kw": capacity_kwp * 0.25,
            "ground_truth": "SOILING"
        }
    ])
    event_counter += 2

    # 2. Inverter Degradation events (2023 train window + 2024 test window)
    inv1_start, inv1_end = int(n_records * 0.35), int(n_records * 0.38)
    inv2_start, inv2_end = int(n_records * 0.80), int(n_records * 0.83)
    fault_states[inv1_start:inv1_end] = "INVERTER_DEGRADATION"
    fault_states[inv2_start:inv2_end] = "INVERTER_DEGRADATION"
    
    fault_events.extend([
        {
            "event_id": f"FLT-{event_counter:04d}",
            "asset_id": asset_id,
            "start_time": str(timestamps[inv1_start]),
            "end_time": str(timestamps[inv1_end]),
            "fault_type": "INVERTER_DEGRADATION",
            "severity": "critical",
            "root_cause": "Internal capacitor thermal degradation & efficiency droop",
            "affected_capacity_kw": capacity_kwp * 0.40,
            "ground_truth": "INVERTER_DEGRADATION"
        },
        {
            "event_id": f"FLT-{event_counter+1:04d}",
            "asset_id": asset_id,
            "start_time": str(timestamps[inv2_start]),
            "end_time": str(timestamps[inv2_end]),
            "fault_type": "INVERTER_DEGRADATION",
            "severity": "critical",
            "root_cause": "Internal capacitor thermal degradation & efficiency droop",
            "affected_capacity_kw": capacity_kwp * 0.40,
            "ground_truth": "INVERTER_DEGRADATION"
        }
    ])
    event_counter += 2

    # 3. Inverter Trip events (2023 train + 2024 test)
    t1_start, t1_end = int(n_records * 0.45), int(n_records * 0.455)
    t2_start, t2_end = int(n_records * 0.88), int(n_records * 0.885)
    fault_states[t1_start:t1_end] = "INVERTER_TRIP"
    fault_states[t2_start:t2_end] = "INVERTER_TRIP"
    
    fault_events.extend([
        {
            "event_id": f"FLT-{event_counter:04d}",
            "asset_id": asset_id,
            "start_time": str(timestamps[t1_start]),
            "end_time": str(timestamps[t1_end]),
            "fault_type": "INVERTER_TRIP",
            "severity": "critical",
            "root_cause": "Over-temperature protection latch trip",
            "affected_capacity_kw": capacity_kwp,
            "ground_truth": "INVERTER_TRIP"
        },
        {
            "event_id": f"FLT-{event_counter+1:04d}",
            "asset_id": asset_id,
            "start_time": str(timestamps[t2_start]),
            "end_time": str(timestamps[t2_end]),
            "fault_type": "INVERTER_TRIP",
            "severity": "critical",
            "root_cause": "Over-temperature protection latch trip",
            "affected_capacity_kw": capacity_kwp,
            "ground_truth": "INVERTER_TRIP"
        }
    ])
    event_counter += 2

    # 4. Partial String Failure (2023 train + 2024 test)
    str1_start, str1_end = int(n_records * 0.25), int(n_records * 0.28)
    str2_start, str2_end = int(n_records * 0.92), int(n_records * 0.95)
    fault_states[str1_start:str1_end] = "PARTIAL_STRING_FAILURE"
    fault_states[str2_start:str2_end] = "PARTIAL_STRING_FAILURE"
    
    fault_events.extend([
        {
            "event_id": f"FLT-{event_counter:04d}",
            "asset_id": asset_id,
            "start_time": str(timestamps[str1_start]),
            "end_time": str(timestamps[str1_end]),
            "fault_type": "PARTIAL_STRING_FAILURE",
            "severity": "warning",
            "root_cause": "Bypass diode short-circuit in String 04",
            "affected_capacity_kw": capacity_kwp * 0.20,
            "ground_truth": "PARTIAL_STRING_FAILURE"
        },
        {
            "event_id": f"FLT-{event_counter+1:04d}",
            "asset_id": asset_id,
            "start_time": str(timestamps[str2_start]),
            "end_time": str(timestamps[str2_end]),
            "fault_type": "PARTIAL_STRING_FAILURE",
            "severity": "warning",
            "root_cause": "Bypass diode short-circuit in String 04",
            "affected_capacity_kw": capacity_kwp * 0.20,
            "ground_truth": "PARTIAL_STRING_FAILURE"
        }
    ])
    event_counter += 2

    # Loop over weather timeline and build telemetry records with distinct physics signatures
    for idx, (ts, row) in enumerate(weather_df.iterrows()):
        ghi = row['ghi']
        dni = row['dni']
        dhi = row['dhi']
        ambient_temp = row['ambient_temperature']
        wind_spd = row['wind_speed']
        hum = float(row['humidity']) if 'humidity' in row and not pd.isna(row['humidity']) else 50.0
        state = fault_states[idx]
        
        # Module temperature physics model (Sandia approximation)
        module_temp = ambient_temp + (ghi * np.exp(-0.058 * wind_spd - 3.47))
        
        # Nominal expected power
        temp_loss = 1.0 + (module_temp - 25.0) * asset["temperature_coefficient"]
        ideal_dc_power = (ghi / 1000.0) * capacity_kwp * temp_loss
        ideal_dc_power = max(0.0, ideal_dc_power)
        
        dc_voltage = 650.0 + (25.0 - module_temp) * 1.5 + np.random.normal(0, 2.0) if ghi > 10 else 0.0
        dc_current = (ideal_dc_power * 1000.0 / dc_voltage) if dc_voltage > 50 else 0.0
        inv_temp = ambient_temp + (ideal_dc_power / capacity_kwp) * 25.0 + np.random.normal(0, 1.0)
        inv_eff = 0.98 - max(0.0, (inv_temp - 50.0) * 0.001)
        ac_power = ideal_dc_power * inv_eff
        ac_voltage = 400.0 + np.random.normal(0, 1.5) if ac_power > 0 else 0.0
        ac_current = (ac_power * 1000.0 / (np.sqrt(3) * ac_voltage * 0.99)) if ac_voltage > 100 else 0.0
        freq = 50.0 + np.random.normal(0, 0.05)
        pf = 0.99 - np.random.uniform(0, 0.01)
        rainfall = 0.0
        fault_code = 0
        status = "OPERATIONAL"
        
        # Apply specific fault signatures per fault type
        if state == "SOILING":
            # DC current drops gradually, voltage unaffected
            if idx < s2_start:
                soiling_depth = (idx - s1_start) / max(1, (s1_end - s1_start))
            else:
                soiling_depth = (idx - s2_start) / max(1, (s2_end - s2_start))
            soiling_loss = 0.15 * min(1.0, max(0.0, soiling_depth))
            dc_current *= (1.0 - soiling_loss)
            dc_power = dc_voltage * dc_current / 1000.0
            ac_power = dc_power * inv_eff
            ac_current = (ac_power * 1000.0 / (np.sqrt(3) * ac_voltage * 0.99)) if ac_voltage > 100 else 0.0
            status = "SOILING_WARNING"
            
        elif state == "INVERTER_DEGRADATION":
            # Inverter temperature spikes, efficiency droops sharply
            inv_temp += 28.0
            inv_eff = 0.72
            ac_power = ideal_dc_power * inv_eff
            ac_current = (ac_power * 1000.0 / (np.sqrt(3) * ac_voltage * 0.99)) if ac_voltage > 100 else 0.0
            status = "INVERTER_THERMAL_ALERT"
            fault_code = 104
            
        elif state == "INVERTER_TRIP":
            # Hard zero power, inverter temp high
            ac_power = 0.0
            ac_current = 0.0
            dc_current = 0.0
            inv_temp = 82.5
            inv_eff = 0.0
            status = "TRIPPED"
            fault_code = 501
            
        elif state == "PARTIAL_STRING_FAILURE":
            # 20% current loss, voltage slightly drops
            dc_current *= 0.80
            dc_voltage *= 0.95
            dc_power = dc_voltage * dc_current / 1000.0
            ac_power = dc_power * inv_eff
            ac_current = (ac_power * 1000.0 / (np.sqrt(3) * ac_voltage * 0.99)) if ac_voltage > 100 else 0.0
            status = "STRING_FAULT"
            fault_code = 202
            
        dc_power = max(0.0, dc_voltage * dc_current / 1000.0)
        
        telemetry_rows.append({
            "timestamp": ts.isoformat(),
            "asset_id": asset_id,
            "irradiance_ghi": round(ghi, 2),
            "irradiance_dni": round(dni, 2),
            "irradiance_dhi": round(dhi, 2),
            "ambient_temperature": round(ambient_temp, 2),
            "module_temperature": round(module_temp, 2),
            "humidity": round(hum, 2),
            "wind_speed": round(wind_spd, 2),
            "rainfall": round(rainfall, 2),
            "dc_voltage": round(dc_voltage, 2),
            "dc_current": round(dc_current, 2),
            "dc_power": round(dc_power, 2),
            "ac_voltage": round(ac_voltage, 2),
            "ac_current": round(ac_current, 2),
            "ac_power": round(ac_power, 2),
            "frequency": round(freq, 2),
            "power_factor": round(pf, 3),
            "inverter_temperature": round(inv_temp, 2),
            "inverter_efficiency": round(inv_eff, 3),
            "status": status,
            "fault_code": fault_code
        })
        
    # Convert to DataFrames
    df_telemetry = pd.DataFrame(telemetry_rows)
    df_faults = pd.DataFrame(fault_events)
    df_maintenance = pd.DataFrame(maintenance_rows)
    
    # Save CSV files
    telemetry_path = os.path.join(output_dir, "telemetry.csv")
    metadata_path = os.path.join(output_dir, "asset_metadata.csv")
    faults_path = os.path.join(output_dir, "fault_events.csv")
    maintenance_path = os.path.join(output_dir, "maintenance.csv")
    
    df_telemetry.to_csv(telemetry_path, index=False)
    assets_df.to_csv(metadata_path, index=False)
    df_faults.to_csv(faults_path, index=False)
    df_maintenance.to_csv(maintenance_path, index=False)
    
    print(f"[DATASET] Generation complete! Saved to {output_dir}:")
    print(f"  - {telemetry_path}: {len(df_telemetry)} rows")
    print(f"  - {metadata_path}: {len(assets_df)} rows")
    print(f"  - {faults_path}: {len(df_faults)} rows")
    print(f"  - {maintenance_path}: {len(df_maintenance)} rows")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate canonical solar telemetry dataset with pvlib and dynamic location coordinates.")
    parser.add_argument("--lat", type=float, default=23.18, help="Latitude of asset campus (default: 23.18 for Jabalpur)")
    parser.add_argument("--lon", type=float, default=79.98, help="Longitude of asset campus (default: 79.98 for Jabalpur)")
    parser.add_argument("--outdir", type=str, default=".", help="Output directory for generated CSVs")
    
    args = parser.parse_args()
    generate_canonical_dataset(latitude=args.lat, longitude=args.lon, output_dir=args.outdir)
