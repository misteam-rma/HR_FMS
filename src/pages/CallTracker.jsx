import React, { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle, X, Upload, History, ChevronDown, Check, Calendar, Filter, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const CallTracker = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [followUpData, setFollowUpData] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    candidateSays: '',
    status: '',
    nextDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [enquiryData, setEnquiryData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [error, setError] = useState(null);

  // New filtering and pagination states (Synced with FindEnquiry.jsx)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const fetchEnquiryData = async () => {
    setLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      const [enquiryResponse, followUpResponse] = await Promise.all([
        fetch(
          "https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec?sheet=ENQUIRY&action=fetch"
        ),
        fetch(
          "https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec?sheet=Follow - Up&action=fetch"
        ),
      ]);

      if (!enquiryResponse.ok || !followUpResponse.ok) {
        throw new Error(
          `HTTP error! status: ${enquiryResponse.status} or ${followUpResponse.status}`
        );
      }

      const [enquiryResult, followUpResult] = await Promise.all([
        enquiryResponse.json(),
        followUpResponse.json(),
      ]);

      if (
        !enquiryResult.success ||
        !enquiryResult.data ||
        enquiryResult.data.length < 7
      ) {
        throw new Error(
          enquiryResult.error || "Not enough rows in enquiry sheet data"
        );
      }

      // Process enquiry data
      const enquiryHeaders = enquiryResult.data[5].map((h) => h.trim());
      const enquiryDataFromRow7 = enquiryResult.data.slice(6);

      const getIndex = (headerName) =>
        enquiryHeaders.findIndex((h) => h === headerName);

      const processedEnquiryData = enquiryDataFromRow7
        .filter((row) => {
          const plannedIndex = getIndex("Planned");
          const actualIndex = getIndex("Actual");
          const planned = row[plannedIndex];
          const actual = row[actualIndex];
          return planned && (!actual || actual === "");
        })
        .map((row) => ({
          id: row[getIndex("Timestamp")],
          indentNo: row[getIndex("Indent Number")],
          candidateEnquiryNo: row[getIndex("Candidate Enquiry Number")],
          applyingForPost: row[getIndex("Applying For the Post")],
          department: row[getIndex("Department")],
          candidateName: row[getIndex("Candidate Name")],
          candidateDOB: row[getIndex("DOB")], // Fetch DOB from Column F (index 5)
          candidatePhone: row[getIndex("Candidate Phone Number")],
          candidateEmail: row[getIndex("Candidate Email")],
          previousCompany: row[getIndex("Previous Company Name")],
          jobExperience: row[getIndex("Job Experience")] || "",
          lastSalary: row[getIndex("Last Salary Drawn")] || "",
          previousPosition: row[getIndex("Previous Position")] || "",
          reasonForLeaving:
            row[getIndex("Reason Of Leaving Previous Company")] || "",
          maritalStatus: row[getIndex("Marital Status")] || "",
          lastEmployerMobile: row[getIndex("Last Employer Mobile Number")] || "",
          candidatePhoto: row[getIndex("Candidate Photo")] || "",
          candidateResume: row[19] || "",
          referenceBy: row[getIndex("Reference By")] || "",
          presentAddress: row[getIndex("Present Address")] || "",
          aadharNo: row[getIndex("Aadhar Number")] || "",
          designation: row[getIndex("Applying For the Post")] || "", // Fetch Designation from Column D (index 3)
        }));

      setEnquiryData(processedEnquiryData);

      // Process follow-up data for filtering
      if (followUpResult.success && followUpResult.data) {
        const rawFollowUpData = followUpResult.data || followUpResult;
        const followUpRows = Array.isArray(rawFollowUpData[0])
          ? rawFollowUpData.slice(1)
          : rawFollowUpData;

        const processedFollowUpData = followUpRows.map((row) => ({
          enquiryNo: row[1] || "", // Column B (index 1) - Enquiry No
          status: row[2] || "", // Column C (index 2) - Status
        }));

        setFollowUpData(processedFollowUpData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  const fetchFollowUpData = async () => {
    setLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec?sheet=Follow - Up&action=fetch'
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Raw API response:', result);

      if (!result.success) {
        throw new Error(result.error || 'Google Script returned an error');
      }

      // Handle both array formats (direct data or result.data)
      const rawData = result.data || result;

      if (!Array.isArray(rawData)) {
        throw new Error('Expected array data not received');
      }

      // Process data - skip header row if present
      const dataRows = rawData.length > 0 && Array.isArray(rawData[0]) ? rawData.slice(1) : rawData;

      const processedData = dataRows.map(row => ({
        timestamp: row[0] || '',       // Column A (index 0) - Timestamp
        enquiryNo: row[1] || '',       // Column B (index 1) - Enquiry No
        status: row[2] || '',          // Column C (index 2) - Status
        candidateSays: row[3] || '',   // Column D (index 3) - Candidates Says
        nextDate: row[4] || ''         // Column E (index 4) - Next Date
      }));

      console.log('Processed follow-up data:', processedData);
      setHistoryData(processedData);

    } catch (error) {
      console.error('Error in fetchFollowUpData:', error);
      setError(error.message);
      toast.error(`Failed to load follow-ups: ${error.message}`);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiryData();
    fetchFollowUpData();
  }, []);

  const pendingData = enquiryData.filter(item => {
    const hasFinalStatus = followUpData.some(followUp =>
      followUp.enquiryNo === item.candidateEnquiryNo &&
      (followUp.status === 'Joining' || followUp.status === 'Reject')
    );
    return !hasFinalStatus;
  });

  const handleCallClick = (item) => {
    setSelectedItem(item);
    setFormData({
      candidateSays: '',
      status: '',
      nextDate: ''
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const postToSheet = async (rowData) => {
    const URL = 'https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec';

    try {
      console.log('Attempting to post:', {
        sheetName: 'Follow - Up',
        rowData: rowData
      });

      const params = new URLSearchParams();
      params.append('sheetName', 'Follow - Up');
      params.append('action', 'insert');
      params.append('rowData', JSON.stringify(rowData));

      const response = await fetch(URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Server response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Server returned unsuccessful response');
      }

      return data;
    } catch (error) {
      console.error('Full error details:', {
        error: error.message,
        stack: error.stack,
        rowData: rowData,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Failed to update sheet: ${error.message}`);
    }
  };

  const updateEnquirySheet = async (enquiryNo) => {
    const URL = 'https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec';

    try {
      console.log('Attempting to update ENQUIRY sheet for:', enquiryNo);

      // First, fetch the ENQUIRY sheet data to find the correct row
      const fetchResponse = await fetch(
        `${URL}?sheet=ENQUIRY&action=fetch`
      );

      if (!fetchResponse.ok) {
        throw new Error(`HTTP error! status: ${fetchResponse.status}`);
      }

      const fetchResult = await fetchResponse.json();

      if (!fetchResult.success || !fetchResult.data) {
        throw new Error('Failed to fetch ENQUIRY sheet data');
      }

      // Find the row with matching enquiry number (Column C is index 2)
      let targetRowIndex = -1;
      const sheetData = fetchResult.data;

      for (let i = 0; i < sheetData.length; i++) {
        if (sheetData[i][2] === enquiryNo) { // Column C (index 2)
          targetRowIndex = i + 1; // Convert to 1-based index for Google Sheets
          break;
        }
      }

      if (targetRowIndex === -1) {
        throw new Error(`Enquiry number ${enquiryNo} not found in ENQUIRY sheet`);
      }

      console.log(`Found enquiry ${enquiryNo} at row ${targetRowIndex}`);

      // Format current date and time as 9/21/2020 14:21:19
      const now = new Date();
      const month = now.getMonth() + 1; // getMonth() returns 0-11
      const day = now.getDate();
      const year = now.getFullYear();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      const formattedDateTime = `${month}/${day}/${year} ${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      // Now update the specific cell using updateCell action
      const params = new URLSearchParams();
      params.append('sheetName', 'ENQUIRY');
      params.append('action', 'updateCell');
      params.append('rowIndex', targetRowIndex.toString());
      params.append('columnIndex', '27'); // Column AA is index 27 (1-based)
      params.append('value', formattedDateTime);

      const response = await fetch(URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('ENQUIRY sheet update response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Failed to update ENQUIRY sheet');
      }

      return data;
    } catch (error) {
      console.error('Error updating ENQUIRY sheet:', {
        error: error.message,
        stack: error.stack,
        enquiryNo: enquiryNo,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Failed to update ENQUIRY sheet: ${error.message}`);
    }
  };

  // utils/dateFormatter.js
  const formatDateTime = (isoString) => {
    const d = new Date(isoString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  const formatDOB = (dateString) => {
    if (!dateString) return '';

    // Handle different date formats that might come from the input
    let date;

    // If it's already a Date object
    if (dateString instanceof Date) {
      date = dateString;
    }
    // If it's in the format "1/11/2021" (mm/dd/yyyy or dd/mm/yyyy)
    else if (typeof dateString === 'string' && dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        if (parseInt(parts[0]) > 12) {
          date = new Date(parts[2], parts[1] - 1, parts[0]);
        } else {
          date = new Date(parts[2], parts[0] - 1, parts[1]);
        }
      }
    }
    else {
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) {
      return dateString;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!formData.candidateSays || !formData.status) {
      toast.error('Please fill all required fields');
      setSubmitting(false);
      return;
    }

    try {
      // For ALL statuses including Joining, submit to Follow-Up sheet first
      // const now = new Date();
      // const formattedTimestamp = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      const formattedTimestamp = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;

      const rowData = [
        formattedTimestamp,
        selectedItem.candidateEnquiryNo || '',
        formData.status,
        formData.candidateSays,
        formatDOB(formData.nextDate) || '',
      ];

      await postToSheet(rowData);

      // If status is "Joining", also update the ENQUIRY sheet
      if (formData.status === 'Joining') {
        await updateEnquirySheet(selectedItem.candidateEnquiryNo);
      }

      toast.success('Update successful!');
      setShowModal(false);
      fetchEnquiryData();
      fetchFollowUpData();

    } catch (error) {
      console.error('Submission failed:', error);
      toast.error(`Failed to update: ${error.message}`);
      if (error.message.includes('appendRow')) {
        toast('Please verify the "Follow-Up" sheet exists', {
          icon: 'ℹ️',
          duration: 8000
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPendingData = pendingData.filter(item => {
    // Search filter
    const matchesSearch = !searchTerm || 
      item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.candidateEnquiryNo?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Department filter
    const matchesDept = !filterDepartment || item.department === filterDepartment;
    
    // Date filter
    let matchesDate = true;
    if (filterDate && item.id) { // id stores Timestamp Column A
      try {
        const itemDate = new Date(item.id);
        const searchDate = new Date(filterDate);
        matchesDate = itemDate.getFullYear() === searchDate.getFullYear() &&
                     itemDate.getMonth() === searchDate.getMonth() &&
                     itemDate.getDate() === searchDate.getDate();
      } catch (e) {
        matchesDate = true;
      }
    }
    
    return matchesSearch && matchesDept && matchesDate;
  });

  const filteredHistoryData = historyData.filter(item => {
    // Search filter
    const matchesSearch = !searchTerm || 
      item.enquiryNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.candidateSays?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date filter (History uses item.timestamp or item.timestamp from Column A)
    let matchesDate = true;
    if (filterDate && item.timestamp) {
       try {
         // Handle dd/mm/yyyy hh:mm:ss format seen in History
         const [dPart] = item.timestamp.split(' ');
         const [d, m, y] = dPart.split('/');
         const itemDate = new Date(`${y}-${m}-${d}`);
         const searchDate = new Date(filterDate);
         matchesDate = itemDate.getFullYear() === searchDate.getFullYear() &&
                      itemDate.getMonth() === searchDate.getMonth() &&
                      itemDate.getDate() === searchDate.getDate();
       } catch (e) {
         matchesDate = true;
       }
    }
    
    return matchesSearch && matchesDate;
  });

  // Unique departments for filter
  const uniqueDepartments = [...new Set(enquiryData.map(item => item.department).filter(Boolean))].sort();

  // Unified Pagination logic
  const activeData = activeTab === "pending" ? filteredPendingData : filteredHistoryData;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = activeData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(activeData.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPaginationNav = () => {
    if (totalPages <= 1) return null;

    const pageButtons = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    return (
      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-1 py-1 rounded-l-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="sr-only">Previous</span>
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
        </button>

        {startPage > 1 && (
          <>
            <button onClick={() => paginate(1)} className="relative inline-flex items-center px-2 py-1 border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-indigo-50">1</button>
            {startPage > 2 && <span className="relative inline-flex items-center px-2 py-1 border border-gray-300 bg-white text-xs font-medium text-gray-700">...</span>}
          </>
        )}

        {Array.from({ length: endPage - startPage + 1 }).map((_, idx) => {
          const pageNum = startPage + idx;
          return (
            <button
              key={pageNum}
              onClick={() => paginate(pageNum)}
              className={`relative inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-bold transition-all ${currentPage === pageNum ? 'bg-indigo-600 text-white z-10' : 'bg-white text-gray-700 hover:bg-indigo-50'}`}
            >
              {pageNum}
            </button>
          );
        })}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="relative inline-flex items-center px-2 py-1 border border-gray-300 bg-white text-xs font-medium text-gray-700">...</span>}
            <button onClick={() => paginate(totalPages)} className="relative inline-flex items-center px-2 py-1 border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-indigo-50">{totalPages}</button>
          </>
        )}

        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative inline-flex items-center px-1 py-1 rounded-r-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="sr-only">Next</span>
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
        </button>
      </nav>
    );
  };

  return (
    <div className="space-y-3 md:pb-4 mb-4">
      {/* Unified "One Filter" Dashboard Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 md:gap-4 mb-2">
        <div className="flex items-center gap-4">
          <h1 className="hidden md:block text-2xl font-bold text-gray-800 tracking-tight">Call Tracker</h1>
          
          {/* Segmented Tab Control (Integrated into Filter Row) */}
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 shadow-sm self-start sm:self-center">
            <button
              onClick={() => { setActiveTab("pending"); setCurrentPage(1); }}
              className={`flex items-center gap-2 py-1 px-4 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all duration-200 ${
                activeTab === "pending"
                ? "bg-white text-indigo-600 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Clock size={13} />
              <span>Pending ({filteredPendingData.length})</span>
            </button>
            <button
              onClick={() => { setActiveTab("history"); setCurrentPage(1); }}
              className={`flex items-center gap-2 py-1 px-4 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all duration-200 ${
                activeTab === "history"
                ? "bg-white text-indigo-600 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <History size={13} />
              <span>History ({filteredHistoryData.length})</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
          {/* Search Section */}
          <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search calls..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full text-xs sm:text-sm shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:flex lg:items-center gap-2 w-full sm:w-auto">
            {/* Department Filter */}
            <div className="relative col-span-1 min-w-[140px]">
              <div
                onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                className="flex items-center gap-2 h-9 px-3 border border-gray-300 rounded bg-white text-[11px] text-gray-700 cursor-pointer hover:border-indigo-500 transition shadow-sm relative overflow-hidden"
              >
                <Filter size={12} className="text-gray-400 shrink-0" />
                <span className="truncate font-bold uppercase tracking-tight">{filterDepartment || "All Dept"}</span>
                <ChevronDown size={14} className={`ml-auto text-gray-400 transition-transform ${isDeptDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {isDeptDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDeptDropdownOpen(false)}></div>
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden py-1 max-h-48 overflow-y-auto ring-1 ring-black ring-opacity-5">
                    <div
                      onClick={() => { setFilterDepartment(''); setIsDeptDropdownOpen(false); setCurrentPage(1); }}
                      className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${!filterDepartment ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      All Departments
                      {!filterDepartment && <Check size={12} className="text-indigo-500" />}
                    </div>
                    {uniqueDepartments.map((dept, index) => (
                      <div
                        key={index}
                        onClick={() => { setFilterDepartment(dept); setIsDeptDropdownOpen(false); setCurrentPage(1); }}
                        className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${filterDepartment === dept ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                        {dept}
                        {filterDepartment === dept && <Check size={12} className="text-indigo-500" />}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Date Filter */}
            <div className="relative col-span-1">
              <div className="flex items-center gap-2 h-9 px-3 border border-gray-300 rounded bg-white text-xs text-gray-700 relative overflow-hidden shadow-sm hover:border-indigo-500 transition">
                <Calendar size={12} className="text-gray-400 shrink-0" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => {
                    setFilterDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-transparent focus:outline-none text-[11px] font-bold cursor-pointer uppercase"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Main Content Container (Synced with FindEnquiry.jsx) */}
      <div className="overflow-hidden border border-gray-200 rounded-lg bg-white min-h-[500px] flex flex-col shadow-sm">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner message="Retrieving call records..." minHeight="400px" />
          </div>
        ) : (
          <>
            {activeTab === "pending" && (
              <div className="p-0 flex-1 flex flex-col">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto scrollbar-hide flex-1">
                  <div className="max-h-[calc(100vh-280px)] min-h-[500px] overflow-y-auto scrollbar-hide flex flex-col justify-between">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50/5 sticky top-0 z-10 backdrop-blur-sm">
                        <tr>
                          <th className="px-4 py-2.5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Action</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Indent Number</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Candidate Enquiry Number</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Applying For the Post</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Candidate Name</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">DOB</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Candidate Phone Number</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Candidate Email</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Previous Company Name</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Job Experience</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Department</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Previous Position</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Reason Of Leaving</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Marital Status</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Last Salary Drawn</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Candidate Photo</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Refrence By</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Present Address</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Aadhar Number</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Resume Copy</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100 italic font-medium">
                        {tableLoading ? (
                          <tr>
                            <td colSpan="20" className="px-4 py-1">
                              <LoadingSpinner message="Scanning calls..." minHeight="300px" />
                            </td>
                          </tr>
                        ) : error ? (
                          <tr>
                            <td colSpan="20" className="px-4 py-12 text-center">
                              <p className="text-rose-500 text-xs font-bold mb-2">Error: {error}</p>
                              <button onClick={fetchEnquiryData} className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded text-xs font-bold shadow-sm">Retry</button>
                            </td>
                          </tr>
                        ) : currentItems.length === 0 ? (
                          <tr>
                            <td colSpan="20" className="px-4 py-24 text-center">
                              <div className="flex flex-col items-center justify-center space-y-2">
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">No pending calls found.</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          currentItems.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                               <td className="px-4 py-2 whitespace-nowrap text-center not-italic">
                                <button
                                  onClick={() => handleCallClick(item)}
                                  className="px-4 py-1 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                                >
                                  Call
                                </button>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-center text-xs font-black text-indigo-600 not-italic tracking-tighter">#{item.indentNo}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-center text-xs font-black text-indigo-600 not-italic tracking-tighter">{item.candidateEnquiryNo}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-center text-[11px] font-bold text-gray-600 not-italic">{item.applyingForPost}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-center text-[11px] font-black text-gray-900 not-italic">{item.candidateName}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-center text-[11px] font-bold text-gray-500 not-italic">{item.candidateDOB}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-center text-[11px] font-black text-gray-700 not-italic">{item.candidatePhone}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-center text-[11px] font-bold text-gray-500 not-italic lowercase">{item.candidateEmail}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-center text-[11px] font-bold text-gray-600 italic">{item.previousCompany || "-"}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-center text-[11px] font-bold text-gray-600 italic">{item.jobExperience}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-center text-[10px] font-black text-gray-400 uppercase not-italic tracking-widest">{item.department}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-center text-[11px] font-bold text-gray-600 italic">{item.previousPosition}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-center text-[11px] font-bold text-gray-500 italic max-w-[150px] truncate" title={item.reasonForLeaving}>{item.reasonForLeaving}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-center text-[11px] font-bold text-gray-600 italic">{item.maritalStatus}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-center text-[11px] font-black text-emerald-600 not-italic">{item.lastSalary}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-center not-italic">
                                {item.candidatePhoto ? (
                                  <a href={item.candidatePhoto} target="_blank" rel="noopener noreferrer" className="p-1 px-2 text-indigo-600 bg-indigo-50 rounded border border-indigo-100 text-[10px] font-black uppercase hover:bg-white shadow-sm transition-all">PIC</a>
                                ) : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-center text-[11px] font-bold text-gray-600 italic">{item.referenceBy || "—"}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-center text-[11px] font-bold text-gray-500 italic max-w-[200px] truncate" title={item.presentAddress}>{item.presentAddress}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-center text-[11px] font-black text-gray-700 not-italic tracking-tighter">{item.aadharNo}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-center not-italic">
                                {item.candidateResume ? (
                                  <a href={item.candidateResume} target="_blank" rel="noopener noreferrer" className="p-1 px-2 text-indigo-600 bg-indigo-50 rounded border border-indigo-100 text-[10px] font-black uppercase hover:bg-white shadow-sm transition-all">DOC</a>
                                ) : <span className="text-gray-300">—</span>}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>

                    {/* Standardized Pagination Footer */}
                    <div className="flex px-4 py-1.5 bg-gray-50/50 border-t border-gray-100 items-center justify-between sticky bottom-0 backdrop-blur-md">
                      <div className="flex items-center gap-4 flex-wrap">
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-tight">
                          Showing <span className="text-indigo-600">{activeData.length > 0 ? indexOfFirstItem + 1 : 0}</span> to <span className="text-indigo-600">{Math.min(indexOfLastItem, activeData.length)}</span> of <span className="text-gray-800">{activeData.length}</span> records
                        </p>
                        <div className="flex items-center gap-2 border-l border-gray-200 pl-4 h-4">
                          <label className="text-[9px] text-gray-400 font-black uppercase">Rows:</label>
                          <select
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            className="text-[9px] border border-gray-200 rounded px-1.5 py-0.5 bg-white font-black text-gray-600 outline-none shadow-sm cursor-pointer"
                          >
                            {[15, 30, 50, 100].map(val => (
                              <option key={val} value={val}>{val}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="shrink-0 scale-90 origin-right">
                        {renderPaginationNav()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Card View (Simplified for consistency) */}
                <div className="md:hidden flex flex-col">
                  <div className="p-3 space-y-3">
                    {currentItems.map((item) => (
                      <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3.5 space-y-2.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-black text-indigo-600 tracking-widest uppercase">#{item.candidateEnquiryNo}</span>
                          <span className="bg-gray-100 text-gray-400 px-2 py-0.5 rounded font-black uppercase">{item.department}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-black text-gray-800 leading-tight">{item.candidateName}</div>
                            <div className="text-[10px] text-indigo-600 font-bold uppercase mt-0.5 tracking-tight">{item.applyingForPost}</div>
                          </div>
                           <div className="flex gap-1.5">
                            {item.candidatePhoto && <a href={item.candidatePhoto} target="_blank" rel="noopener noreferrer" className="p-1 px-2 text-indigo-600 bg-indigo-50 rounded text-[9px] font-black uppercase">PIC</a>}
                            {item.candidateResume && <a href={item.candidateResume} target="_blank" rel="noopener noreferrer" className="p-1 px-2 text-indigo-600 bg-indigo-50 rounded text-[9px] font-black uppercase">DOC</a>}
                          </div>
                        </div>
                        <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
                           <div className="text-[11px] text-gray-700 font-black tracking-tight">{item.candidatePhone}</div>
                           <button
                              onClick={() => handleCallClick(item)}
                              className="px-4 py-1.5 bg-indigo-600 text-white rounded text-[9px] font-black uppercase active:scale-95 transition-all"
                            >
                              Call
                            </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 flex justify-center sticky bottom-0 bg-white border-t border-gray-100">
                    {renderPaginationNav()}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="p-0 flex-1 flex flex-col">
                {/* Desktop History View */}
                <div className="hidden md:block overflow-x-auto scrollbar-hide flex-1">
                  <div className="max-h-[calc(100vh-280px)] min-h-[500px] overflow-y-auto scrollbar-hide flex flex-col justify-between">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50/5 sticky top-0 z-10 backdrop-blur-sm">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Enq No.</th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Candidate Response</th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Next Action</th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100 italic font-medium">
                        {currentItems.length === 0 ? (
                           <tr>
                              <td colSpan="5" className="px-4 py-24 text-center">
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">No history recorded.</p>
                              </td>
                           </tr>
                        ) : (
                          currentItems.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-2 whitespace-nowrap text-xs font-black text-indigo-600 not-italic">{item.enquiryNo}</td>
                              <td className="px-4 py-2 whitespace-nowrap not-italic">
                                <span
                                  className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider ${item.status === "Joining"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : item.status === "Reject"
                                        ? "bg-rose-100 text-rose-700"
                                        : "bg-indigo-100 text-indigo-700"
                                    }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-xs text-gray-600 leading-relaxed max-w-xs truncate" title={item.candidateSays}>"{item.candidateSays}"</td>
                              <td className="px-4 py-2 whitespace-nowrap text-xs font-black text-gray-500 not-italic">{item.nextDate || "-"}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-[10px] text-gray-300 font-black not-italic uppercase">{item.timestamp || "-"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>

                    {/* Standardized Pagination Footer */}
                    <div className="flex px-4 py-1.5 bg-gray-50/50 border-t border-gray-100 items-center justify-between sticky bottom-0 backdrop-blur-md">
                      <div className="flex items-center gap-4">
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-tight">
                          Showing <span className="text-indigo-600">{activeData.length > 0 ? indexOfFirstItem + 1 : 0}</span> to <span className="text-indigo-600">{Math.min(indexOfLastItem, activeData.length)}</span> of <span className="text-gray-800">{activeData.length}</span> records
                        </p>
                      </div>
                      <div className="shrink-0 scale-90 origin-right">
                        {renderPaginationNav()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile History View */}
                <div className="md:hidden flex flex-col">
                  <div className="p-3 space-y-3">
                    {currentItems.map((item, index) => (
                      <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3.5 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-indigo-600 text-[10px] tracking-widest uppercase">#{item.enquiryNo}</span>
                           <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase ${item.status === "Joining" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"}`}>{item.status}</span>
                        </div>
                        <div className="text-xs text-gray-600 italic font-medium leading-relaxed">"{item.candidateSays}"</div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-50 text-[9px] font-black text-gray-400 uppercase">
                          <span>Next: <span className="text-gray-600">{item.nextDate || "-"}</span></span>
                          <span>{item.timestamp.split(' ')[0]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 flex justify-center sticky bottom-0 bg-white border-t border-gray-100">
                    {renderPaginationNav()}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Call Modal - Ultra-Compact Redesign */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/20">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white">
              <div>
                <h3 className="text-lg font-black text-gray-800 tracking-tight">Process Call</h3>
                <p className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-widest">Enquiry: {selectedItem.candidateEnquiryNo}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50/50 p-2 rounded-md border border-gray-100">
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-0.5">Candidate</label>
                    <div className="text-xs font-black text-indigo-600 truncate">{selectedItem.candidateName}</div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-700 mb-1 uppercase tracking-tighter">Status*</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 bg-white font-bold"
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="Follow-up">Follow-up </option>
                    <option value="Interview">Interview</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Joining">Joining</option>
                    <option value="Reject">Reject</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-700 mb-1 uppercase tracking-tighter">
                  {formData.status === "Negotiation" ? "Customer Requirement*" : 
                   formData.status === "On Hold" ? "Reason For Hold*" : 
                   formData.status === "Joining" ? "Joining Commitment*" : 
                   formData.status === "Reject" ? "Rejection Reason*" : 
                   "Candidate Response*"}
                </label>
                <textarea
                  name="candidateSays"
                  value={formData.candidateSays}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded px-2.5 py-2 text-xs focus:ring-1 focus:ring-indigo-500 bg-white italic font-medium"
                  placeholder="Enter details here..."
                  required
                />
              </div>

              {formData.status && !["Joining", "Reject"].includes(formData.status) && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-[10px] font-black text-gray-700 mb-1 uppercase tracking-tighter">
                    {formData.status === "Interview" ? "Schedule Date*" : "Recall Date*"}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                    <input
                      type="date"
                      name="nextDate"
                      value={formData.nextDate}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded pl-9 pr-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 bg-white font-bold"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 border border-gray-200 rounded text-[10px] font-black uppercase text-gray-500 hover:bg-gray-50 transition-all"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2 bg-indigo-600 text-white rounded text-[10px] font-black uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                       <svg className="animate-spin h-3 w-3 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Updating...</span>
                    </div>
                  ) : "Update Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallTracker;