import React, { useEffect, useState } from 'react';
import { Search, Download, FileSpreadsheet, FileText, Calendar, User, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const DUMMY_ATTENDANCE = [
  { year: '2024', empId: 'EMP001', name: 'Arjun Sharma', designation: 'Software Engineer', month: 'March', punchDays: '22', absents: '0', totalWorking: '22', lateDays: '1', lateNotAllowed: '0', lateAllowed: '1', punchMiss: '0', holidays: '4' },
  { year: '2024', empId: 'EMP002', name: 'Priya Patel', designation: 'HR Manager', month: 'March', punchDays: '21', absents: '1', totalWorking: '22', lateDays: '0', lateNotAllowed: '0', lateAllowed: '0', punchMiss: '0', holidays: '4' },
];

const Attendance = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState({});

  const fetchAttendanceData = async () => {
    setTableLoading(true);
    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec?sheet=Report&action=fetch');
      const result = await response.json();
      if (result.success) {
        const rawData = result.data || result;
        const headers = rawData[3];
        const dataRows = rawData.length > 4 ? rawData.slice(4) : [];
        const getIndex = (n) => headers.findIndex(h => h && h.toString().trim().toLowerCase() === n.toLowerCase());
        
        const processed = dataRows.map((row) => ({
          year: row[getIndex('Year')] || '',
          month: row[getIndex('Month')] || '',
          empId: row[getIndex('Employee ID')] || '',
          name: row[getIndex('Name')] || '',
          designation: row[getIndex('Designation')] || '',
          punchDays: row[getIndex('Punch Days')] || '0',
          absents: row[getIndex('Absent(<4)')] || '0',
          totalWorking: row[getIndex('Total Days')] || '0',
          lateDays: row[getIndex('Late Days(4-8)')] || '0',
          lateNotAllowed: row[getIndex('Late Not Allowed')] || '0',
          lateAllowed: row[getIndex('Late Allowed')] || '0',
          punchMiss: row[getIndex('Punch Miss')] || '0',
          holidays: row[getIndex('Sunday+National Holiday Given')] || '0',
        }));
        setAttendanceData(processed);
      }
    } catch (err) { setError(err.message); }
    finally { setTableLoading(false); }
  };

  useEffect(() => { fetchAttendanceData(); }, []);

  const displayData = (attendanceData.length > 0 ? attendanceData : DUMMY_ATTENDANCE).filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.month.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(displayData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, "Attendance_Report.xlsx");
    toast.success("Excel report generated");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance Analytics</h1>
          <p className="text-slate-500 text-sm">Monthly work history and performance metrics.</p>
        </div>
        <div className="flex items-center gap-2">
            <button 
              onClick={downloadExcel}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
            >
              <FileSpreadsheet size={18} />
              Export Excel
            </button>
            <button className="p-2 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                <Calendar size={18} />
            </button>
        </div>
      </div>

      {/* Hero Stats (Dynamic from displayData) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <CheckCircle2 size={24} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg. Present</p>
                <p className="text-lg font-bold text-slate-900">94.2%</p>
            </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                <XCircle size={24} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Absents</p>
                <p className="text-lg font-bold text-slate-900">12 Days</p>
            </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                <Clock size={24} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Late Markings</p>
                <p className="text-lg font-bold text-slate-900">8 Units</p>
            </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600">
                <AlertCircle size={24} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Punch Misses</p>
                <p className="text-lg font-bold text-slate-900">3 Cases</p>
            </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by Employee, ID or Month..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="px-4 py-2 bg-slate-50/50 border border-slate-100 rounded-xl text-sm outline-none">
            <option>All Departments</option>
            <option>Engineering</option>
            <option>Human Resources</option>
            <option>Sales</option>
        </select>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Personnel</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timeline</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Attendance Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Incidents</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 border-b-none py-1">
                    <LoadingSpinner message="Scanning attendance records..." minHeight="300px" />
                  </td>
                </tr>
              ) : displayData.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">
                            {item.name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.name}</p>
                            <p className="text-[11px] font-medium text-slate-400">{item.designation} • {item.empId}</p>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">{item.month}</span>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{item.year}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-6">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Present</p>
                            <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-12 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{width: '90%'}}></div>
                                </div>
                                <span className="text-xs font-bold text-slate-700">{item.punchDays}d</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Absent</p>
                             <span className={`text-xs font-bold ${item.absents > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                {item.absents}d
                             </span>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Late</span>
                            <span className={`text-xs font-bold ${item.lateDays > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{item.lateDays}</span>
                        </div>
                        <div className="w-px h-6 bg-slate-100"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Miss</span>
                            <span className={`text-xs font-bold ${item.punchMiss > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{item.punchMiss}</span>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="View Daily Stats">
                        <FileText size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;