import React, { useState } from 'react';
import { Calendar, Users, List, BarChart3, Search, Filter, Download, FileSpreadsheet } from 'lucide-react';
import Attendancedaily from './Attendancedaily';
import Attendance from './Attendance';

const AdminAttendance = () => {
  const [activeTab, setActiveTab] = useState('daily');

  const tabs = [
    { id: 'daily', label: 'Daily Log', icon: List, description: 'Real-time punch and shift logs' },
    { id: 'monthly', label: 'Monthly Summary', icon: BarChart3, description: 'Aggregated analytics and performance' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Dashboard Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Users size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Dashboard</h1>
            <p className="text-slate-500 text-sm font-medium">Comprehensive management of employee workplace presence.</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Context Info */}
      <div className="px-1 flex items-center gap-2">
        <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
        <h2 className="text-base font-bold text-slate-800 tracking-tight">
          {tabs.find(t => t.id === activeTab)?.label} View
        </h2>
        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-widest">
          {tabs.find(t => t.id === activeTab)?.description}
        </span>
      </div>

      {/* Active Content */}
      <div className="transition-all duration-300">
        {activeTab === 'daily' ? (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <Attendancedaily />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <Attendance />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAttendance;
