'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { LayoutDashboard, Plug, Activity, ChevronLeft, ChevronRight, Bell, HelpCircle, LogOut, GitBranch } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  group?: string;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  { id: 'nav-center', label: 'Integration Center', href: '/', icon: LayoutDashboard, group: 'MAIN' },
  { id: 'nav-wizard', label: 'Setup Wizard', href: '/integration-setup-wizard', icon: Plug, group: 'MAIN' },
  { id: 'nav-monitoring', label: 'Monitoring', href: '/integration-monitoring', icon: Activity, badge: 3, group: 'MAIN' },
  { id: 'nav-pipelines', label: 'Pipelines', href: '#', icon: GitBranch, group: 'MAIN', disabled: true },
];

const groups = ['MAIN'];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className="flex flex-col h-full bg-sidebar-bg transition-all duration-300 ease-in-out flex-shrink-0"
      style={{ width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)' }}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-3 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <AppLogo size={32} className="flex-shrink-0" />
          {!collapsed && (
            <span className="font-semibold text-white text-[15px] tracking-tight whitespace-nowrap">
              IntegrationHub
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
        {groups.map((group) => {
          const items = navItems.filter((n) => n.group === group);
          return (
            <div key={`group-${group}`} className="mb-4">
              {!collapsed && (
                <p className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase px-3 mb-1">
                  {group}
                </p>
              )}
              {collapsed && <div className="h-px bg-slate-700 mx-2 mb-2" />}
              {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                if (item.disabled) {
                  return (
                    <div
                      key={item.id}
                      title={collapsed ? item.label : undefined}
                      className={`sidebar-item opacity-40 cursor-not-allowed pointer-events-none ${collapsed ? 'justify-center px-0' : ''}`}
                    >
                      <Icon size={18} className="flex-shrink-0" />
                      {!collapsed && (
                        <span className="flex-1 text-[13.5px]">{item.label}</span>
                      )}
                      {!collapsed && (
                        <span className="ml-auto text-[10px] text-slate-500 italic">Soon</span>
                      )}
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`sidebar-item ${active ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {!collapsed && (
                      <span className="flex-1 text-[13.5px]">{item.label}</span>
                    )}
                    {!collapsed && item.badge && item.badge > 0 && (
                      <span className="ml-auto bg-danger text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                        {item.badge}
                      </span>
                    )}
                    {collapsed && item.badge && item.badge > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-slate-700 px-2 py-3 space-y-1 flex-shrink-0">
        <div
          className={`sidebar-item w-full opacity-40 cursor-not-allowed pointer-events-none ${collapsed ? 'justify-center px-0' : ''}`}
          title={collapsed ? 'Notifications' : undefined}
        >
          <Bell size={18} className="flex-shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Notifications</span>}
        </div>
        <div
          className={`sidebar-item w-full opacity-40 cursor-not-allowed pointer-events-none ${collapsed ? 'justify-center px-0' : ''}`}
          title={collapsed ? 'Help & Support' : undefined}
        >
          <HelpCircle size={18} className="flex-shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Help & Support</span>}
        </div>

        {/* User profile */}
        <div className={`flex items-center gap-2 px-2 py-2 mt-2 rounded-md ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
            PB
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-slate-200 truncate">Pramod B</p>
              <p className="text-[10px] text-slate-500 truncate">Admin</p>
            </div>
          )}
          {!collapsed && (
            <button className="text-slate-500 hover:text-slate-300 transition-colors" title="Sign out">
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-8 border-t border-slate-700 text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-all duration-150"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}