import React, { useState, useEffect } from 'react';
import { Filter, Search, Clock, CheckCircle, X, User, Briefcase, Calendar, AlertCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const DUMMY_PENDING_LEAVING = [
  { employeeNo: 'EMP102', candidateName: 'Rohan Gupta', fatherName: 'Alok Gupta', dateOfJoining: '2022-05-10', designation: 'Senior Analyst', department: 'Finance', mobileNo: '9812345678' },
];

const DUMMY_LEAVING_HISTORY = [
  { employeeId: 'EMP045', name: 'Sneha Kapoor', dateOfJoining: '2021-03-15', dateOfLeaving: '2024-01-20', designation: 'HR Exec', department: 'HR', reasonOfLeaving: 'Personal Reasons' },
];

const Leaving = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pendingData, setPendingData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    dateOfLeaving: '',
    mobileNumber: '',
    reasonOfLeaving: ''
  });

  const fetchJoiningData = async () => {
    setTableLoading(true);
    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec?sheet=JOINING&action=fetch');
      const result = await response.json();
      if (result.success) {
        const rawData = result.data || result;
        const dataRows = rawData.length > 6 ? rawData.slice(6) : [];
        const processed = dataRows.map((row, index) => ({
          rowIndex: index + 7,
          employeeNo: row[1] || '',
          candidateName: row[2] || '',
          fatherName: row[3] || '',
          dateOfJoining: row[4] || '',
          designation: row[5] || '',
          department: row[20] || '',
          mobileNo: row[11] || '',
          leavingDate: row[24] || '',
          columnAB: row[27] || '',
        })).filter(task => task.columnAB && !task.leavingDate);
        setPendingData(processed);
      }
    } catch (err) { setError(err.message); }
    finally { setTableLoading(false); }
  };

  const fetchLeavingData = async () => {
    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec?sheet=LEAVING&action=fetch');
      const result = await response.json();
      if (result.success) {
        const rawData = result.data || result;
        const dataRows = rawData.length > 6 ? rawData.slice(6) : [];
        const processed = dataRows.map(row => ({
          employeeId: row[1] || '',
          name: row[2] || '',
          dateOfLeaving: row[3] || '',
          reasonOfLeaving: row[5] || '',
          designation: row[10] || '',
          department: row[11] || '',
          dateOfJoining: row[8] || '',
        }));
        setHistoryData(processed);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchJoiningData(); fetchLeavingData(); }, []);

  const displayPending = (pendingData.length > 0 ? pendingData : DUMMY_PENDING_LEAVING).filter(item => 
    item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.employeeNo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayHistory = (historyData.length > 0 ? historyData : DUMMY_LEAVING_HISTORY).filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLeavingClick = (item) => {
    setSelectedItem(item);
    setFormData({ dateOfLeaving: '', mobileNumber: item.mobileNo || '', reasonOfLeaving: '' });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Off-boarding Management</h1>
          <p className="text-slate-500 text-sm">Process employee exits and maintain historical records.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search records..." 
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500 w-full sm:w-64 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 p-1 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'pending' 
              ? "bg-white text-slate-900 shadow-sm border border-slate-100" 
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Clock size={16} />
            Pending Exits ({displayPending.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'history' 
              ? "bg-white text-slate-900 shadow-sm border border-slate-100" 
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            }`}
          >
            <CheckCircle size={16} />
            Exit History ({displayHistory.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'pending' ? (
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/30">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Employee</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Position & ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Joined On</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tableLoading ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-1">
                      <LoadingSpinner message="Syncing off-boarding queue..." minHeight="300px" />
                    </td>
                  </tr>
                ) : displayPending.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.candidateName}</p>
                          <p className="text-xs text-slate-400 font-medium">S/O {item.fatherName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-700">{item.designation}</p>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">{item.employeeNo}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar size={14} />
                        <span className="text-xs font-medium">{item.dateOfJoining}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleLeavingClick(item)}
                        className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-all shadow-sm hover:shadow"
                      >
                        Process Exit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/30">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Employee</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Service Period</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reason</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayHistory.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-400">{item.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                        <span>{item.dateOfJoining}</span>
                        <ArrowRight size={12} className="text-slate-300" />
                        <span className="text-rose-600">{item.dateOfLeaving}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-medium text-slate-500 italic">"{item.reasonOfLeaving}"</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex px-2 py-1 rounded text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wider">Archived</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Exit Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in duration-300 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-rose-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-100">
                  <AlertCircle size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Process Exit</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            
            <form className="p-8 space-y-5">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identified Personnel</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-800">{selectedItem.candidateName}</p>
                  <p className="text-xs font-bold text-rose-600">{selectedItem.employeeNo}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Last Working Date *</label>
                <input 
                  type="date" 
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                  value={formData.dateOfLeaving}
                  onChange={(e) => setFormData({...formData, dateOfLeaving: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Exit Reason *</label>
                <textarea 
                  required 
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all resize-none"
                  placeholder="Employee resignation details..."
                  value={formData.reasonOfLeaving}
                  onChange={(e) => setFormData({...formData, reasonOfLeaving: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button 
                   type="submit"
                   disabled={submitting}
                   className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all flex items-center justify-center gap-2"
                >
                  {submitting && <Clock size={14} className="animate-spin" />}
                  Confirm Exit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaving;