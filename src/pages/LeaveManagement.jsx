import React, { useState, useEffect } from 'react';
import { 
  Search, X, Plus, Calendar, User, Briefcase, CheckCircle2, 
  XCircle, Clock, Filter, ChevronRight, FileText, Download, 
  ChevronLeft, History, Check, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const LeaveManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [rejectedLeaves, setRejectedLeaves] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const fetchLeaveData = async () => {
    setTableLoading(true);
    try {
      const response = await fetch("https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec?sheet=Leave Management&action=fetch");
      const result = await response.json();
      if (result.success) {
        const dataRows = result.data.slice(1);
        const processed = dataRows.map((row, idx) => ({
          timestamp: row[0],
          serialNo: row[1],
          employeeId: row[2],
          employeeName: row[3],
          startDate: row[4],
          endDate: row[5],
          reason: row[6],
          status: row[7],
          leaveType: row[8],
          hodName: row[9],
          department: row[10],
          substitute: row[11],
          leaveDays: row[12],
          rowIndex: idx + 2
        }));
        setPendingLeaves(processed.filter(l => l.status?.toLowerCase() === 'pending'));
        setApprovedLeaves(processed.filter(l => l.status?.toLowerCase() === 'approved'));
        setRejectedLeaves(processed.filter(l => l.status?.toLowerCase() === 'rejected'));
      }
    } catch (err) { console.error(err); }
    finally { setTableLoading(false); }
  };

  useEffect(() => { fetchLeaveData(); }, []);

  const getDisplayLeaves = () => {
    let leaves = [];
    if (activeTab === 'pending') leaves = pendingLeaves;
    else if (activeTab === 'approved') leaves = approvedLeaves;
    else leaves = rejectedLeaves;

    return leaves.filter(l => 
        (l.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) || l.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const activeData = getDisplayLeaves();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = activeData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(activeData.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAction = async (action) => {
    toast.loading(`Processing ${action}...`);
    setTimeout(() => {
        toast.dismiss();
        toast.success(`Leave ${action}ed successfully!`);
        fetchLeaveData();
    }, 1500);
  };

  const renderPaginationNav = () => (
    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px w-full justify-center sm:w-auto" aria-label="Pagination">
      <button
        onClick={() => paginate(currentPage - 1)}
        disabled={currentPage === 1}
        className="relative inline-flex items-center px-1.5 py-1 sm:px-2 sm:py-1 rounded-l-md border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={16} />
      </button>

      {[...Array(Math.max(1, totalPages))].map((_, i) => {
        const pageNum = i + 1;
        if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
          return (
            <button
              key={pageNum}
              onClick={() => paginate(pageNum)}
              className={`relative inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1 border text-[11px] font-bold ${currentPage === pageNum ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600 shadow-sm' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
            >
              {pageNum}
            </button>
          );
        } else if ((pageNum === currentPage - 2 && pageNum > 1) || (pageNum === currentPage + 2 && pageNum < totalPages)) {
          return <span key={pageNum} className="relative inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-700">...</span>;
        }
        return null;
      })}

      <button
        onClick={() => paginate(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="relative inline-flex items-center px-1.5 py-1 sm:px-2 sm:py-1 rounded-r-md border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );

  return (
    <div className="max-w-full mx-auto px-1 sm:px-2 lg:px-4 py-4 space-y-4 md:space-y-6 pb-20 md:pb-8 font-outfit">
      
      {/* 🧩 Header Section - Call Tracker Absolute Parity */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 md:gap-4 mb-2">
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 shadow-sm self-start sm:self-center">
            <button
              onClick={() => { setActiveTab("pending"); setCurrentPage(1); }}
              className={`flex items-center gap-2 py-1 px-4 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all duration-200 ${activeTab === "pending" ? "bg-white text-indigo-600 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
            >
              <Clock size={13} />
              <span>Pending ({pendingLeaves.length})</span>
            </button>
            <button
              onClick={() => { setActiveTab("approved"); setCurrentPage(1); }}
              className={`flex items-center gap-2 py-1 px-4 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all duration-200 ${activeTab === "approved" ? "bg-white text-indigo-600 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
            >
              <Check size={13} />
              <span>Approved</span>
            </button>
            <button
              onClick={() => { setActiveTab("rejected"); setCurrentPage(1); }}
              className={`flex items-center gap-2 py-1 px-4 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all duration-200 ${activeTab === "rejected" ? "bg-white text-indigo-600 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
            >
              <XCircle size={13} />
              <span>Rejected</span>
            </button>
          </div>
        </div>

        {/* Unified Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
            <input 
               type="text" 
               placeholder="Search requests..." 
               value={searchTerm} 
               onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
               className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full text-[13px] shadow-sm bg-white"
            />
          </div>

          <button 
             onClick={() => setShowModal(true)}
             className="h-8 px-4 bg-indigo-600 text-white rounded text-[11px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm active:scale-95"
          >
             <Plus size={14} />
             New Request
          </button>
        </div>
      </div>

      {/* 📊 Main Table Content Area - Call Tracker Absolute RECONSTRUCTION */}
      <div className="overflow-hidden border border-gray-200 rounded-lg bg-white min-h-[530px] flex flex-col">
        {tableLoading ? (
           <div className="flex-1 flex items-center justify-center p-12">
             <LoadingSpinner message="Retrieving leave database..." minHeight="450px" />
           </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block max-h-[calc(105vh-280px)] min-h-[530px] overflow-y-auto scrollbar-hide">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Employee Name</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Employee ID</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Leave Category</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Reason</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Start Date</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">End Date</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Net Days</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Manager</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-4 py-24 text-center">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">No matching records found.</p>
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 font-normal uppercase">{item.employeeName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 font-normal uppercase tracking-tight">#{item.employeeId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                           <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${item.leaveType?.includes('Casual') ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                               {item.leaveType}
                           </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 font-normal italic truncate max-w-[150px]" title={item.reason}>"{item.reason}"</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 font-normal">{item.startDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 font-normal">{item.endDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-indigo-600 font-normal">{item.leaveDays} Days</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 font-normal uppercase">{item.hodName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right pr-6">
                           <div className="flex items-center justify-end gap-2">
                              {activeTab === 'pending' ? (
                                 <>
                                   <button onClick={() => handleAction('approve')} className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[10px] font-bold uppercase hover:bg-emerald-600 hover:text-white transition shadow-sm active:scale-95">Approve</button>
                                   <button onClick={() => handleAction('reject')} className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[10px] font-bold uppercase hover:bg-rose-600 hover:text-white transition shadow-sm active:scale-95">Reject</button>
                                 </>
                              ) : (
                                 <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${item.status?.toLowerCase() === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                   {item.status}
                                 </span>
                              )}
                           </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View - Absolute Call Tracker Parity */}
            <div className="md:hidden flex flex-col h-[calc(100vh-240px)]">
              <div className="flex-1 p-2 space-y-3 overflow-y-auto scrollbar-hide">
                {currentItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24">
                     <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">No entries found.</p>
                  </div>
                ) : (
                  currentItems.map((item, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 space-y-1.5">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                         <div className="flex items-center gap-2">
                            <span className="font-bold text-indigo-600 text-sm">#{item.employeeId}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest ${item.leaveType?.includes('Casual') ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{item.leaveType}</span>
                         </div>
                         {activeTab === 'pending' ? (
                            <div className="flex gap-1.5">
                               <button onClick={() => handleAction('approve')} className="p-1 px-2.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold uppercase shadow-sm">OK</button>
                               <button onClick={() => handleAction('reject')} className="p-1 px-2.5 bg-rose-50 text-rose-600 rounded text-[10px] font-bold uppercase shadow-sm">No</button>
                            </div>
                         ) : (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.status?.toLowerCase() === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.status}</span>
                         )}
                      </div>
                      <div>
                         <div className="text-sm font-bold text-gray-800 tracking-tight uppercase leading-none mb-1">{item.employeeName}</div>
                         <p className="text-[11px] text-gray-400 italic line-clamp-1">"{item.reason}"</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-50">
                         <div>
                            <span className="block text-gray-400 text-[10px] uppercase">Duration</span>
                            <span className="font-medium text-gray-700">{item.startDate} - {item.endDate}</span>
                         </div>
                         <div className="text-right">
                            <span className="block text-gray-400 text-[10px] uppercase">Manager</span>
                            <span className="font-medium text-gray-700 uppercase">{item.hodName}</span>
                         </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-gray-300 bg-white px-2 py-2 flex justify-center sticky bottom-0 z-20">
                 {renderPaginationNav()}
              </div>
            </div>

            {/* 📑 Desktop Footer Pagination - Call Tracker Mirror */}
            <div className="hidden md:flex px-4 py-3 bg-white border-t border-gray-200 flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6 flex-wrap">
                <p className="text-[13px] text-gray-600 font-medium tracking-wide">
                  Showing <span className="font-bold text-gray-900">{activeData.length > 0 ? indexOfFirstItem + 1 : 0}</span> to <span className="font-bold text-gray-900">{Math.min(indexOfLastItem, activeData.length)}</span> of <span className="font-bold text-gray-900">{activeData.length}</span> records
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

      {/* Modern Request Modal - Absolute Refinement */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl animate-in zoom-in duration-300 overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                            <FileText size={16} />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 tracking-tight uppercase">New Request Entry</h3>
                    </div>
                    <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
                        <X size={18} />
                    </button>
                </div>

                <form className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Employee Reference</label>
                            <input type="text" placeholder="Full name or ID" className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-[13px] font-medium focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-300 shadow-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Leave Type</label>
                            <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-[13px] font-medium outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer shadow-sm">
                                <option>Casual Leave</option>
                                <option>Earned Leave</option>
                                <option>Sick Leave</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Start Point</label>
                            <input type="date" className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-[13px] font-medium outline-none focus:ring-1 focus:ring-indigo-500 transition shadow-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">End Point</label>
                            <input type="date" className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-[13px] font-medium outline-none focus:ring-1 focus:ring-indigo-500 transition shadow-sm" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Statement of Reason</label>
                        <textarea rows={3} placeholder="Provide specific absence details..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-[13px] font-medium focus:ring-1 focus:ring-indigo-500 outline-none resize-none transition-all placeholder:text-gray-300 shadow-sm" />
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-50">
                        <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 text-[11px] font-bold text-gray-500 hover:bg-gray-100 rounded transition-all uppercase tracking-widest focus:outline-none">Cancel</button>
                        <button className="px-8 py-2 bg-slate-900 text-white text-[11px] font-bold rounded hover:bg-slate-800 shadow-md shadow-slate-100 transition-all uppercase tracking-widest active:scale-95">Register Request</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;