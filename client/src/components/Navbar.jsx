import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Radio,
  Volume2,
  VolumeX,
  Cpu,
  LogOut,
  User,
  Menu,
  Bell,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';

export const Navbar = ({ onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const {
    activeAlerts,
    wsConnected,
    isSirenMuted,
    toggleMute,
    toggleSimulator,
  } = useAlerts();

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Mobile Menu */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMobileMenu}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 via-red-500 to-amber-500 p-0.5 shadow-lg shadow-red-950/60 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-gray-950 rounded-[10px] flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg text-white tracking-tight leading-none flex items-center gap-1.5">
                  Vibe<span className="text-red-500">Safe</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-red-950 text-red-400 border border-red-800/60 rounded font-semibold">
                    ESP32-C3
                  </span>
                </span>
                <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">
                  Safety Command Center
                </span>
              </div>
            </Link>
          </div>

          {/* Center / Status Indicators */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Live Real-time Stream Status */}
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-900/80 border border-gray-800 rounded-full text-xs">
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              <span className="text-gray-300 font-medium font-mono text-[11px]">
                {wsConnected ? 'Real-time WebSocket Live' : 'Polling Sync Active'}
              </span>
            </div>

            {/* Active SOS Pill */}
            {activeAlerts.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-950/80 border border-red-500/60 rounded-full text-xs text-red-300 font-bold animate-pulse">
                <Radio className="w-3.5 h-3.5 text-red-400" />
                <span>{activeAlerts.length} Active Emergency</span>
              </div>
            )}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Audio Siren Toggle */}
            <button
              onClick={toggleMute}
              title={isSirenMuted ? 'Alarm is Muted' : 'Alarm is Active'}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                isSirenMuted
                  ? 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                  : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
              }`}
            >
              {isSirenMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-red-400 animate-pulse" />}
              <span className="hidden sm:inline text-[11px]">{isSirenMuted ? 'Muted' : 'Siren On'}</span>
            </button>

            {/* Hardware Simulator Button */}
            <button
              onClick={toggleSimulator}
              className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span className="hidden md:inline">ESP32 Simulator</span>
            </button>

            {/* User Profile / Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-800">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-gray-200">{user?.name || 'Commander'}</span>
                <span className="text-[10px] text-emerald-400 font-mono capitalize">{user?.role || 'Responder'}</span>
              </div>

              <button
                onClick={logout}
                title="Logout"
                className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-red-400 hover:border-red-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
