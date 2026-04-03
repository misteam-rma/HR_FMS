import { Search, Download } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Attendancedaily = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAttendanceData = async () => {
    setLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec?sheet=Report Daily&action=fetch'
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Raw Report Daily API response:', result);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data from Report Daily sheet');
      }

      const rawData = result.data || result;

      if (!Array.isArray(rawData)) {
        throw new Error('Expected array data not received');
      }

      // Process data - assuming first row contains headers
      const headers = rawData[0]; // First row as headers
      const dataRows = rawData.length > 1 ? rawData.slice(1) : [];

      const processedData = dataRows.map((row) => ({
        year: row[0] || '', // Column A (index-0)
        monthName: row[1] || '', // Column B (index-1)
        date: row[2] || '', // Column C (index-2)
        day: row[3] || '', // Column D (index-3)
        companyName: row[4] || '', // Column E (index-4)
        empIdCode: row[5] || '', // Column F (index-5)
        name: row[6] || '', // Column G (index-6)
        designation: row[7] || '', // Column H (index-7)
        holiday: row[8] || '', // Column I (index-8)
        workingDay: row[9] || '', // Column J (index-9)
        nHoliday: row[10] || '', // Column K (index-10)
        status: row[11] || '', // Column L (index-11)
        inTime: row[12] || '', // Column M (index-12)
        outTime: row[13] || '', // Column N (index-13)
        workingHours: row[14] || '', // Column O (index-14)
        lateMinutes: row[15] || '', // Column P (index-15)
        earlyOut: row[16] || '', // Column Q (index-16)
        overtimeHours: row[17] || '', // Column R (index-17)
        punchMiss: row[18] || '', // Column S (index-18)
        remarks: row[19] || '', // Column T (index-19)
      }));

      console.log('Processed attendance data:', processedData);
      setAttendanceData(processedData);

    } catch (error) {
      console.error('Error fetching Report Daily data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  // Filter data based on search term and date range
  const filteredData = attendanceData.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.empIdCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.year.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.monthName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.day.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.companyName.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDateRange = true;
    if (startDate || endDate) {
      const itemDate = new Date(item.date);
      if (startDate) {
        const start = new Date(startDate);
        if (itemDate < start) matchesDateRange = false;
      }
      if (endDate && matchesDateRange) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (itemDate > end) matchesDateRange = false;
      }
    }
    return matchesSearch && matchesDateRange;
  });

  const getStatusColor = (status) => {
    const s = status.toLowerCase();
    if (s.includes('present') || s === 'p') return 'emerald';
    if (s.includes('absent') || s === 'a') return 'rose';
    if (s.includes('late')) return 'amber';
    if (s.includes('holiday')) return 'indigo';
    return 'gray';
  };

  // Download CSV function
  const downloadCSV = () => {
    if (filteredData.length === 0) return;

    // Define CSV headers
    const headers = [
      'Year', 'Month Name', 'Date', 'Day', 'Company Name', 'Emp ID Code',
      'Name', 'Designation', 'Holiday (Yes/No)', 'Working Day (Yes/No)',
      'N-Holiday (Holiday Name)', 'Status', 'In Time', 'Out Time',
      'Working Hours', 'Late Minutes', 'Early Out', 'Overtime Hours',
      'Punch Miss', 'Remarks'
    ];

    // Convert data to CSV format
    const csvData = filteredData.map(item => [
      item.year, item.monthName, item.date, item.day, item.companyName,
      item.empIdCode, item.name, item.designation, item.holiday, item.workingDay,
      item.nHoliday, item.status, item.inTime, item.outTime, item.workingHours,
      item.lateMinutes, item.earlyOut, item.overtimeHours, item.punchMiss, item.remarks
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_data_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3 md:pb-4 mb-4 font-outfit">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Daily Attendance</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Real-time punch and shift logs</p>
        </div>
        <button
          onClick={downloadCSV}
          disabled={filteredData.length === 0}
          className={`inline-flex items-center px-4 py-2 rounded-md text-[11px] font-bold uppercase tracking-widest shadow-sm transition-all ${
            filteredData.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
          }`}
        >
          <Download size={14} className="mr-1.5" />
          Export CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, ID, company..."
            className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-50/50 border border-gray-200 rounded-md px-2 py-1 gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-[10px] font-bold text-gray-600 focus:outline-none uppercase"
            />
            <span className="text-[9px] font-bold text-gray-300 tracking-tighter">TO</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-[10px] font-bold text-gray-600 focus:outline-none uppercase"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <h2 className="text-[10px] font-bold text-gray-800 uppercase tracking-widest">Attendance Daily Log</h2>
          <span className="text-[9px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-100 uppercase">
            {filteredData.length} records found
          </span>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          {tableLoading ? (
            <LoadingSpinner message="Hydrating attendance data..." minHeight="300px" />
          ) : error ? (
             <div className="px-6 py-12 text-center">
              <p className="text-rose-500 text-xs font-bold mb-2 uppercase">Sync Error: {error}</p>
              <button onClick={fetchAttendanceData} className="px-4 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[10px] font-bold uppercase tracking-widest shadow-sm">Restart Sync</button>
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50/50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                      <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Employee</th>
                      <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Punch IN/OUT</th>
                      <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hrs</th>
                      <th className="px-4 py-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {filteredData.length > 0 ? (
                      filteredData.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-4 py-2 whitespace-nowrap">
                            <p className="text-xs font-bold text-gray-800 uppercase leading-none">{item.date}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-tighter">{item.day}</p>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <p className="text-xs font-bold text-gray-800 mb-0.5">{item.name}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase">{item.empIdCode} | {item.designation}</p>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                             <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-medium text-gray-600">{item.inTime || '--:--'}</span>
                              <span className="text-gray-300">→</span>
                              <span className="text-[11px] font-medium text-gray-600">{item.outTime || '--:--'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{item.workingHours}H</span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm bg-${getStatusColor(item.status)}-100 text-${getStatusColor(item.status)}-700`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <p className="text-[10px] text-gray-400 font-medium max-w-[150px] truncate italic">{item.remarks || '-'}</p>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="6" className="px-4 py-12 text-center text-gray-400 text-[10px] font-bold uppercase">No attendance logs match filters.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden divide-y divide-gray-100">
                {filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <div key={index} className="p-3 space-y-2">
                       <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{item.date}</p>
                          <p className="text-xs font-bold text-gray-800 leading-tight">{item.name}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5 tracking-tighter">{item.empIdCode} | {item.designation}</p>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-${getStatusColor(item.status)}-100 text-${getStatusColor(item.status)}-700`}>
                          {item.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 bg-gray-50/50 p-2 rounded border border-gray-100">
                        <div className="space-y-0.5">
                          <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Entry/Exit</p>
                          <p className="text-[10px] font-bold text-gray-700">{item.inTime || '-'} → {item.outTime || '-'}</p>
                        </div>
                        <div className="text-right space-y-0.5 border-l border-gray-200 pl-2">
                          <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Work Duration</p>
                          <p className="text-[10px] font-bold text-indigo-600">{item.workingHours} HRS</p>
                        </div>
                      </div>

                      {item.remarks && <p className="text-[9px] text-gray-400 italic px-1">{item.remarks}</p>}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-400 text-[10px] font-bold uppercase">Target records not found.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendancedaily;