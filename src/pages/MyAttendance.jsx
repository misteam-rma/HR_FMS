import { Calendar, Clock, CheckCircle, XCircle, MapPin, Loader2 } from 'lucide-react';
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
    if (!status) return 'gray';
    const s = status.toLowerCase();
    if (s.includes('present')) return 'emerald';
    if (s.includes('absent')) return 'rose';
    if (s.includes('late')) return 'amber';
    if (s.includes('holiday')) return 'indigo';
    return 'gray';
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = [2024, 2025, 2026];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Attendance History</h1>
           <p className="text-slate-500 text-sm font-medium">Track your presence and work duration logs.</p>
        </div>
        
        <div className="flex p-1.5 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm self-start md:self-center">
            <button
              onClick={() => setActiveTab('monthly')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'monthly' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Monthly Summary
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'daily' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Daily Logs
            </button>
        </div>
      </div>

      {activeTab === 'monthly' ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total Logs', value: filteredAttendance.length, icon: Calendar, color: 'blue' },
              { label: 'Present', value: presentDays, icon: CheckCircle, color: 'emerald' },
              { label: 'Absent', value: absentDays, icon: XCircle, color: 'rose' },
              { label: 'Hrs Worked', value: totalWorkingHours.toFixed(1), icon: Clock, color: 'indigo' },
              { label: 'Overtime', value: totalOvertime.toFixed(1), icon: Clock, color: 'amber' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-600`}>
                    <stat.icon size={18} />
                 </div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                 <p className="text-lg font-bold text-slate-900 leading-none">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="relative flex-1 max-w-[200px]">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index}>{month}</option>
                  ))}
                </select>
              </div>
              <div className="relative flex-1 max-w-[150px]">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
            {loading ? (
              <LoadingSpinner message="Syncing records..." minHeight="300px" />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Punch In/Out</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration</th>
                      <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-50">
                    {filteredAttendance.length > 0 ? filteredAttendance.map((record, index) => {
                      const status = getStatus(record);
                      const color = getStatusColor(status);
                      return (
                        <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-xs font-bold text-slate-800 uppercase leading-none">{record.Date || record['C'] || '-'}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">{record.Day || record['D'] || ''}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                               <span className="text-xs font-bold text-slate-700">{record['In Time'] || record['Check In'] || '--:--'}</span>
                               <span className="text-slate-300">→</span>
                               <span className="text-xs font-bold text-slate-700">{record['Out Time'] || record['Check Out'] || '--:--'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-none">
                              {record['Working Hours'] || '0.0'} HRS
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm bg-${color}-100 text-${color}-700`}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan="4" className="px-6 py-20 text-center text-slate-400 text-xs font-bold uppercase">No records found for this period.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Chronological Activity</h2>
            <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 uppercase">Snapshot</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
               <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timeline</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Work Detail</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metrics</th>
                    <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
               </thead>
               <tbody className="bg-white divide-y divide-slate-50">
                  {userAttendanceData.length > 0 ? userAttendanceData.slice(0, 50).map((record, index) => {
                    const status = getStatus(record);
                    const color = getStatusColor(status);
                    return (
                      <tr key={index} className="hover:bg-slate-50/50 transition-all border-l-4 border-transparent hover:border-indigo-500">
                         <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-xs font-bold text-slate-900 leading-none">{record.Date || '-'}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1.5 tracking-tighter">{record.Day || ''}</p>
                         </td>
                         <td className="px-6 py-4">
                            <div className="space-y-1">
                               <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded tracking-tighter uppercase whitespace-nowrap">@{record['Punch Status'] || 'Punch'}</span>
                                  <span className="text-[11px] font-bold text-slate-800 truncate max-w-[150px] inline-block">{record['Client Name'] || 'In-House'}</span>
                               </div>
                               <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tight">
                                  <MapPin size={10} className="text-amber-500" />
                                  {record['Latitude'] ? `${record['Latitude']}, ${record['Longitude']}` : 'Location NA'}
                               </p>
                            </div>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                               <span className="text-[10px] font-bold text-indigo-600 tracking-widest uppercase">WORK: {record['Working Hours'] || '0'}H</span>
                               {record['Late Minutes'] > 0 && <span className="text-[10px] font-bold text-rose-500 tracking-widest uppercase">LATE: {record['Late Minutes']}M</span>}
                            </div>
                         </td>
                         <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                               <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-${color}-100 text-${color}-700`}>
                                  {status}
                               </span>
                               {record['Image URL'] && (
                                 <button 
                                   onClick={() => window.open(record['Image URL'], '_blank')}
                                   className="text-[9px] font-bold text-indigo-500 hover:text-indigo-700 underline tracking-tighter uppercase"
                                 >View Photo</button>
                               )}
                            </div>
                         </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan="4" className="px-6 py-20 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">Registry is empty.</td></tr>
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