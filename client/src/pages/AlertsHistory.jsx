import React, { useState } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  Download,
  Clock,
  MapPin,
  CheckCircle2,
  AlertOctagon,
  ExternalLink,
  ShieldCheck,
  Radio,
  FileText
} from 'lucide-react';
import { useAlerts } from '../context/AlertContext';
import { BatteryBadge } from '../components/BatteryBadge';
import { api } from '../utils/api';

export const AlertsHistory = () => {
  const { alerts, setSelectedAlert } = useAlerts();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const filteredAlerts = alerts.filter((alert) => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      alert.id.toLowerCase().includes(searchLower) ||
      alert.deviceId.toLowerCase().includes(searchLower) ||
      alert.ownerName.toLowerCase().includes(searchLower) ||
      (alert.notes && alert.notes.toLowerCase().includes(searchLower)) ||
      (alert.resolvedBy && alert.resolvedBy.toLowerCase().includes(searchLower));

    // Status filter
    let matchesStatus = true;
    if (statusFilter === 'active_all') {
      matchesStatus = alert.status === 'active' || alert.status === 'acknowledged' || alert.status === 'responded';
    } else if (statusFilter !== 'all') {
      matchesStatus = alert.status === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  const handleDownloadCsv = () => {
    window.open(api.alerts.exportCsvUrl(), '_blank');
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredAlerts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `vibesafe-alerts-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            Emergency Incident Audit Log
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Full chronological archive of all SOS distress signals, triage timelines, and resolution records
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCsv}
            className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-xl text-xs font-semibold text-gray-200 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Export CSV
          </button>
          <button
            onClick={handleDownloadJson}
            className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-xl text-xs font-semibold text-gray-200 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-gray-900/70 border border-gray-800 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Alert ID, Device ID, Owner, Responder..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {[
              { id: 'all', label: 'All Incidents' },
              { id: 'active_all', label: 'Active SOS' },
              { id: 'resolved', label: 'Resolved' },
              { id: 'false_alarm', label: 'False Alarm' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-950 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-gray-900/70 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-950/80 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800">
              <tr>
                <th className="px-4 py-3.5">Incident ID</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Device & Holder</th>
                <th className="px-4 py-3.5">Battery</th>
                <th className="px-4 py-3.5">Trigger Time</th>
                <th className="px-4 py-3.5">Location</th>
                <th className="px-4 py-3.5">Resolution / Responders</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No emergency incidents match your filters.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => {
                  const isSos = alert.status === 'active';
                  const isResolved = alert.status === 'resolved' || alert.status === 'false_alarm';

                  return (
                    <tr
                      key={alert.id}
                      onClick={() => setSelectedAlert(alert)}
                      className="hover:bg-gray-800/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3.5 font-mono font-bold text-white">
                        <span className="flex items-center gap-1.5">
                          {isSos ? (
                            <AlertOctagon className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          {alert.id}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                            alert.status === 'active'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                              : alert.status === 'acknowledged'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : alert.status === 'responded'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                              : alert.status === 'false_alarm'
                              ? 'bg-gray-800 text-gray-300 border border-gray-700'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          }`}
                        >
                          {alert.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white">{alert.ownerName}</div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {alert.deviceId} ({alert.deviceName || 'ESP32'})
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <BatteryBadge level={alert.batteryLevel} voltage={alert.voltage} />
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px]">
                        <div>{new Date(alert.triggeredAt).toLocaleDateString()}</div>
                        <div className="text-gray-400">{new Date(alert.triggeredAt).toLocaleTimeString()}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        {alert.lat && alert.lng ? (
                          <div className="font-mono text-[11px] text-gray-300">
                            {alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}
                          </div>
                        ) : (
                          <span className="text-gray-500">No GPS Lock</span>
                        )}
                        {alert.address && (
                          <div className="text-[10px] text-gray-400 truncate max-w-[180px]">{alert.address}</div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-gray-300 text-xs">
                        {alert.resolvedBy ? (
                          <div>
                            <span className="text-emerald-400 font-medium">Closed by {alert.resolvedBy}</span>
                          </div>
                        ) : alert.acknowledgedBy ? (
                          <span className="text-amber-400">Acknowledged by {alert.acknowledgedBy}</span>
                        ) : (
                          <span className="text-red-400 font-bold">Unassigned Dispatch</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAlert(alert);
                          }}
                          className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-semibold"
                        >
                          View Logs &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
