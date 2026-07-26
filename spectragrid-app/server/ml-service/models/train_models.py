import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.preprocessing import StandardScaler
import shap

FEATURE_COLS = [
    'irradiance_ghi', 'ambient_temperature', 'module_temperature',
    'dc_voltage', 'dc_current', 'dc_power',
    'ac_voltage', 'ac_current', 'ac_power',
    'frequency', 'power_factor', 'inverter_temperature', 'inverter_efficiency'
]

ALL_CLASSES = [
    'SOILING', 'SHADING', 'INVERTER_DEGRADATION', 'INVERTER_TRIP',
    'GRID_VOLTAGE_EVENT', 'SENSOR_FAILURE', 'PARTIAL_STRING_FAILURE',
    'TEMPERATURE_DERATING', 'CLOUD_TRANSIENT'
]

def train_and_save_models(data_dir: str = "../data", models_dir: str = "."):
    os.makedirs(models_dir, exist_ok=True)
    telemetry_path = os.path.join(data_dir, "telemetry.csv")
    
    if not os.path.exists(telemetry_path):
        print(f"[ML TRAIN] telemetry.csv not found in {data_dir}. Generating canonical dataset...")
        from data.generate_dataset import generate_canonical_dataset
        generate_canonical_dataset(output_dir=data_dir)
        
    df = pd.read_csv(telemetry_path)
    print(f"[ML TRAIN] Loaded {len(df)} telemetry records.")
    
    # Fill any missing values
    for col in FEATURE_COLS:
        if col not in df.columns:
            df[col] = 0.0
        df[col] = df[col].fillna(0.0)
        
    X = df[FEATURE_COLS]
    
    # Map status to target labels
    status_map = {
        'OPERATIONAL': 'NORMAL',
        'SOILING_WARNING': 'SOILING',
        'INVERTER_THERMAL_ALERT': 'INVERTER_DEGRADATION',
        'TRIPPED': 'INVERTER_TRIP',
        'STRING_FAULT': 'PARTIAL_STRING_FAILURE'
    }
    df['target_class'] = df['status'].map(lambda s: status_map.get(s, 'NORMAL'))
    
    # 1. Train Model 1 — IsolationForest Anomaly Detector on NORMAL rows only
    normal_df = df[df['target_class'] == 'NORMAL']
    X_normal = normal_df[FEATURE_COLS]
    
    scaler = StandardScaler()
    X_normal_scaled = scaler.fit_transform(X_normal)
    
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=42
    )
    iso_forest.fit(X_normal_scaled)
    print("[ML TRAIN] IsolationForest anomaly detector trained successfully.")
    
    # 2. Train Model 2 — RandomForestClassifier Root Cause Classifier on labeled fault samples
    # Time window split: 80% train (chronological first 80%), 20% test (chronological last 20%)
    split_idx = int(len(df) * 0.8)
    train_df = df.iloc[:split_idx]
    test_df = df.iloc[split_idx:]
    
    # Filter fault samples + subset of normal for classifier training
    fault_df = train_df[train_df['target_class'] != 'NORMAL']
    normal_sampled = train_df[train_df['target_class'] == 'NORMAL'].sample(n=min(len(normal_df), max(100, len(fault_df) * 2)), random_state=42)
    cls_df = pd.concat([fault_df, normal_sampled]).sample(frac=1.0, random_state=42)
    
    X_cls = cls_df[FEATURE_COLS]
    y_cls = cls_df['target_class']
    
    X_cls_scaled = scaler.transform(X_cls)
    
    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        random_state=42
    )
    clf.fit(X_cls_scaled, y_cls)
    print("[ML TRAIN] RandomForest root-cause classifier trained successfully.")
    
    # Evaluate model on test split
    X_test_scaled = scaler.transform(test_df[FEATURE_COLS])
    y_test = test_df['target_class']
    
    y_pred = clf.predict(X_test_scaled)
    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
    conf_matrix = confusion_matrix(y_test, y_pred, labels=clf.classes_).tolist()
    
    print("[ML TRAIN] Evaluation Metrics:")
    print(classification_report(y_test, y_pred, zero_division=0))
    
    # 3. Fit SHAP TreeExplainer on trained classifier
    explainer = shap.TreeExplainer(clf)
    print("[ML TRAIN] SHAP TreeExplainer initialized.")
    
    # Save artifacts
    joblib.dump(scaler, os.path.join(models_dir, "scaler.joblib"))
    joblib.dump(iso_forest, os.path.join(models_dir, "isolation_forest.joblib"))
    joblib.dump(clf, os.path.join(models_dir, "gradient_boosting.joblib"))
    joblib.dump(explainer, os.path.join(models_dir, "shap_explainer.joblib"))
    
    metrics = {
        "model_version": "v1.0.0",
        "training_date": pd.Timestamp.now().isoformat(),
        "classes": clf.classes_.tolist(),
        "feature_cols": FEATURE_COLS,
        "classification_report": report,
        "confusion_matrix": conf_matrix
    }
    
    with open(os.path.join(models_dir, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)
        
    print(f"[ML TRAIN] Model artifacts successfully saved to {models_dir}")
    return metrics

if __name__ == "__main__":
    train_and_save_models(data_dir="../data", models_dir=".")
