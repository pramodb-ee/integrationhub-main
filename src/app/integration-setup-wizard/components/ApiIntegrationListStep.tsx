'use client';

import OverlayPortal from '@/components/ui/OverlayPortal';
import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import {
  CheckCircle2, ChevronDown, Eye, Grid3x3, List, Loader2, Plus, RefreshCw, Trash2, X, XCircle, Zap,
} from 'lucide-react';

export interface ApiIntegration {
  id: string;
  name: string;
  type: string;
  description: string;
  status: 'Active' | 'Inactive';
  createdBy: string;
  createdOn: string;
  updatedOn: string;
}

const INTEGRATION_TYPE_OPTIONS = [
  'API', 'Webhook', 'Shiksha', 'Career360', 'CollegeDekho', 'CollegeDisha', 'CollegeSearch', 'Collegedunia',
];

export const SEED_INTEGRATIONS: ApiIntegration[] = [
  { id: 'INT-1001', name: 'Shiksha Lead API', type: 'Shiksha', description: 'Pulls inquiry leads from Shiksha listings', status: 'Active', createdBy: 'Priya Sharma', createdOn: '12 Aug 2026', updatedOn: '02 Sep 2026' },
  { id: 'INT-1002', name: 'Career360 Webhook', type: 'Career360', description: 'Receives real-time lead webhooks from Career360', status: 'Active', createdBy: 'Rahul Verma', createdOn: '05 Jul 2026', updatedOn: '30 Aug 2026' },
  { id: 'INT-1003', name: 'CollegeDekho Publisher Feed', type: 'CollegeDekho', description: 'Publisher API feed for CollegeDekho enquiries', status: 'Inactive', createdBy: 'Kavya Iyer', createdOn: '18 Jun 2026', updatedOn: '18 Jun 2026' },
];

const inputClass = 'w-full h-9 px-3 text-[12px] bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';

function todayLabel() {
  return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface ApiIntegrationListStepProps {
  integrations: ApiIntegration[];
  setIntegrations: React.Dispatch<React.SetStateAction<ApiIntegration[]>>;
  onViewDetails: (integration: ApiIntegration) => void;
}

export default function ApiIntegrationListStep({ integrations, setIntegrations, onViewDetails }: ApiIntegrationListStepProps) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [refreshing, setRefreshing] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState(INTEGRATION_TYPE_OPTIONS[0]);
  const [description, setDescription] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ApiIntegration | null>(null);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  };

  const openPanel = () => {
    setName(''); setType(INTEGRATION_TYPE_OPTIONS[0]); setDescription(''); setValidationMessage('');
    setPanelOpen(true);
  };
  const closePanel = () => { if (!saving) setPanelOpen(false); };

  const handleSave = () => {
    if (!name.trim()) { setValidationMessage('Integration Name is required.'); return; }
    setSaving(true);
    setTimeout(() => {
      const now = todayLabel();
      const created: ApiIntegration = {
        id: `INT-${crypto.randomUUID()}`,
        name: name.trim(),
        type,
        description: description.trim() || `${type} integration`,
        status: 'Active',
        createdBy: 'Admin User',
        createdOn: now,
        updatedOn: now,
      };
      setIntegrations((current) => [created, ...current]);
      setSaving(false);
      setPanelOpen(false);
      onViewDetails(created);
    }, 1100);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setIntegrations((current) => current.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-foreground">API Configuration</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Manage your API integrations and connect new data sources.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded border border-border" role="group" aria-label="Integration view">
            <button
              type="button"
              onClick={() => setView('list')}
              title="List View"
              aria-label="List View"
              aria-pressed={view === 'list'}
              className={`flex items-center justify-center h-8 w-8 transition-colors ${view === 'list' ? 'bg-[#cf5830] text-white' : 'bg-card text-muted-foreground'}`}
            >
              <List size={15} />
            </button>
            <button
              type="button"
              onClick={() => setView('grid')}
              title="Grid View"
              aria-label="Grid View"
              aria-pressed={view === 'grid'}
              className={`flex items-center justify-center h-8 w-8 transition-colors ${view === 'grid' ? 'bg-[#cf5830] text-white' : 'bg-card text-muted-foreground'}`}
            >
              <Grid3x3 size={14} />
            </button>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh"
            className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-semibold bg-card border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-60"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />Refresh
          </button>
          <button
            type="button"
            onClick={openPanel}
            className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 shadow-sm"
          >
            <Plus size={13} />Add New Integration
          </button>
        </div>
      </div>

      {integrations.length === 0 ? (
        <div className="card-base rounded-xl px-4 py-14 text-center">
          <p className="text-[12px] text-muted-foreground">No integrations yet. Click &ldquo;Add New Integration&rdquo; to create one.</p>
        </div>
      ) : view === 'list' ? (
        <div className="card-base overflow-x-auto rounded-xl">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[1.6fr_0.9fr_1.1fr_1fr_1fr_120px] gap-3 px-4 py-3 bg-muted/50 border-b border-border">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Integration Name</span>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</span>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Created By</span>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Created On</span>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Updated On</span>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide text-center">Actions</span>
            </div>
            <div className="divide-y divide-border">
              {integrations.map((item) => (
                <div key={item.id} className="grid grid-cols-[1.6fr_0.9fr_1.1fr_1fr_1fr_120px] gap-3 px-4 py-3.5 items-center hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-foreground truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{item.type} &middot; {item.description}</p>
                  </div>
                  <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold border ${
                    item.status === 'Active' ? 'bg-success-bg text-success border-success-border' : 'bg-danger-bg text-danger border-danger-border'
                  }`}>
                    {item.status === 'Active' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {item.status}
                  </span>
                  <span className="text-[12px] text-muted-foreground truncate">{item.createdBy}</span>
                  <span className="text-[12px] text-muted-foreground font-tabular truncate">{item.createdOn}</span>
                  <span className="text-[12px] text-muted-foreground font-tabular truncate">{item.updatedOn}</span>
                  <div className="flex items-center justify-center gap-1.5">
                    <button type="button" onClick={() => onViewDetails(item)} title="View Details" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors">
                      <Eye size={14} />
                    </button>
                    <button type="button" onClick={() => setDeleteTarget(item)} title="Delete" className="p-1.5 rounded-md hover:bg-danger-bg text-danger transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {integrations.map((item) => (
            <div key={item.id} className="card-base rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.type}</p>
                </div>
                <span className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold border ${
                  item.status === 'Active' ? 'bg-success-bg text-success border-success-border' : 'bg-danger-bg text-danger border-danger-border'
                }`}>
                  {item.status === 'Active' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                  {item.status}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{item.description}</p>
              <div className="text-[10px] text-muted-foreground space-y-0.5">
                <p>Created by {item.createdBy} &middot; {item.createdOn}</p>
                <p>Updated {item.updatedOn}</p>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-border mt-1">
                <button type="button" onClick={() => onViewDetails(item)} className="flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-semibold rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  <Eye size={12} />View Details
                </button>
                <button type="button" onClick={() => setDeleteTarget(item)} className="flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-semibold rounded-md bg-danger-bg text-danger hover:bg-danger-bg/70 transition-colors">
                  <Trash2 size={12} />Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Integration — side panel */}
      {panelOpen && (
        <OverlayPortal><div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closePanel} />
          <div className="relative w-full sm:max-w-lg bg-card h-full shadow-2xl border-l border-border flex flex-col fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-orange-50 dark:bg-orange-950/20 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                  <Zap size={16} className="text-primary" />
                </div>
                <h2 className="text-[16px] font-bold text-foreground">Add New Integration</h2>
              </div>
              <button type="button" onClick={closePanel} className="p-1.5 rounded-md hover:bg-white/60 dark:hover:bg-white/10 text-muted-foreground transition-colors" aria-label="Close panel">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {validationMessage && <p className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-[11px] text-danger">{validationMessage}</p>}
              <label className="block">
                <span className="block text-[12px] font-semibold text-foreground mb-1">Integration Name <span className="text-danger">*</span></span>
                <input value={name} onChange={(event) => { setName(event.target.value); setValidationMessage(''); }} placeholder="e.g. Shiksha Lead API" className={inputClass} />
              </label>
              <label className="block">
                <span className="block text-[12px] font-semibold text-foreground mb-1">Integration Type</span>
                <div className="relative">
                  <select value={type} onChange={(event) => setType(event.target.value)} className={`${inputClass} appearance-none pr-8`}>
                    {INTEGRATION_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </label>
              <label className="block">
                <span className="block text-[12px] font-semibold text-foreground mb-1">Description</span>
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Brief description of this integration" rows={4} className="w-full px-3 py-2 text-[12px] bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
              </label>
            </div>
            <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border bg-muted/30 flex-shrink-0">
              <button type="button" onClick={closePanel} disabled={saving} className="h-9 px-5 text-[12px] font-semibold border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50">Cancel</button>
              <button type="button" onClick={handleSave} disabled={saving} className="flex items-center gap-2 h-9 px-5 text-[12px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70">
                {saving && <Loader2 size={13} className="animate-spin" />}
                {saving ? 'Saving…' : 'Save Integration'}
              </button>
            </div>
          </div>
        </div></OverlayPortal>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <Modal
          open={true}
          onClose={() => setDeleteTarget(null)}
          title="Delete Integration"
          size="sm"
          footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => setDeleteTarget(null)} className="h-8 px-3 text-[11px] border border-border rounded-lg">Cancel</button><button type="button" onClick={confirmDelete} className="h-8 px-3 text-[11px] font-semibold bg-danger text-white rounded-lg">Delete</button></div>}
        >
          <p className="text-[12px] text-muted-foreground">Are you sure you want to delete &ldquo;{deleteTarget.name}&rdquo;? This cannot be undone.</p>
        </Modal>
      )}
    </div>
  );
}
