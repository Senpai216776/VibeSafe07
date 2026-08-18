import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  Play,
  Square,
  Bell,
  Shield,
  User,
  Radio,
  CheckCircle2,
  Sliders,
  Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import { emergencyAudio } from '../utils/audioAlert';

export const Settings = () => {
  const { user } = useAuth();
  const { wsConnected, isSirenMuted, toggleMute } = useAlerts();

  const [volume, setVolume] = useState(50);
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [browserNotifications, setBrowserNotifications] = useState(true);

  const handleVolumeChange = (e) => {
    const val = Number(e.target.value);
    setVolume(val);
    emergencyAudio.setVolume(val / 100);
  };

  const handleTestSiren = () => {
    if (isPlayingTest) {
      emergencyAudio.stop();
      setIsPlayingTest(false);
    } else {
      emergencyAudio.setMuted(false);
      emergencyAudio.setVolume(volume / 100);
      emergencyAudio.playSiren();
      setIsPlayingTest(true);
    }
  };

  const handleTestChime = () => {
    emergencyAudio.setMuted(false);
    emergencyAudio.setVolume(volume / 100);
    emergencyAudio.playSingleChime();
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6 text-indigo-400" />
          Settings & Command Preferences
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Configure emergency audio alarms, browser notifications, and hardware communication parameters
        </p>
      </div>

      {/* Audio Siren Configuration */}
      <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-red-400" />
            Emergency Audio Alarm (Web Audio API)
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/60 text-gray-400 border border-gray-800">
            Synthesizer Zero-Dependency
          </span>
        </div>

        <p className="text-xs text-gray-400">
          When an ESP32-C3 distress signal is received, the dashboard plays a dual-tone emergency siren.
        </p>

        {/* Volume Slider */}
        <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-gray-300">Alarm Master Volume</span>
            <span className="font-mono text-indigo-300 font-bold">{volume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            onClick={handleTestSiren}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              isPlayingTest
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
            }`}
          >
            {isPlayingTest ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {isPlayingTest ? 'Stop Alarm Test' : 'Test Emergency Siren'}
          </button>

          <button
            onClick={handleTestChime}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Bell className="w-3.5 h-3.5 text-yellow-400" />
            Test Priority Chime
          </button>

          <button
            onClick={toggleMute}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              isSirenMuted
                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {isSirenMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            {isSirenMuted ? 'Alarms Currently Muted' : 'Alarms Enabled'}
          </button>
        </div>
      </div>

      {/* Responder Profile */}
      <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-400" />
          Active Responder Identity
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
            <span className="text-gray-400 block mb-1">Operator Name</span>
            <span className="font-bold text-white">{user?.name || 'Chief Commander'}</span>
          </div>

          <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
            <span className="text-gray-400 block mb-1">Authorized Email</span>
            <span className="font-mono text-gray-200">{user?.email || 'admin@vibesafe.io'}</span>
          </div>

          <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
            <span className="text-gray-400 block mb-1">Role / Clearance</span>
            <span className="font-bold uppercase text-emerald-400">{user?.role || 'Admin'}</span>
          </div>

          <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
            <span className="text-gray-400 block mb-1">Direct Contact Phone</span>
            <span className="font-mono text-gray-200">{user?.phone || '+1 (555) 911-0199'}</span>
          </div>
        </div>
      </div>

      {/* Cloud & Realtime Connection Info */}
      <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-400" />
          Gateway & Cloud Deployment
        </h3>

        <div className="text-xs space-y-2">
          <div className="flex items-center justify-between py-1.5 border-b border-gray-800">
            <span className="text-gray-400">WebSocket Real-Time Link:</span>
            <span className="font-mono text-emerald-400 font-bold">
              {wsConnected ? 'Connected (ws:// / wss://)' : 'Polling Fallback Sync Active'}
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-gray-800">
            <span className="text-gray-400">Vercel Serverless Ready:</span>
            <span className="font-mono text-indigo-300 font-bold">Enabled (/api/index.js)</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-gray-400">Hardware REST Ingestion:</span>
            <span className="font-mono text-yellow-300">/api/v1/devices/sos</span>
          </div>
        </div>
      </div>
    </div>
  );
};
