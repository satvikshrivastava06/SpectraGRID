import { useState, useEffect } from 'react';
import { store, useStoreState, pushContext, ASSET_CONTEXTS } from '../store';
import RootCauseAttribution from '../components/ui/RootCauseAttribution';
import IncidentTimeline from '../components/ui/IncidentTimeline';

// Types for asset tree
interface AssetNode {
    name: string;
    type: 'campus' | 'building' | 'rooftop' | 'inverter' | 'array' | 'string' | 'panel' | 'battery';
    children?: AssetNode[];
    healthy?: boolean;
}

const ASSET_TREE: AssetNode = {
    name: 'Jabalpur Campus (150 kWp)',
    type: 'campus',
    children: [
        {
            name: 'Block A Building',
            type: 'building',
            children: [
                {
                    name: 'Block-A Rooftop',
                    type: 'rooftop',
                    children: [
                        {
                            name: 'Inverter 01',
                            type: 'inverter',
                            healthy: true,
                            children: [
                                {
                                    name: 'Array A1',
                                    type: 'array',
                                    children: [
                                        {
                                            name: 'String 1',
                                            type: 'string',
                                            children: [
                                                { name: 'Panel A11', type: 'panel', healthy: true },
                                                { name: 'Panel A12', type: 'panel', healthy: true }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            name: 'Inverter 02',
                            type: 'inverter',
                            healthy: false,
                            children: [
                                {
                                    name: 'Array B3',
                                    type: 'array',
                                    children: [
                                        {
                                            name: 'String 4',
                                            type: 'string',
                                            children: [
                                                { name: 'Panel B11', type: 'panel', healthy: true },
                                                { name: 'Panel B12', type: 'panel', healthy: false }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            name: 'Storage Unit Battery-X1',
                            type: 'battery',
                            healthy: true
                        }
                    ]
                }
            ]
        }
    ]
};

import { fetchCampuses, ingestTelemetry } from '../apiClient';

export default function DigitalTwinUI() {
    const storeState = useStoreState();

    const [activeAsset, setActiveAsset] = useState<AssetNode>(ASSET_TREE);
    const [expandedNodes, setExpandedNodes] = useState<string[]>([ASSET_TREE.name, 'Block A Building', 'Block-A Rooftop']);
    const [backendTree, setBackendTree] = useState<AssetNode | null>(null);

    // Fetch real asset hierarchy from backend REST API
    useEffect(() => {
        let isMounted = true;
        fetchCampuses().then(data => {
            if (isMounted && data && data.campuses && data.campuses.length > 0) {
                const camp = data.campuses[0];
                const tree: AssetNode = {
                    name: `${camp.name} (${camp.size} kWp)`,
                    type: 'campus',
                    children: (camp.buildings || []).map((bld: any) => ({
                        name: bld.name,
                        type: 'building',
                        children: (bld.rooftops || []).map((r: any) => ({
                            name: r.name,
                            type: 'rooftop',
                            children: (bld.inverters || []).map((inv: any) => ({
                                name: inv.name,
                                type: 'inverter',
                                healthy: inv.status === 'nominal',
                                children: (r.arrays || []).map((arr: any) => ({
                                    name: arr.name,
                                    type: 'array',
                                    children: (arr.strings || []).map((strItem: any) => ({
                                        name: strItem.name,
                                        type: 'string',
                                        children: (strItem.panels || []).map((p: any) => ({
                                            name: p.name,
                                            type: 'panel',
                                            healthy: p.status === 'nominal'
                                        }))
                                    }))
                                }))
                            }))
                        }))
                    }))
                };
                setBackendTree(tree);
            }
        });
        return () => { isMounted = false; };
    }, []);

    const treeToUse = backendTree || ASSET_TREE;

    // Simulated Live Telemetry States
    const [telemetry, setTelemetry] = useState({
        voltage: 230.2,
        current: 12.4,
        power: 2.85,
        irradiance: 840,
        temperature: 38.6
    });

    const toggleExpand = (name: string) => {
        setExpandedNodes(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
    };

    // Live Telemetry Simulation Loop — Pipes through real backend ingestTelemetry API
    useEffect(() => {
        const interval = setInterval(() => {
            // Base variables depending on node health & type
            const isDegraded = activeAsset.name.includes('B12') || activeAsset.name.includes('Inverter 02') || activeAsset.name.includes('B3');

            // Random walk simulation
            const baseIrradiance = 840 + (Math.random() - 0.5) * 15;
            const baseTemp = (isDegraded ? 65.4 : 38.2) + (Math.random() - 0.5) * 2;
            const baseVoltage = (isDegraded ? 104.5 : 228.6) + (Math.random() - 0.5) * 3;
            const baseCurrent = (isDegraded ? 4.2 : 12.5) + (Math.random() - 0.5) * 0.8;
            const basePower = Number(((baseVoltage * baseCurrent) / 1000).toFixed(2));

            const updated = {
                voltage: Number(baseVoltage.toFixed(1)),
                current: Number(baseCurrent.toFixed(1)),
                power: basePower,
                irradiance: Number(baseIrradiance.toFixed(0)),
                temperature: Number(baseTemp.toFixed(1))
            };

            setTelemetry(updated);

            // Sync to global store
            store.telemetry = updated;
            store.activeNode = activeAsset.type;

            // Pipe through real backend ingestion API (Phases 1-2 ML pipeline)
            ingestTelemetry(updated);

        }, 2000);

        return () => clearInterval(interval);
    }, [activeAsset]);

    // Recursively render node tree components
    const renderAssetNode = (node: AssetNode) => {
        const isExpanded = expandedNodes.includes(node.name);
        const hasChildren = node.children && node.children.length > 0;

        return (
            <div key={node.name} style={{ marginLeft: '16px', marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => {
                    setActiveAsset(node);
                    if (hasChildren) toggleExpand(node.name);
                    // Push decision context for this node
                    const ctx = ASSET_CONTEXTS[node.name];
                    if (ctx) {
                        pushContext(ctx);
                    } else {
                        pushContext({
                            trigger: 'asset-click',
                            assetId: node.name,
                            what: `${node.name} selected. Type: ${node.type}.`,
                            why: 'No anomalies detected. Operating within baseline parameters.',
                            whatNext: 'Continue monitoring. No predicted failures within 90 days.',
                            action: 'No immediate action required.',
                            doNothing: 'No financial or carbon risk within planning horizon.',
                            financialDelta: 0, carbonDelta: 0, confidence: 95,
                            severity: node.healthy === false ? 'critical' : 'info',
                        });
                    }
                }}>
                    {hasChildren && (
                        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', userSelect: 'none' }}>
                            {isExpanded ? '▼' : '▶'}
                        </span>
                    )}

                    <span style={{
                        fontSize: '0.85rem',
                        color: activeAsset.name === node.name ? 'var(--color-cyan)' : '#FFF',
                        fontWeight: activeAsset.name === node.name ? 600 : 400,
                        textDecoration: activeAsset.name === node.name ? 'underline' : 'none'
                    }}>
                        {node.name}
                    </span>

                    <span style={{
                        fontSize: '0.7rem',
                        color: node.healthy === false ? 'var(--color-red)' : 'var(--color-emerald)',
                        opacity: 0.6
                    }}>
                        ({node.healthy === false ? 'FAULT' : 'OK'})
                    </span>
                </div>

                {hasChildren && isExpanded && (
                    <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', marginLeft: '4px' }}>
                        {node.children!.map(child => renderAssetNode(child))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <section id="digital-twin-dashboard" className="section" style={{ background: 'rgba(12, 13, 18, 0.95)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="section-inner" style={{ maxWidth: '1440px' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div>
                        <div className="section-eyebrow">// Asset Twin Control</div>
                        <h2 className="section-title" style={{ margin: 0 }}>SpectraTwin Dashboard</h2>
                    </div>

                    {/* Quick Stats on Selected Node */}
                    <div className="glass-panel mono" style={{ padding: '12px 24px', display: 'flex', gap: '24px', fontSize: '0.85rem' }}>
                        <div>
                            <span style={{ color: 'rgba(255,255,255,0.4)' }}>SELECTED NODE:</span>{' '}
                            <span style={{ color: 'var(--color-cyan)', fontWeight: 600 }}>{activeAsset.name.toUpperCase()}</span>
                        </div>
                        <div>
                            <span style={{ color: 'rgba(255,255,255,0.4)' }}>CAMPUS:</span>{' '}
                            <span style={{ color: '#FFF' }}>{storeState.selectedCampus}</span>
                        </div>
                    </div>
                </div>

                {/* Dashboard Grid Frame */}
                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 480px', gap: '30px', alignItems: 'start' }}>

                    {/* 1. ASSET HIERARCHY TREE */}
                    <div className="glass-panel" style={{ padding: '24px', minHeight: '520px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="mono" style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              // Hierarchy Tree
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {renderAssetNode(treeToUse)}
                        </div>
                    </div>

                    {/* 2. REAL-TIME telemetry SIMULATIONS & twin diagnostics */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

                        {/* Live Telemetry Panel */}
                        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="mono" style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem', color: 'var(--color-cyan)' }}>
                  // Live Telemetry Feed
                                </span>
                                <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-emerald)' }}>
                                    ● SIMULATED MODBUS REGISTER
                                </span>
                            </div>

                            {/* Dials Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }} className="mono">
                                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '6px' }}>VOLTAGE</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 600, color: '#FFF' }}>{telemetry.voltage} V</div>
                                </div>

                                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '6px' }}>CURRENT</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 600, color: '#FFF' }}>{telemetry.current} A</div>
                                </div>

                                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '6px' }}>ACTIVE POWER</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--color-cyan)' }}>{telemetry.power} kW</div>
                                </div>

                                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '6px' }}>TEMP</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 600, color: telemetry.temperature > 50 ? 'var(--color-red)' : 'var(--color-emerald)' }}>{telemetry.temperature} °C</div>
                                </div>

                                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '6px' }}>IRRADIANCE</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--color-gold)' }}>{telemetry.irradiance} W/m²</div>
                                </div>
                            </div>

                            <div style={{ padding: '16px', background: 'rgba(0, 240, 255, 0.05)', borderRadius: '4px', border: '1px solid rgba(0, 240, 255, 0.15)' }} className="mono">
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-cyan)', fontWeight: 600 }}>[Twin Diagnostic State]:</span>{' '}
                                <span style={{ fontSize: '0.8rem', color: '#FFF' }}>
                                    {activeAsset.healthy === false
                                        ? 'CRITICAL EXCURSION: Secondary losses detected under underperforming cell. Please audit String 4 panel B12.'
                                        : 'System stabilized. Physics calibration matches pvlib tracking variables within 1.2% variance limits.'}
                                </span>
                            </div>
                        </div>

                        {/* Bottom Alert Timeline */}
                        <IncidentTimeline />

                    </div>

                    {/* 3. DIAGNOSTICS: SANKEY & CAUSAL VISUALS */}
                    <RootCauseAttribution />

                </div>

            </div>
        </section>
    );
}
