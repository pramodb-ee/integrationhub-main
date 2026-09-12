'use client';

import OverlayPortal from '@/components/ui/OverlayPortal';
import React, { useState } from 'react';
import { X, RefreshCw, Edit2, FileText, ChevronDown, Download, Zap, Clock, Play, RotateCcw, CheckCircle, AlertTriangle, TrendingUp, GitBranch, Eye } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import Icon from '@/components/ui/AppIcon';


interface MappingRow {
  id: string;
  crmStatus: string;
  platform: 'facebook' | 'google';
  mappedEvent: string;
  pushCount: number;
  lastSync: string;
  syncStatus: 'synced' | 'pending' | 'failed';
}

const MAPPING_ROWS: MappingRow[] = [
  { id: 'cm-001', crmStatus: 'New Lead',         platform: 'facebook', mappedEvent: 'Lead',                pushCount: 1842, lastSync: '3 min ago',  syncStatus: 'synced' },
  { id: 'cm-002', crmStatus: 'Form Submitted',   platform: 'facebook', mappedEvent: 'CompleteRegistration', pushCount: 1240, lastSync: '3 min ago',  syncStatus: 'synced' },
  { id: 'cm-003', crmStatus: 'Purchase',         platform: 'facebook', mappedEvent: 'Purchase',             pushCount: 312,  lastSync: '5 min ago',  syncStatus: 'synced' },
  { id: 'cm-004', crmStatus: 'Qualified Lead',   platform: 'google',   mappedEvent: 'qualified_lead',       pushCount: 680,  lastSync: '1 hr ago',   syncStatus: 'synced' },
  { id: 'cm-005', crmStatus: 'Offline Convert',  platform: 'google',   mappedEvent: 'offline_conversion',   pushCount: 145,  lastSync: '2 hr ago',   syncStatus: 'synced' },
  { id: 'cm-006', crmStatus: 'Appointment Set',  platform: 'facebook', mappedEvent: 'Schedule',             pushCount: 89,   lastSync: '15 min ago', syncStatus: 'synced' },
  { id: 'cm-007', crmStatus: 'Demo Requested',   platform: 'google',   mappedEvent: 'request_demo',         pushCount: 0,    lastSync: 'Never',      syncStatus: 'failed' },
];

const PUSH_TREND_DATA = [
  { time: '6h', fb: 280, google: 120 },
  { time: '5h', fb: 320, google: 145 },
  { time: '4h', fb: 290, google: 98 },
  { time: '3h', fb: 410, google: 160 },
  { time: '2h', fb: 380, google: 175 },
  { time: '1h', fb: 350, google: 140 },
  { time: 'Now', fb: 420, google: 188 },
];

const VERSIONS = [
  { id: 'v3', label: 'V3.0', date: 'Sep 2, 2026', changes: 'Added Demo Requested → request_demo mapping', active: true },
  { id: 'v2', label: 'V2.0', date: 'Aug 28, 2026', changes: 'Added Appointment Set → Schedule mapping', active: false },
  { id: 'v1', label: 'V1.0', date: 'Aug 12, 2026', changes: 'Initial mapping: Lead, Purchase, Qualified Lead', active: false },
];

interface ConversionAPIPanelProps {
  onClose: () => void;
}

export default function ConversionAPIPanel({ onClose }: ConversionAPIPanelProps) {
  const [platformFilter, setPlatformFilter] = useState<'all' | 'facebook' | 'google'>('all');
  const [syncMode, setSyncMode] = useState<'realtime' | 'batch' | 'manual'>('realtime');
  const [batchFreq, setBatchFreq] = useState<'hourly' | 'daily'>('hourly');
  const [activeTab, setActiveTab] = useState<'mapping' | 'sync' | 'history' | 'logs'>('mapping');
  const [selectedVersion, setSelectedVersion] = useState('v3');
  const [compareVersion, setCompareVersion] = useState('v2');
  const [showCompare, setShowCompare] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const filtered = MAPPING_ROWS.filter((r) => platformFilter === 'all' || r.platform === platformFilter);

  const handleSyncNow = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2000);
  };

  const platformBadge = (platform: 'facebook' | 'google') => (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
      platform === 'facebook' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-green-50 text-green-600 border-green-200'
    }`}>
      {platform === 'facebook' ? '📘 Facebook CAPI' : '🟢 Google Conv. API'}
    </span>
  );

  const syncStatusBadge = (status: MappingRow['syncStatus']) => (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${
      status === 'synced' ? 'bg-success-bg text-success border-success-border' :
      status === 'pending'? 'bg-warning-bg text-warning border-warning-border' : 'bg-danger-bg text-danger border-danger-border'
    }`}>
      {status === 'synced' ? <CheckCircle size={9} /> : status === 'pending' ? <Clock size={9} /> : <AlertTriangle size={9} />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );

  return (
    <OverlayPortal><div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-5xl bg-card shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ borderLeft: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">Conversion API Sync</h2>
              <p className="text-[11px] text-muted-foreground">Track status-based pushes to Facebook & Google Conversion APIs</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncNow}
              disabled={syncing}
              className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-colors text-muted-foreground">
              <Download size={12} /> Export
            </button>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-4 gap-0 border-b border-border">
          {[
            { label: 'Total Pushes (24h)', value: '4,308', icon: TrendingUp, color: 'text-primary' },
            { label: 'Facebook CAPI', value: '3,483', icon: Zap, color: 'text-blue-500' },
            { label: 'Google Conv. API', value: '825', icon: Zap, color: 'text-green-500' },
            { label: 'Failed Pushes', value: '0', icon: AlertTriangle, color: 'text-success' },
          ].map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div key={`ckpi-${i}`} className={`px-4 py-3 ${i < 3 ? 'border-r border-border' : ''}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon size={12} className={kpi.color} />
                  <span className="text-[10px] text-muted-foreground">{kpi.label}</span>
                </div>
                <p className={`text-[20px] font-bold font-tabular ${kpi.color}`}>{kpi.value}</p>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border px-4">
          {(['mapping', 'sync', 'history', 'logs'] as const).map((tab) => (
            <button
              key={`ctab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2.5 text-[12px] font-medium capitalize border-b-2 transition-colors -mb-px ${
                activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'mapping' ? 'Mapping Table' : tab === 'sync' ? 'Sync Options' : tab === 'history' ? 'Version History' : 'Monitoring Logs'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Mapping Table Tab */}
          {activeTab === 'mapping' && (
            <div>
              {/* Filters */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex rounded-md border border-border overflow-hidden">
                  {(['all', 'facebook', 'google'] as const).map((p) => (
                    <button
                      key={`pf-${p}`}
                      onClick={() => setPlatformFilter(p)}
                      className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${
                        platformFilter === p ? 'bg-primary text-white' : 'bg-card text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {p === 'all' ? 'All Platforms' : p === 'facebook' ? '📘 Facebook' : '🟢 Google'}
                    </button>
                  ))}
                </div>
                <span className="ml-auto text-[11px] text-muted-foreground">{filtered.length} mappings</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[12px]" style={{ minWidth: '700px' }}>
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {['CRM Status', 'Platform', 'Mapped Event', 'Push Count', 'Last Sync Time', 'Sync Status', 'Actions'].map((h) => (
                        <th key={`cth-${h}`} className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => (
                      <tr key={row.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2.5">
                          <span className="font-medium text-foreground">{row.crmStatus}</span>
                        </td>
                        <td className="px-3 py-2.5">{platformBadge(row.platform)}</td>
                        <td className="px-3 py-2.5">
                          <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded font-mono text-foreground">{row.mappedEvent}</code>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-semibold font-tabular text-foreground">{row.pushCount.toLocaleString()}</span>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">{row.lastSync}</td>
                        <td className="px-3 py-2.5">{syncStatusBadge(row.syncStatus)}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1">
                            <button title="Retry" className="p-1 rounded hover:bg-success-bg text-muted-foreground hover:text-success transition-colors">
                              <RefreshCw size={11} />
                            </button>
                            <button title="Edit Mapping" className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                              <Edit2 size={11} />
                            </button>
                            <button title="View Logs" className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                              <FileText size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Push Volume Chart */}
              <div className="p-4 border-t border-border">
                <h4 className="text-[13px] font-semibold text-foreground mb-3">Push Volume (Last 6h)</h4>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={PUSH_TREND_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 11, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="fb" name="Facebook CAPI" fill="#1877F2" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="google" name="Google Conv. API" fill="#34A853" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Sync Options Tab */}
          {activeTab === 'sync' && (
            <div className="p-5 space-y-5">
              <div>
                <h3 className="text-[14px] font-semibold text-foreground mb-3">Sync Mode</h3>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { id: 'realtime', label: 'Real-time', icon: Zap, desc: 'Push on every status change. Best for Lead, Form Submitted, Purchase.' },
                    { id: 'batch', label: 'Batch', icon: Clock, desc: 'Aggregate and push hourly or daily. Best for Qualified Lead, Offline Conversion.' },
                    { id: 'manual', label: 'Manual', icon: Play, desc: 'Push only when you click "Sync Now". Full admin control.' },
                  ] as const).map((mode) => {
                    const Icon = mode.icon;
                    return (
                      <button
                        key={`sm-${mode.id}`}
                        onClick={() => setSyncMode(mode.id)}
                        className={`p-4 rounded-lg border text-left transition-all ${
                          syncMode === mode.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-card hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Icon size={14} className={syncMode === mode.id ? 'text-primary' : 'text-muted-foreground'} />
                          <span className={`text-[13px] font-semibold ${syncMode === mode.id ? 'text-primary' : 'text-foreground'}`}>{mode.label}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{mode.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {syncMode === 'batch' && (
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <h4 className="text-[13px] font-semibold text-foreground mb-3">Batch Frequency</h4>
                  <div className="flex gap-2">
                    {(['hourly', 'daily'] as const).map((freq) => (
                      <button
                        key={`bf-${freq}`}
                        onClick={() => setBatchFreq(freq)}
                        className={`px-4 py-2 text-[12px] font-medium rounded-md border transition-colors ${
                          batchFreq === freq ? 'bg-primary text-white border-primary' : 'bg-card border-border hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="text-[13px] font-semibold text-foreground mb-3">Best Practice Alignment</h4>
                <div className="space-y-2">
                  {[
                    { platform: '📘 Facebook CAPI', events: 'Lead, Form Submitted, Purchase', mode: 'Real-time', color: 'text-blue-600' },
                    { platform: '🟢 Google Conv. API', events: 'Qualified Lead, Offline Conversion', mode: 'Batch (hourly)', color: 'text-green-600' },
                  ].map((row) => (
                    <div key={`bp-${row.platform}`} className="flex items-center justify-between p-2.5 rounded-md bg-card border border-border">
                      <div>
                        <span className={`text-[12px] font-semibold ${row.color}`}>{row.platform}</span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{row.events}</p>
                      </div>
                      <span className="text-[11px] font-medium text-foreground bg-muted px-2 py-0.5 rounded">{row.mode}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSyncNow}
                disabled={syncing}
                className="flex items-center gap-2 h-9 px-5 text-[13px] font-semibold bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing...' : 'Save & Sync Now'}
              </button>
            </div>
          )}

          {/* Version History Tab */}
          {activeTab === 'history' && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-foreground">Mapping Versions</h3>
                <button
                  onClick={() => setShowCompare(!showCompare)}
                  className="flex items-center gap-1.5 h-7 px-3 text-[11px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-colors text-muted-foreground"
                >
                  <Eye size={11} /> {showCompare ? 'Hide' : 'Compare Versions'}
                </button>
              </div>

              {showCompare && (
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <h4 className="text-[12px] font-semibold text-foreground mb-3">Side-by-Side Comparison</h4>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative flex-1">
                      <select value={selectedVersion} onChange={(e) => setSelectedVersion(e.target.value)}
                        className="w-full h-7 pl-2.5 pr-6 text-[11px] bg-card border border-border rounded-md focus:outline-none appearance-none">
                        {VERSIONS.map((v) => <option key={v.id} value={v.id}>{v.label} {v.active ? '(Current)' : ''}</option>)}
                      </select>
                      <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                    <span className="text-[11px] text-muted-foreground">vs</span>
                    <div className="relative flex-1">
                      <select value={compareVersion} onChange={(e) => setCompareVersion(e.target.value)}
                        className="w-full h-7 pl-2.5 pr-6 text-[11px] bg-card border border-border rounded-md focus:outline-none appearance-none">
                        {VERSIONS.map((v) => <option key={v.id} value={v.id}>{v.label} {v.active ? '(Current)' : ''}</option>)}
                      </select>
                      <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[selectedVersion, compareVersion].map((vid) => {
                      const ver = VERSIONS.find((v) => v.id === vid);
                      return (
                        <div key={`cmp-${vid}`} className={`p-3 rounded-lg border ${ver?.active ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}>
                          <div className="flex items-center gap-1.5 mb-2">
                            <GitBranch size={12} className={ver?.active ? 'text-primary' : 'text-muted-foreground'} />
                            <span className={`text-[12px] font-semibold ${ver?.active ? 'text-primary' : 'text-foreground'}`}>{ver?.label}</span>
                            {ver?.active && <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-full">Current</span>}
                          </div>
                          <p className="text-[10px] text-muted-foreground mb-1">{ver?.date}</p>
                          <p className="text-[11px] text-foreground">{ver?.changes}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 p-2.5 rounded-md bg-warning-bg border border-warning-border">
                    <p className="text-[11px] text-warning font-medium">Diff: V3.0 adds "Demo Requested → request_demo" mapping not present in V2.0</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {VERSIONS.map((ver) => (
                  <div key={ver.id} className={`p-4 rounded-lg border transition-all ${ver.active ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GitBranch size={14} className={ver.active ? 'text-primary' : 'text-muted-foreground'} />
                        <span className={`text-[13px] font-semibold ${ver.active ? 'text-primary' : 'text-foreground'}`}>{ver.label}</span>
                        {ver.active && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full">Current</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">{ver.date}</span>
                        {!ver.active && (
                          <button className="flex items-center gap-1 h-6 px-2 text-[10px] font-medium bg-card border border-border rounded hover:bg-muted transition-colors text-muted-foreground">
                            <RotateCcw size={10} /> Rollback
                          </button>
                        )}
                        {ver.active && (
                          <button className="flex items-center gap-1 h-6 px-2 text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 rounded">
                            <CheckCircle size={10} /> Published
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5 ml-6">{ver.changes}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monitoring Logs Tab */}
          {activeTab === 'logs' && (
            <div className="p-4 space-y-4">
              <div className="card-base p-4">
                <h4 className="text-[13px] font-semibold text-foreground mb-3">Push Success Rate (Last 6h)</h4>
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={PUSH_TREND_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fbGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1877F2" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#1877F2" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 11, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6 }} />
                    <Area type="monotone" dataKey="fb" name="Facebook" stroke="#1877F2" strokeWidth={2} fill="url(#fbGrad)" />
                    <Area type="monotone" dataKey="google" name="Google" stroke="#34A853" strokeWidth={2} fill="none" strokeDasharray="4 2" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {[
                  { time: '10:14 AM', platform: 'facebook', event: 'Lead', status: 'success', detail: 'Lead pushed successfully — event_id: fb_ev_8821' },
                  { time: '10:13 AM', platform: 'google', event: 'qualified_lead', status: 'success', detail: 'Batch push: 12 conversions sent to Google Ads API' },
                  { time: '10:12 AM', platform: 'facebook', event: 'Purchase', status: 'success', detail: 'Purchase event pushed — value: ₹4,200, currency: INR' },
                  { time: '10:10 AM', platform: 'facebook', event: 'CompleteRegistration', status: 'success', detail: 'Form submission event pushed — deduplicated via event_id' },
                  { time: '10:05 AM', platform: 'google', event: 'request_demo', status: 'failed', detail: 'Push failed: conversion action not found in Google Ads account' },
                  { time: '09:58 AM', platform: 'facebook', event: 'Schedule', status: 'success', detail: 'Appointment Set event pushed — 3 events in batch' },
                ].map((log, i) => (
                  <div key={`clog-${i}`} className={`p-3 rounded-lg border text-[11px] ${
                    log.status === 'success' ? 'bg-success-bg border-success-border' : 'bg-danger-bg border-danger-border'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {log.status === 'success' ? <CheckCircle size={11} className="text-success" /> : <AlertTriangle size={11} className="text-danger" />}
                      <span className={`font-semibold ${log.status === 'success' ? 'text-success' : 'text-danger'}`}>
                        {log.platform === 'facebook' ? '📘' : '🟢'} {log.event}
                      </span>
                      <span className="ml-auto text-muted-foreground">{log.time}</span>
                    </div>
                    <p className="text-foreground ml-5">{log.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div></OverlayPortal>
  );
}
