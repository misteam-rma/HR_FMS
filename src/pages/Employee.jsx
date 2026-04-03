import React, { useEffect, useState } from "react";
import { Filter, Search, Clock, CheckCircle, ImageIcon, User, Briefcase, MapPin, Phone } from "lucide-react";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";

const DUMMY_JOINING = [
  { employeeId: "EMP001", candidateName: "Arjun Sharma", fatherName: "Rajesh Sharma", dateOfJoining: "2024-03-01", designation: "Software Engineer", unit: "Unit 1", department: "Engineering", mobileNo: "9876543210", emailId: "arjun@example.com" },
  { employeeId: "EMP002", candidateName: "Priya Patel", fatherName: "Suresh Patel", dateOfJoining: "2024-03-15", designation: "HR Manager", unit: "HQ", department: "Human Resources", mobileNo: "9876543211", emailId: "priya@example.com" },
  { employeeId: "EMP003", candidateName: "Vikram Singh", fatherName: "Mahendra Singh", dateOfJoining: "2024-04-01", designation: "Sales Exec", unit: "Unit 2", department: "Sales", mobileNo: "9876543212", emailId: "vikram@example.com" },
];

const DUMMY_LEAVING = [
  { employeeId: "EMP098", name: "Rahul Verma", dateOfJoining: "2022-01-10", dateOfLeaving: "2024-02-28", mobileNo: "9988776655", fatherName: "Vijay Verma", designation: "Accounts Manager", salary: "Finance", reasonOfLeaving: "Better Opportunity" },
];

const Employee = () => {
  const [activeTab, setActiveTab] = useState("joining");
  const [searchTerm, setSearchTerm] = useState("");
  const [joiningData, setJoiningData] = useState([]);
  const [leavingData, setLeavingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatDOB = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('en-GB');
  };

  const fetchJoiningData = async () => {
    setTableLoading(true);
    try {
      const response = await fetch("https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec?sheet=JOINING&action=fetch");
      const result = await response.json();
      if (result.success) {
        const rawData = result.data || result;
        const dataRows = rawData.length > 6 ? rawData.slice(6) : [];
        const processed = dataRows.map((row) => ({
          employeeId: row[1] || "",
          candidateName: row[2] || "",
          fatherName: row[3] || "",
          dateOfJoining: row[4] || "",
          designation: row[5] || "",
          aadharPhoto: row[6] || "",
          candidatePhoto: row[7] || "",
          address: row[8] || "",
          dateOfBirth: row[9] || "",
          gender: row[10] || "",
          mobileNo: row[11] || "",
          familyNo: row[12] || "",
          relationshipWithFamily: row[13] || "",
          accountNo: row[14] || "",
          ifsc: row[15] || "",
          branch: row[16] || "",
          passbook: row[17] || "",
          emailId: row[18] || "",
          department: row[20] || "",
          unit: row[39] || "",
          columnAA: row[26] || "",
          columnY: row[24] || "",
        }));
        const active = processed.filter(emp => emp.columnAA && !emp.columnY);
        setJoiningData(active);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTableLoading(false);
    }
  };

  const fetchLeavingData = async () => {
    try {
      const response = await fetch("https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec?sheet=LEAVING&action=fetch");
      const result = await response.json();
      if (result.success) {
        const rawData = result.data || result;
        const dataRows = rawData.length > 6 ? rawData.slice(6) : [];
        const processed = dataRows.map((row) => ({
          employeeId: row[1] || "",
          name: row[2] || "",
          dateOfJoining: row[8] || "",
          dateOfLeaving: row[3] || "",
          mobileNo: row[4] || "",
          fatherName: row[7] || "",
          designation: row[10] || "",
          salary: row[11] || "",
          reasonOfLeaving: row[5] || "",
          plannedDate: row[12] || "",
        }));
        const leaving = processed.filter(emp => emp.plannedDate);
        setLeavingData(leaving);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchJoiningData();
    fetchLeavingData();
  }, []);

  const displayJoining = (joiningData.length > 0 ? joiningData : DUMMY_JOINING).filter(item => 
    item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayLeaving = (leavingData.length > 0 ? leavingData : DUMMY_LEAVING).filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-3 md:pb-4 mb-4">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Workforce Directory</h1>
          <p className="text-gray-500 text-xs">Manage and view all employee records across departments.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search records..."
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2 border border-gray-300 rounded-md bg-white text-gray-600 hover:bg-gray-50 shadow-sm">
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* Tabs Container */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 p-1 bg-gray-50/30">
          <button
            onClick={() => setActiveTab("joining")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
              activeTab === "joining" 
              ? "bg-white text-indigo-700 shadow-sm" 
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
          >
            <CheckCircle size={14} />
            Active ({displayJoining.length})
          </button>
          <button
            onClick={() => setActiveTab("leaving")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
              activeTab === "leaving" 
              ? "bg-white text-rose-600 shadow-sm" 
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Clock size={14} />
            Left ({displayLeaving.length})
          </button>
        </div>

        {/* Responsive Content */}
        <div className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Candidate / ID</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Designation & Dept</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status & Joined</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Docs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableLoading ? (
                  <tr>
                    <td colSpan="5" className="px-6 border-b-none py-1">
                      <LoadingSpinner message="Syncing workforce data..." minHeight="300px" />
                    </td>
                  </tr>
                ) : activeTab === "joining" ? (
                  displayJoining.map((emp, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                            <User size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{emp.candidateName}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{emp.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-gray-700">{emp.designation}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{emp.department} • {emp.unit}</p>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-tighter">Joined</span>
                          <p className="text-[10px] font-bold text-gray-500">{formatDOB(emp.dateOfJoining)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-gray-700">{emp.mobileNo}</p>
                          <p className="text-[10px] text-gray-400 truncate max-w-[120px] font-medium">{emp.emailId}</p>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-1.5">
                          {emp.aadharPhoto && (
                            <a href={emp.aadharPhoto} target="_blank" rel="noopener noreferrer" className="p-1 px-2 text-indigo-600 bg-indigo-50 rounded border border-indigo-100 text-[10px] font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                              ID
                            </a>
                          )}
                          {emp.candidatePhoto && (
                            <a href={emp.candidatePhoto} target="_blank" rel="noopener noreferrer" className="p-1 px-2 text-indigo-600 bg-indigo-50 rounded border border-indigo-100 text-[10px] font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                              PIC
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  displayLeaving.map((emp, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                            <User size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900">{emp.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{emp.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-gray-700">{emp.designation}</p>
                          <p className="text-[10px] text-gray-400 font-medium italic truncate max-w-[150px]">"{emp.reasonOfLeaving}"</p>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 uppercase tracking-tighter">Left</span>
                          <p className="text-[10px] font-bold text-gray-500">{formatDOB(emp.dateOfLeaving)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <p className="text-xs font-bold text-gray-700">{emp.mobileNo}</p>
                      </td>
                      <td className="px-4 py-2 text-right">
                         <span className="text-[10px] text-gray-400 font-medium">Joined: {formatDOB(emp.dateOfJoining)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
            {tableLoading ? (
              <LoadingSpinner message="Syncing records..." minHeight="200px" />
            ) : activeTab === "joining" ? (
              displayJoining.map((emp, idx) => (
                <div key={idx} className="p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{emp.candidateName}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{emp.employeeId}</p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                      {emp.aadharPhoto && <a href={emp.aadharPhoto} target="_blank" rel="noopener noreferrer" className="p-1 px-2 text-indigo-600 bg-indigo-50 rounded border border-indigo-100 text-[10px] font-bold">ID</a>}
                      {emp.candidatePhoto && <a href={emp.candidatePhoto} target="_blank" rel="noopener noreferrer" className="p-1 px-2 text-indigo-600 bg-indigo-50 rounded border border-indigo-100 text-[10px] font-bold">PIC</a>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 divide-y divide-gray-50 pt-1 text-[11px]">
                    <div className="flex justify-between py-1">
                      <span className="text-gray-400">Designation</span>
                      <span className="font-semibold text-gray-700">{emp.designation}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-400">Dept</span>
                      <span className="font-semibold text-gray-700">{emp.department}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-400">Joined</span>
                      <span className="font-semibold text-emerald-600">{formatDOB(emp.dateOfJoining)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-400">Contact</span>
                      <span className="font-semibold text-gray-700">{emp.mobileNo}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              displayLeaving.map((emp, idx) => (
                <div key={idx} className="p-3 space-y-2">
                   <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{emp.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{emp.employeeId}</p>
                        </div>
                    </div>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 uppercase tracking-tighter">Left</span>
                  </div>
                   <div className="grid grid-cols-1 divide-y divide-gray-50 pt-1 text-[11px]">
                    <div className="flex justify-between py-1">
                      <span className="text-gray-400">Designation</span>
                      <span className="font-semibold text-gray-700">{emp.designation}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-400">Reason</span>
                      <span className="font-semibold text-rose-500 italic max-w-[200px] truncate">"{emp.reasonOfLeaving}"</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-400">Date</span>
                      <span className="font-semibold text-gray-700">{formatDOB(emp.dateOfLeaving)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {!tableLoading && (activeTab === "joining" ? displayJoining : displayLeaving).length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 bg-gray-50/10">
              <p className="text-gray-400 font-medium text-sm">No records found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Employee;
