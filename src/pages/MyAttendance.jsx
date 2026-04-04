import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, MapPin } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const MyAttendance = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [userAttendanceData, setUserAttendanceData] = useState([]);
  const [activeTab, setActiveTab] = useState('monthly');

  // Get username from localStorage
  const getUsername = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        return parsedUser.username || parsedUser.Name || parsedUser.salesPersonName || '';
      }
      return '';
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      return '';
    }
  };

  const fetchReportDailySheet = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec?sheet=Report Daily&action=fetch'
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data from Report Daily sheet');
      }

      const rawData = result.data || result;
      if (!Array.isArray(rawData)) {
        throw new Error('Expected array data not received');
      }

      // Find the header row
      let headerRowIndex = 0;
      for (let i = 0; i < rawData.length; i++) {
        if (rawData[i] && rawData[i].some(cell => cell && cell.toString().toLowerCase().includes('date'))) {
          headerRowIndex = i;
          break;
        }
      }

      const headers = rawData[headerRowIndex].map(h => h?.toString().trim() || '');
      const dataRows = rawData.length > headerRowIndex + 1 ? rawData.slice(headerRowIndex + 1) : [];

      const processedData = dataRows.map((row) => {
        const obj = {};
        headers.forEach((header, colIndex) => {
          obj[header] = row[colIndex] !== undefined && row[colIndex] !== null ? row[colIndex].toString() : '';
        });
        return obj;
      });

      setAttendanceData(processedData);

    } catch (error) {
      console.error('Error fetching Report Daily sheet:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const username = getUsername();
    if (username && attendanceData.length > 0) {
      const filteredData = attendanceData.filter(record => {
        const nameInSheet = record['Name'] || record['name'] || record['G'] || '';
        return nameInSheet.toLowerCase().includes(username.toLowerCase());
      }).reverse(); // Latest first for daily logs
      setUserAttendanceData(filteredData);
    }
  }, [attendanceData]);

  useEffect(() => {
    fetchReportDailySheet();
  }, []);

  const parseTimeString = (timeStr) => {
    if (!timeStr || timeStr === '-' || timeStr === '') return null;
    let cleanTime = timeStr.toString().trim();
    let isPM = false;
    if (cleanTime.toLowerCase().includes('pm')) {
      isPM = true;
      cleanTime = cleanTime.toLowerCase().replace('pm', '').trim();
    } else if (cleanTime.toLowerCase().includes('am')) {
      cleanTime = cleanTime.toLowerCase().replace('am', '').trim();
    }
    const parts = cleanTime.split(':');
    if (parts.length < 2) return null;
    let hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parts.length > 2 ? parseInt(parts[2], 10) : 0;
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    return new Date(2000, 0, 1, hours, minutes, seconds);
  };

  const filteredAttendance = userAttendanceData.filter(record => {
    const dateValue = record.Date || record.date || record['C'] || '';
    if (!dateValue) return false;
    try {
      let recordDate;
      if (dateValue.includes('-')) {
        const [year, month, day] = dateValue.split('-').map(Number);
        recordDate = new Date(year, month - 1, day);
      } else if (dateValue.includes('/')) {
        const parts = dateValue.split('/');
        // Handle DD/MM/YYYY
        recordDate = new Date(parts[2], parts[1] - 1, parts[0]);
      } else return true;
      return recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear;
    } catch (e) { return true; }
  });

  const presentDays = filteredAttendance.filter(record => {
    const status = record['Status'] || record['status'] || record['L'] || '';
    return status.toLowerCase().includes('present') || status.toLowerCase().includes('holiday');
  }).length;

  const absentDays = filteredAttendance.filter(record => {
    const status = record['Status'] || record['status'] || record['L'] || '';
    return status.toLowerCase().includes('absent');
  }).length;

  const totalWorkingHours = filteredAttendance.reduce((sum, record) => {
    const hoursStr = record['Working Hours'] || record['working hours'] || '0';
    const hours = parseFloat(hoursStr);
    return sum + (isNaN(hours) ? 0 : hours);
  }, 0);

  const totalOvertime = filteredAttendance.reduce((sum, record) => {
    const otStr = record['Overtime Hours'] || record['overtime hours'] || '0';
    const ot = parseFloat(otStr);
    return sum + (isNaN(ot) ? 0 : ot);
  }, 0);

  const getStatus = (record) => {
    const status = record['Status'] || record['status'] || record['L'] || '';
    if (status && status !== '' && status !== '-') return status;
    return (record['Check In'] || record['In Time']) ? 'Present' : 'Absent';
  };

  const getStatusColor = (status) => {
    if (!status) return 'slate';
    const s = status.toLowerCase();
    if (s.includes('present')) return 'emerald';
    if (s.includes('absent')) return 'rose';
    if (s.includes('late')) return 'amber';
    if (s.includes('holiday')) return 'indigo';
    return 'slate';
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = [2024, 2025, 2026];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 font-outfit">
      
      {/* Header Container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Attendance History</h1>
           <p className="text-slate-500 text-sm font-medium">Track your presence and work duration logs.</p>
        </div>
      </div>

      {/* Unified Filter Toolbar */}
      <div className="bg-white/60 backdrop-blur-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 rounded-3xl border border-slate-200/60 shadow-sm">
         <div className="flex p-1.5 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('monthly')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'monthly' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Calendar size={16} /> Monthly Summary
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'daily' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Clock size={16} /> Daily Logs
            </button>
         </div>

         {activeTab === 'monthly' && (
             <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                 <select
                   value={selectedMonth}
                   onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                   className="w-full md:w-auto px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                 >
                   {months.map((month, index) => (
                     <option key={index} value={index}>{month}</option>
                   ))}
                 </select>
                 <select
                   value={selectedYear}
                   onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                   className="w-full md:w-auto px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                 >
                   {years.map(year => (
                     <option key={year} value={year}>{year}</option>
                   ))}
                 </select>
             </div>
         )}
      </div>

      {activeTab === 'monthly' ? (
        <>
          {/* Modern Statistics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total Logs', value: filteredAttendance.length, icon: Calendar, color: 'blue' },
              { label: 'Present', value: presentDays, icon: CheckCircle, color: 'emerald' },
              { label: 'Absent', value: absentDays, icon: XCircle, color: 'rose' },
              { label: 'Hrs Worked', value: totalWorkingHours.toFixed(1), icon: Clock, color: 'indigo' },
              { label: 'Overtime', value: totalOvertime.toFixed(1), icon: Clock, color: 'amber' }
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm transition-all hover:shadow-md flex flex-col gap-2">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-600 mb-2`}>
                      <Icon size={20} />
                   </div>
                   <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                   <p className="text-3xl font-black text-slate-900 leading-none">{stat.value}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            {loading ? (
              <div className="p-12 flex items-center justify-center min-h-[300px]">
                 <LoadingSpinner message="Syncing records..." />
              </div>
            ) : error ? (
              <div className="p-12 text-center min-h-[300px] flex flex-col justify-center items-center">
                <p className="text-rose-500 text-sm font-bold mb-3">{error}</p>
                <button onClick={fetchReportDailySheet} className="px-5 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors uppercase tracking-widest shadow-sm">Retry Request</button>
              </div>
            ) : (
              <div className="overflow-x-auto min-h-[400px] max-h-[calc(105vh-280px)] overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/60">Date</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/60">Punch In/Out</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/60">Duration</th>
                      <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/60 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {filteredAttendance.length > 0 ? filteredAttendance.map((record, index) => {
                      const status = getStatus(record);
                      const color = getStatusColor(status);
                      return (
                        <tr key={index} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-bold text-slate-800 transition-colors">{record.Date || record['C'] || '-'}</p>
                            <p className="text-[11px] font-medium text-slate-400 uppercase mt-1 tracking-wider">{record.Day || record['D'] || ''}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                               <span className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm">{record['In Time'] || record['Check In'] || '--:--'}</span>
                               <span className="text-slate-300 font-bold">→</span>
                               <span className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm">{record['Out Time'] || record['Check Out'] || '--:--'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none shadow-sm inline-block">
                              {record['Working Hours'] || '0.0'} HRS
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm bg-${color}-100 text-${color}-700`}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan="4" className="px-6 py-20 text-center text-slate-400 text-sm font-bold">No records found for this period.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="px-6 py-4 border-b border-slate-200/60 bg-slate-50/50 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Chronological Activity</h2>
            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-full uppercase tracking-widest">Snapshot</span>
          </div>
          
          <div className="overflow-x-auto min-h-[400px] max-h-[calc(105vh-280px)] overflow-y-auto w-full">
            <table className="w-full text-left border-collapse min-w-[1000px]">
               <thead className="bg-slate-50/50 sticky top-[60px] z-10 backdrop-blur-sm shadow-sm md:shadow-none">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/60 w-[150px]">Timeline</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/60 w-[250px]">Work Detail</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/60 w-[150px]">Metrics</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/60 w-[150px] text-right">Status</th>
                  </tr>
               </thead>
               <tbody className="bg-white divide-y divide-slate-100">
                  {userAttendanceData.length > 0 ? userAttendanceData.slice(0, 50).map((record, index) => {
                    const status = getStatus(record);
                    const color = getStatusColor(status);
                    return (
                      <tr key={index} className="hover:bg-slate-50/80 transition-all border-l-4 border-transparent hover:border-indigo-500 group">
                         <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{record.Date || '-'}</p>
                            <p className="text-[11px] font-medium text-slate-400 uppercase mt-1 tracking-wider">{record.Day || ''}</p>
                         </td>
                         <td className="px-6 py-4">
                            <div className="space-y-1.5">
                               <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded shadow-sm tracking-widest uppercase">
                                     @{record['Punch Status'] || 'Punch'}
                                  </span>
                                  <span className="text-xs font-bold text-slate-800 line-clamp-1">{record['Client Name'] || 'In-House'}</span>
                               </div>
                               <p className="text-[10px] font-medium text-slate-500 flex items-start gap-1">
                                  <MapPin size={12} className="text-amber-500 mt-0.5" />
                                  <span className="line-clamp-2 max-w-[300px]">
                                    {record['Latitude'] ? `${record['Latitude']}, ${record['Longitude']}` : 'Location NA'}
                                  </span>
                               </p>
                            </div>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1.5">
                               <span className="text-[10px] font-black text-indigo-600 tracking-widest uppercase bg-indigo-50 px-2 py-1 rounded inline-block w-fit">WORK: {record['Working Hours'] || '0'}H</span>
                               {record['Late Minutes'] > 0 && <span className="text-[10px] font-black text-rose-500 tracking-widest uppercase bg-rose-50 px-2 py-1 rounded inline-block w-fit">LATE: {record['Late Minutes']}M</span>}
                            </div>
                         </td>
                         <td className="px-6 py-4 text-right">
                            <div className="flex flex-col items-end gap-2">
                               <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm bg-${color}-100 text-${color}-700`}>
                                  {status}
                               </span>
                               {record['Image URL'] && (
                                 <button 
                                   onClick={() => window.open(record['Image URL'], '_blank')}
                                   className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 underline tracking-wider uppercase transition-colors"
                                 >Photo</button>
                               )}
                            </div>
                         </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan="4" className="px-6 py-20 text-center text-slate-400 font-bold text-sm uppercase tracking-widest">Registry is empty.</td></tr>
                  )}
               </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAttendance;