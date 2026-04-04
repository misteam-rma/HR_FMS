import React, { useState, useEffect } from "react";
import { 
  Search, Users, Calendar, Filter, Clock, CheckCircle2, 
  XCircle, AlertCircle, ChevronRight, FileText, ChevronDown, 
  Check, History, Download, MapPin, List, LayoutDashboard
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";

// Professional Dummy Data Generator (Every Date April 2024 for 10 Personnel)
const generateDailyData = () => {
  const employees = [
    { id: "EMP1001", name: "Rahul Sharma", dept: "Engineering", post: "Software Engineer" },
    { id: "EMP1002", name: "Priya Patel", dept: "HR", post: "HR Manager" },
    { id: "EMP1003", name: "Amit Kumar", dept: "Sales", post: "Sales Executive" },
    { id: "EMP1004", name: "Sneha Gupta", dept: "Engineering", post: "Project Lead" },
    { id: "EMP1005", name: "Vikram Singh", dept: "Finance", post: "Accountant" },
    { id: "EMP1006", name: "Anjali Verma", dept: "Marketing", post: "Marketing Head" },
    { id: "EMP1007", name: "Rajesh Iyer", dept: "Operations", post: "Ops Manager" },
    { id: "EMP1008", name: "Sanjay Mehra", dept: "Engineering", post: "DevOps Engineer" },
    { id: "EMP1009", name: "Kajal Dass", dept: "HR", post: "Recruiter" },
    { id: "EMP1010", name: "Mohit Jain", dept: "Sales", post: "Account Manager" },
  ];

  const data = [];
  const daysInApril = 30;
  
  for (let day = daysInApril; day >= 1; day--) {
    const dateStr = `2024-04-${day.toString().padStart(2, '0')}`;
    const dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
    
    employees.forEach(emp => {
      const isAbsent = Math.random() > 0.9 && dayName !== 'Sun';
      const isSunday = dayName === 'Sun';
      
      data.push({
        id: `${emp.id}-${day}`,
        empId: emp.id,
        name: emp.name,
        department: emp.dept,
        designation: emp.post,
        date: dateStr,
        day: dayName,
        inTime: isSunday ? "OFF" : (isAbsent ? "ABSENT" : "09:15 AM"),
        outTime: isSunday ? "OFF" : (isAbsent ? "ABSENT" : "06:30 PM"),
        workingHours: isSunday || isAbsent ? "0" : "9.2",
        lateMins: isSunday || isAbsent ? "0" : (Math.random() > 0.7 ? "15" : "0"),
        status: isSunday ? "Holiday" : (isAbsent ? "Absent" : "Present"),
        location: "Okhla Phase III",
        device: "Biometric-01"
      });
    });
  }
  return data;
};

const DUMMY_ATTENDANCE = generateDailyData();

const AttendanceDaily = () => {
  const [activeTab, setActiveTab] = useState("pending"); 
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [tableLoading, setTableLoading] = useState(false);

  useEffect(() => {
    setTableLoading(true);
    const timer = setTimeout(() => setTableLoading(false), 600);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const filteredData = DUMMY_ATTENDANCE.filter(item => {
    if (activeTab === "history" && item.status !== "Absent" && item.lateMins === "0") return false;
    const matchesSearch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.empId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !filterDepartment || item.department === filterDepartment;
    const matchesDate = !filterDate || item.date === filterDate;
    return matchesSearch && matchesDept && matchesDate;
  });

  const departments = [...new Set(DUMMY_ATTENDANCE.map(d => d.department))].sort();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPaginationNav = () => (
    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px w-full justify-center sm:w-auto">
      <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-1.5 py-1.5 rounded-l-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50">
        <ChevronRight className="h-4 w-4 rotate-180" />
      </button>
      {[...Array(Math.max(1, Math.min(5, totalPages)))].map((_, i) => (
        <button key={i} onClick={() => paginate(i+1)} className={`relative inline-flex items-center px-3 py-1.5 border text-[11px] font-bold ${currentPage === (i+1) ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600 shadow-sm" : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"}`}>
          {i + 1}
        </button>
      ))}
      <button onClick={() => paginate(currentPage + 1)} disabled={currentPage >= totalPages} className="relative inline-flex items-center px-1.5 py-1.5 rounded-r-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50">
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );

  return (
    <div className="max-w-full mx-auto px-1 sm:px-2 lg:px-4 py-4 space-y-4 md:space-y-6 pb-20 md:pb-8 font-outfit">
      
      {/* 🧩 Header Section - Call Tracker Parity */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tab Switcher - Call Tracker SPEC */}
        <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
           <button 
             onClick={() => { setActiveTab("pending"); setCurrentPage(1); }} 
             className={`flex items-center gap-2 py-1 px-4 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all duration-200 ${activeTab === 'pending' ? 'bg-white text-indigo-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
           >
             <Clock size={13} />
             <span>Pending ({filteredData.length})</span>
           </button>
           <button 
             onClick={() => { setActiveTab("history"); setCurrentPage(1); }} 
             className={`flex items-center gap-2 py-1 px-4 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all duration-200 ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
           >
             <History size={13} />
             <span>History</span>
           </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
            <input 
               type="text" 
               placeholder="Search calls..." 
               value={searchTerm} 
               onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
               className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full text-[13px] shadow-sm bg-white"
            />
          </div>

          <div className="grid grid-cols-2 lg:flex lg:items-center gap-2">
             {/* Department Filter */}
             <div className="relative">
               <div onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)} className="flex items-center gap-2 h-8 px-3 border border-gray-200 rounded bg-white text-[11px] text-gray-700 font-medium cursor-pointer hover:border-indigo-400 transition shadow-sm">
                 <Filter size={11} className="text-gray-400" />
                 <span className="truncate">{filterDepartment || "All Dept"}</span>
                 <ChevronDown size={12} className={`ml-1 text-gray-400 transition-transform ${isDeptDropdownOpen ? 'rotate-180' : ''}`} />
               </div>
               {isDeptDropdownOpen && (
                 <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden py-1">
                    <div onClick={() => { setFilterDepartment(""); setIsDeptDropdownOpen(false); setCurrentPage(1); }} className="px-3 py-1.5 text-[11px] font-normal cursor-pointer hover:bg-gray-50">All Departments</div>
                    {departments.map(d => (
                       <div key={d} onClick={() => { setFilterDepartment(d); setIsDeptDropdownOpen(false); setCurrentPage(1); }} className="px-3 py-1.5 text-[11px] font-normal cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                         {d}
                         {filterDepartment === d && <Check size={11} className="text-indigo-500" />}
                       </div>
                    ))}
                 </div>
               )}
             </div>

             {/* Date Picker */}
             <div className="flex items-center gap-1 h-8 px-2 border border-gray-200 rounded bg-white text-[11px] text-gray-600 shadow-sm relative">
               <Calendar size={11} className="text-gray-400" />
               <input type="date" value={filterDate} onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }} className="bg-transparent focus:outline-none text-[10px] w-24 cursor-pointer" />
             </div>
          </div>
        </div>
      </div>

      {/* 📊 Main Table Content Area - Call Tracker Absolute Mirroring */}
      <div className="overflow-hidden border border-gray-200 rounded-lg bg-white min-h-[530px] flex flex-col">
        {tableLoading ? (
           <div className="flex-1 flex items-center justify-center p-12">
             <LoadingSpinner message="Retrieving logs..." minHeight="450px" />
           </div>
        ) : (
          <>
            <div className="max-h-[calc(105vh-280px)] min-h-[530px] overflow-y-auto scrollbar-hide">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Employee Name</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Employee ID</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Day</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">In-Time</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Out-Time</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Net Depth</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Latency</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-24 text-center">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">No matching records found.</p>
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 font-normal uppercase">
                           {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 font-normal uppercase tracking-tight">#{item.empId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-xs text-gray-500 font-normal tracking-tight">{item.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-[10px] text-gray-400 uppercase font-normal">{item.day}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 font-normal">{item.inTime}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 font-normal">{item.outTime}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-indigo-600 font-normal">{item.workingHours}h</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-rose-500 font-normal">+{item.lateMins}m</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                           <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${item.status === 'Present' ? 'bg-green-100 text-green-700' : (item.status === 'Holiday' ? 'bg-indigo-100 text-indigo-700' : 'bg-red-100 text-red-700')}`}>
                             {item.status}
                           </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 📑 Footer Pagination - Call Tracker Mirror */}
            <div className="px-4 py-3 bg-white border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6 flex-wrap">
                <p className="text-[13px] text-gray-600 font-medium tracking-wide">
                  Showing <span className="font-bold text-gray-900">{filteredData.length > 0 ? indexOfFirstItem + 1 : 0}</span> to <span className="font-bold text-gray-900">{Math.min(indexOfLastItem, filteredData.length)}</span> of <span className="font-bold text-gray-900">{filteredData.length}</span> records
                </p>
                <div className="flex items-center gap-2 h-5">
                  <label className="text-[13px] text-gray-500 font-medium whitespace-nowrap">Rows per page:</label>
                  <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="text-xs bg-transparent font-medium text-gray-700 outline-none cursor-pointer">
                    {[15, 30, 50, 100].map(val => <option key={val} value={val}>{val}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center w-auto justify-end">
                {renderPaginationNav()}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceDaily;