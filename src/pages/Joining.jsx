import React, { useState, useEffect } from 'react';
import { Search, Users, Clock, CheckCircle, Eye, X, Download, Upload, Share, FileText, User, Mail, Calendar, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const DUMMY_PENDING = [
  { id: '1', indentNo: 'IND-2024-001', candidateEnquiryNo: 'ENQ-8821', applyingForPost: 'Operations Head', department: 'Operations', candidateName: 'Amit Mehra', candidatePhone: '9898989898', candidateEmail: 'amit.m@example.com' },
  { id: '2', indentNo: 'IND-2024-004', candidateEnquiryNo: 'ENQ-9012', applyingForPost: 'Quality Analyst', department: 'Quality', candidateName: 'Sanjana Rao', candidatePhone: '9797979797', candidateEmail: 'sanjana.r@example.com' },
];

const Joining = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [showJoiningModal, setShowJoiningModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [joiningData, setJoiningData] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const [shareFormData, setShareFormData] = useState({
    recipientName: '',
    recipientEmail: '',
    subject: 'Candidate Joining Details',
    message: '',
  });

  const [joiningFormData, setJoiningFormData] = useState({
    fatherName: '',
    dateOfJoining: '',
    gender: '',
    familyMobileNo: '',
    relationshipWithFamily: '',
    highestQualification: '',
    currentBankAc: '',
    ifscCode: '',
    branchName: '',
    panCardNumber: '',
    equipment: '',
    aadharFrontPhoto: null,
    bankPassbookPhoto: null,
    salarySlip: null,
  });

  const fetchJoiningData = async () => {
    setTableLoading(true);
    try {
      const [enquiryResponse, followUpResponse] = await Promise.all([
        fetch("https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec?sheet=ENQUIRY&action=fetch"),
        fetch("https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec?sheet=Follow - Up&action=fetch"),
      ]);
      const [enquiryResult, followUpResult] = await Promise.all([enquiryResponse.json(), followUpResponse.json()]);
      
      if (enquiryResult.success && followUpResult.success) {
        const enquiryHeaders = enquiryResult.data[5];
        const dataRows = enquiryResult.data.slice(6);
        const followUpRows = followUpResult.data.slice(1);

        const processed = dataRows.map(row => ({
          id: row[0],
          indentNo: row[1],
          candidateEnquiryNo: row[2],
          applyingForPost: row[5],
          department: row[20],
          candidateName: row[4],
          candidatePhone: row[10],
          candidateEmail: row[11],
          candidatePhoto: row[16],
          candidateResume: row[19],
          presentAddress: row[21],
          aadharNo: row[22],
          actualDate: row[26],
          joiningDate: row[27],
          candidateDOB: row[9]
        }))
        .filter(item => item.actualDate && item.actualDate.trim() !== "")
        .filter(item => !item.joiningDate || item.joiningDate.trim() === "");

        const joiningItems = processed.filter(item => 
          followUpRows.some(f => f[1] === item.candidateEnquiryNo && f[2] === 'Joining')
        );
        setJoiningData(joiningItems);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => { fetchJoiningData(); }, []);

  const displayData = (joiningData.length > 0 ? joiningData : DUMMY_PENDING).filter(item => 
    item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.applyingForPost?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleJoiningClick = (item) => {
    setSelectedItem(item);
    setJoiningFormData({
      fatherName: '',
      dateOfJoining: '',
      gender: '',
      familyMobileNo: '',
      relationshipWithFamily: '',
      highestQualification: '',
      currentBankAc: '',
      ifscCode: '',
      branchName: '',
      panCardNumber: '',
      equipment: '',
      aadharFrontPhoto: null,
      bankPassbookPhoto: null,
      salarySlip: null,
    });
    setShowJoiningModal(true);
  };

  const handleShareClick = (item) => {
    setSelectedItem(item);
    setShareFormData({
      recipientName: item.candidateName || '',
      recipientEmail: item.candidateEmail || '',
      subject: `Onboarding: ${item.candidateName}`,
      message: `Dear ${item.candidateName},\n\nWelcome to the team! Please complete your onboarding details using the link below.`
    });
    setShowShareModal(true);
  };

  return (
    <div className="space-y-3 md:pb-4 mb-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Onboarding & Joining</h1>
          <p className="text-gray-500 text-xs">Convert finalized candidates into active employees.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Search candidates..." 
              className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={fetchJoiningData} className="p-2 border border-gray-300 rounded-md bg-white text-gray-600 hover:bg-gray-50 shadow-sm transition-all">
            <Clock size={16} className={tableLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-indigo-600" />
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Awaiting Onboarding</h2>
          </div>
          <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight">
            {displayData.length} Candidates
          </span>
        </div>

        <div className="p-0">
           {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Candidate Details</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Post & Dept</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Reference</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableLoading ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-1">
                      <LoadingSpinner message="Syncing joining queue..." minHeight="300px" />
                    </td>
                  </tr>
                ) : displayData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.candidateName}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{item.candidatePhone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-gray-700">{item.applyingForPost}</p>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight flex items-center gap-1">
                          <MapPin size={10} /> {item.department}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <p className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded inline-block uppercase">{item.candidateEnquiryNo}</p>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1.5">
                         <button 
                          onClick={() => handleJoiningClick(item)} 
                          className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 text-[10px] font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        >
                          Process Joining
                        </button>
                         <button 
                           onClick={() => handleShareClick(item)} 
                          className="p-1 px-2 border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-indigo-600 rounded-md transition-all"
                          title="Share"
                        >
                          <Share size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-gray-100">
             {tableLoading ? (
                <LoadingSpinner message="Syncing joining data..." minHeight="200px" />
              ) : displayData.map((item, idx) => (
                <div key={idx} className="p-3 space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-indigo-600 tracking-tight">#{item.candidateEnquiryNo}</span>
                     <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">{item.department}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-bold text-gray-900 leading-tight">{item.candidateName}</div>
                      <div className="text-[11px] text-indigo-600 font-medium">{item.applyingForPost}</div>
                    </div>
                     <button 
                         onClick={() => handleShareClick(item)} 
                        className="p-1.5 border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-indigo-600 rounded-md transition-all"
                      >
                        <Share size={14} />
                      </button>
                  </div>
                   <div className="grid grid-cols-1 pt-1 text-[11px]">
                     <div className="flex justify-between py-1 text-gray-600">
                      <span className="text-gray-400">Phone</span>
                      <span className="font-semibold">{item.candidatePhone || "-"}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleJoiningClick(item)} 
                    className="w-full py-2 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm mt-1"
                  >
                    Process Joining
                  </button>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Modern Joining Modal */}
      {showJoiningModal && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <FileText className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Joining Registration</h3>
                  <p className="text-xs text-slate-500 font-medium">Finalizing profile for {selectedItem.candidateName}</p>
                </div>
              </div>
              <button onClick={() => setShowJoiningModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            
            <form className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
              {/* Personal Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest pl-1 border-l-4 border-blue-600">Personal Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                   <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Father / Husband Name</label>
                    <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Date of Birth</label>
                    <input type="text" disabled value={selectedItem.candidateDOB || '-'} className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Gender</label>
                    <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none">
                      <option>Select</option>
                      <option>Male</option>
                      <option>Female</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Company Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest pl-1 border-l-4 border-blue-600">Deployment Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                   <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Joining Date</label>
                    <input type="date" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Designation</label>
                    <input type="text" disabled value={selectedItem.applyingForPost} className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Department</label>
                    <input type="text" disabled value={selectedItem.department} className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500" />
                  </div>
                </div>
              </div>

              {/* Financials */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest pl-1 border-l-4 border-blue-600">Financial Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                   <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Bank Account No.</label>
                    <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">IFSC Code</label>
                    <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5 relative">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Aadhar Card No.</label>
                    <input type="text" disabled value={selectedItem.aadharNo} className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500" />
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest pl-1 border-l-4 border-blue-600">Verified Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                        <Upload size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Aadhar card Photo</p>
                        <p className="text-[10px] text-slate-400">Scan front & back</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                        <Upload size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Passbook / Cheque</p>
                        <p className="text-[10px] text-slate-400">Account verification proof</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowJoiningModal(false)}
                className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button 
                className="px-8 py-2.5 bg-blue-600 rounded-xl text-sm font-bold text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
              >
                Register Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
       {showShareModal && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in duration-300">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <Mail className="text-white" size={18} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Share Onboarding</h3>
              </div>
              <button onClick={() => setShowShareModal(false)} className="p-1 hover:bg-slate-100 rounded-full">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recipient Name</label>
                <input 
                  type="text" 
                  value={shareFormData.recipientName} 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  readOnly
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                <input 
                  type="email" 
                  value={shareFormData.recipientEmail} 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personal Message</label>
                <textarea 
                  rows={4} 
                  value={shareFormData.message}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-b-3xl flex justify-end gap-3">
               <button 
                onClick={() => setShowShareModal(false)}
                className="px-5 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                Discard
              </button>
              <button 
                className="px-6 py-2 bg-emerald-500 rounded-xl text-xs font-bold text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
       )}
    </div>
  );
};

export default Joining;