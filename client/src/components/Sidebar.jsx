import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  Cpu,
  FileCode,
  Settings,
  Shield,
  HelpCircle,
  Radio
} from 'lucide-react';
import { useAlerts } from '../context/AlertContext';

export const Sidebar = ({ mobileOpen, onCloseMobile }) => {
  const { activeAlerts, stats } = useAlerts();

  const navItems = [
    {
      to: '/',
      label: 'Command Center',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/alerts',
      label: 'Incident History',
      icon: AlertTriangle,
      badge: activeAlerts.length > 0 ? activeAlerts.length : null,
      badgeColor: 'bg-red-500 text-white animate-pulse',
    },
    {
      to: '/devices',
      label: 'Registered Devices',
      icon: Cpu,
      badge: stats.totalDevices,
      badgeColor: 'bg-gray-800 text-gray-300',
    },
    {
      to: '/firmware',
      label: 'ESP32-C3 Firmware',
      icon: FileCode,
      badge: 'C++',
      badgeColor: 'bg-indigo-950 text-indigo-300 border border-indigo-800',
    },
    {
      to: '/settings',
      label: 'Settings & Siren',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-[#0B0F19] border-r border-gray-800 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation Links */}
        <div className="p-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Emergency Monitoring
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-red-600/20 to-indigo-600/10 text-white border border-red-500/30 shadow-lg'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                      item.badgeColor || 'bg-gray-800 text-gray-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Hardware Info Card */}
        <div className="p-4 border-t border-gray-800/80 bg-gray-950/60">
          <div className="p-3 bg-gray-900/80 rounded-xl border border-gray-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                VibeSafe Guard
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/60">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              ESP32-C3 SuperMini firmware communicating over secure TLS/REST API.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
