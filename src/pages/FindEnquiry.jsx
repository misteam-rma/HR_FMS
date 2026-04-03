import React, { useState, useEffect } from 'react';
import { Search, Clock, Check, X, Upload, Share, QrCode, Download, ChevronDown, ChevronUp, Plus, Filter, Calendar, List, History } from 'lucide-react';
import useDataStore from '../store/dataStore';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import LoadingSpinner from '../components/LoadingSpinner';

const FindEnquiry = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [indentData, setIndentData] = useState([]);
  const [enquiryData, setEnquiryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [generatedCandidateNo, setGeneratedCandidateNo] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const [shareFormData, setShareFormData] = useState({
    recipientName: '',
    recipientEmail: '',
    subject: 'Candidate Enquiry Details',
    message: 'Please find the candidate enquiry details attached below.',
  });

  const [formData, setFormData] = useState({
    candidateName: '',
    candidateDOB: '',
    candidatePhone: '',
    candidateEmail: '',
    previousCompany: '',
    jobExperience: '',
    department: '',
    previousPosition: '',
    maritalStatus: '',
    candidatePhoto: null,
    candidateResume: null,
    presentAddress: '',
    aadharNo: '',
    lastSalaryDrawn: '',
    reasonForLeaving: '',
    status: 'NeedMore'
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Google Drive folder ID for file uploads
  const GOOGLE_DRIVE_FOLDER_ID = '13WWtV4E5AapVE2gkcjOZvTnH4Lx4IerR';

  // Fetch all necessary data
  const fetchAllData = async () => {
    setLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      // Fetch INDENT data
      const indentResponse = await fetch(
        'https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec?sheet=INDENT&action=fetch'
      );

      if (!indentResponse.ok) {
        throw new Error(`HTTP error! status: ${indentResponse.status}`);
      }

      const indentResult = await indentResponse.json();

      if (indentResult.success && indentResult.data && indentResult.data.length >= 7) {
        const headers = indentResult.data[5].map(h => h.trim());
        const dataFromRow7 = indentResult.data.slice(6);

        const getIndex = (headerName) => headers.findIndex(h => h === headerName);

        const processedData = dataFromRow7
          .filter(row => {
            const status = row[getIndex('Status')];
            const planned2 = row[getIndex('Planned 2')];
            const actual2 = row[getIndex('Actual 2')];

            return status === 'NeedMore' &&
              planned2 &&
              (!actual2 || actual2 === '');
          })
          .map(row => ({
            id: row[getIndex('Timestamp')],
            indentNo: row[getIndex('Indent Number')],
            post: row[getIndex('Post')],
            department: row[getIndex('Department')],
            gender: row[getIndex('Gender')],
            prefer: row[getIndex('Prefer')],
            numberOfPost: row[getIndex('Number Of Posts')],
            competitionDate: row[getIndex('Completion Date')],
            socialSite: row[getIndex('Social Site')],
            status: row[getIndex('Status')],
            plannedDate: row[getIndex('Planned 2')],
            actual: row[getIndex('Actual 2')],
            experience: row[getIndex('Experience')],
          }));

        // Fetch ENQUIRY data to check for completed recruitments
        const enquiryResponse = await fetch(
          'https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec?sheet=ENQUIRY&action=fetch'
        );

        if (!enquiryResponse.ok) {
          throw new Error(`HTTP error! status: ${enquiryResponse.status}`);
        }

        const enquiryResult = await enquiryResponse.json();

        if (enquiryResult.success && enquiryResult.data && enquiryResult.data.length > 0) {
          // First row contains headers (row 6 in your sheet)
          const headers = enquiryResult.data[5].map(h => h ? h.trim() : '');
          const enquiryRows = enquiryResult.data.slice(6);

          const getEnquiryIndex = (headerName) => headers.findIndex(h => h === headerName);

          // Count completed recruitments per indent number
          const indentRecruitmentCount = {};

          enquiryRows.forEach(row => {
            if (row[getEnquiryIndex('Timestamp')]) { // Filter out empty rows
              const indentNo = row[getEnquiryIndex('Indent Number')];
              const statusColumn = 27; // Column AB (index 27 as columns start from 0)
              const statusValue = row[statusColumn]; // Column AB value

              if (indentNo && statusValue) {
                if (!indentRecruitmentCount[indentNo]) {
                  indentRecruitmentCount[indentNo] = 0;
                }
                indentRecruitmentCount[indentNo]++;
              }
            }
          });

          // Filter out indent items where recruitment is complete
          const pendingTasks = processedData.filter(task => {
            if (!task.plannedDate || task.actual) return false;

            const indentNo = task.indentNo;
            const requiredPosts = parseInt(task.numberOfPost) || 0;
            const completedRecruitments = indentRecruitmentCount[indentNo] || 0;

            // Show in pending only if not all required posts are filled
            return completedRecruitments < requiredPosts;
          });

          setIndentData(pendingTasks);
        } else {
          setIndentData(processedData.filter(task => task.plannedDate && !task.actual));
        }

        // Process ENQUIRY data for history tab
        if (enquiryResult.success && enquiryResult.data && enquiryResult.data.length > 0) {
          // First row contains headers (row 6 in your sheet)
          const headers = enquiryResult.data[5].map(h => h ? h.trim() : '');
          const enquiryRows = enquiryResult.data.slice(6);

          const getEnquiryIndex = (headerName) => headers.findIndex(h => h === headerName);

          const processedEnquiryData = enquiryRows
            .filter(row => row[getEnquiryIndex('Timestamp')]) // Filter out empty rows
            .map(row => ({
              id: row[getEnquiryIndex('Timestamp')],
              indentNo: row[getEnquiryIndex('Indent Number')],
              candidateEnquiryNo: row[getEnquiryIndex('Candidate Enquiry Number')],
              applyingForPost: row[getEnquiryIndex('Applying For the Post')],
              department: row[getEnquiryIndex('Department')],
              candidateName: row[getEnquiryIndex('Candidate Name')],
              candidateDOB: row[getEnquiryIndex('DOB')] || row[getEnquiryIndex('DCB')], // Fallback to DCB if DOB not found
              candidatePhone: row[getEnquiryIndex('Candidate Phone Number')],
              candidateEmail: row[getEnquiryIndex('Candidate Email')],
              previousCompany: row[getEnquiryIndex('Previous Company Name')],
              jobExperience: row[getEnquiryIndex('Job Experience')] || '',
              previousPosition: row[getEnquiryIndex('Previous Position')] || '',
              reasonOfLeaving: row[getEnquiryIndex('Reason Of Leaving')] || row[getEnquiryIndex('Reason For Leaving')] || '',
              maritalStatus: row[getEnquiryIndex('Marital Status')] || '',
              lastSalaryDrawn: row[getEnquiryIndex('Last Salary Drawn')] || '',
              candidatePhoto: row[getEnquiryIndex('Candidate Photo')] || '',
              referenceBy: row[getEnquiryIndex('Refrence By')] || row[getEnquiryIndex('Reference By')] || '',
              presentAddress: row[getEnquiryIndex('Present Address')] || '',
              aadharNumber: row[getEnquiryIndex('Aadhar Number')] || row[getEnquiryIndex('Aadhar No')] || '',
              resumeCopy: row[getEnquiryIndex('Resume Copy')] || row[19] || '', // Fallback to index 19
            }));

          setEnquiryData(processedEnquiryData);
        }

      } else {
        throw new Error(indentResult.error || 'Not enough rows in INDENT sheet data');
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  const generateNextAAPIndentNumber = () => {
    // Extract all indent numbers from both indentData and enquiryData
    const allIndentNumbers = [
      ...indentData.map(item => item.indentNo),
      ...enquiryData.map(item => item.indentNo)
    ].filter(Boolean); // Remove empty/null values

    // Find the highest AAP number
    let maxAAPNumber = 0;

    allIndentNumbers.forEach(indentNo => {
      const match = indentNo.match(/^AAP-(\d+)$/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxAAPNumber) {
          maxAAPNumber = num;
        }
      }
    });

    // Return the next AAP number
    const nextNumber = maxAAPNumber + 1;
    return `AAP-${String(nextNumber).padStart(2, '0')}`;
  };

  // Generate candidate number based on existing enquiries
  const generateCandidateNumber = () => {
    if (enquiryData.length === 0) {
      return 'ENQ-01';
    }

    // Find the highest existing candidate number
    const lastNumber = enquiryData.reduce((max, enquiry) => {
      if (!enquiry.candidateEnquiryNo) return max;

      const match = enquiry.candidateEnquiryNo.match(/ENQ-(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);

    const nextNumber = lastNumber + 1;
    return `ENQ-${String(nextNumber).padStart(2, '0')}`;
  };

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Upload file to Google Drive
  const uploadFileToGoogleDrive = async (file, type) => {
    try {
      const base64Data = await fileToBase64(file);

      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            action: 'uploadFile',
            base64Data: base64Data,
            fileName: `${generatedCandidateNo}_${type}_${file.name}`,
            mimeType: file.type,
            folderId: GOOGLE_DRIVE_FOLDER_ID
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        return result.fileUrl;
      } else {
        throw new Error(result.error || 'File upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const historyData = enquiryData;

  const handleEnquiryClick = (item = null) => {
    let indentNo = '';
    let isNewAAP = false;

    if (item) {
      setSelectedItem(item);
      indentNo = item.indentNo;
    } else {
      indentNo = generateNextAAPIndentNumber();
      isNewAAP = true;

      setSelectedItem({
        indentNo: indentNo,
        post: '',
        gender: '',
        prefer: '',
        numberOfPost: '',
        competitionDate: '',
        socialSite: '',
        status: 'NeedMore',
        plannedDate: '',
        actual: '',
        experience: ''
      });
    }

    const candidateNo = generateCandidateNumber();
    setGeneratedCandidateNo(candidateNo);

    // Ensure all fields are properly initialized with empty strings, not undefined
    setFormData({
      candidateName: '',
      candidateDOB: '',
      candidatePhone: '',
      candidateEmail: '',
      previousCompany: '',
      jobExperience: '',
      department: item ? item.department : '',
      lastSalary: '',
      previousPosition: '',
      reasonForLeaving: '',
      lastSalaryDrawn: '',
      maritalStatus: '',
      lastEmployerMobile: '',
      candidatePhoto: null,
      candidateResume: null,
      referenceBy: '',
      presentAddress: '',
      aadharNo: '',
      status: 'NeedMore'
    });
    setShowModal(true);
  };

  const formatDOB = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return as-is if not a valid date
    }

    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear().toString().slice(-2);

    return `${day}-${month}-${year}`;
  };

  const handleShareClick = (item) => {
    setSelectedItem(item);
    // Create the share link with indent number as a query parameter
    const shareLink = `https://sbh-find-enquiry.vercel.app/?indent=${encodeURIComponent(item.indentNo)}`;

    setShareFormData({
      message: `Dear Recipient,\n\nPlease fill the enquiry details for candidate who is applying for the position of ${item.post}.\n\nEnquiry Form Link: ${shareLink}\n\nBest regards,\nHR Team SBH Hospital Raipur (C.G.)`,
    });

    console.log("Share Link:", shareLink);
    setShowShareModal(true);
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const documents = [{
        name: selectedItem.candidateName,
        serialNo: selectedItem.candidateEnquiryNo,
        documentType: selectedItem.applyingForPost,
        category: selectedItem.department,
        imageUrl: selectedItem.candidatePhoto || ''
      }];

      const URL = 'https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec';

      const params = new URLSearchParams();
      params.append('action', 'shareViaEmail');
      params.append('recipientEmail', shareFormData.recipientEmail);
      params.append('subject', shareFormData.subject);
      params.append('message', shareFormData.message);
      params.append('documents', JSON.stringify(documents));

      const response = await fetch(URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to send email');
      }

      toast.success('Details shared successfully!');
      setShowShareModal(false);
    } catch (error) {
      console.error('Error sharing details:', error);
      toast.error(`Failed to share details: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };



  const handleShareInputChange = (e) => {
    const { name, value } = e.target;
    setShareFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let photoUrl = "";
      let resumeUrl = "";

      // Upload photo if exists
      if (formData.candidatePhoto) {
        setUploadingPhoto(true);
        photoUrl = await uploadFileToGoogleDrive(
          formData.candidatePhoto,
          "photo"
        );
        setUploadingPhoto(false);
        toast.success("Photo uploaded successfully!");
      }

      // Upload resume if exists
      if (formData.candidateResume) {
        setUploadingResume(true);
        resumeUrl = await uploadFileToGoogleDrive(
          formData.candidateResume,
          "resume"
        );
        setUploadingResume(false);
        toast.success("Resume uploaded successfully!");
      }

      // Create timestamp in dd/mm/yyyy hh:mm:ss format
      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");

      const formattedTimestamp = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;

      const rowData = [
        formattedTimestamp, // Column A: Timestamp
        selectedItem.indentNo, // Column B: Indent Number
        generatedCandidateNo, // Column C: Candidate Enquiry Number
        selectedItem.post, // Column D: Applying For the Post
        formData.candidateName, // Column E: Candidate Name
        formatDOB(formData.candidateDOB), // Column F: DCB (DOB)
        formData.candidatePhone, // Column G: Candidate Phone Number
        formData.candidateEmail, // Column H: Candidate Email
        formData.previousCompany || "", // Column I: Previous Company Name
        formData.jobExperience || "", // Column J: Job Experience
        formData.department || "", // Column K: Department (FIXED)
        formData.previousPosition || "", // Column L: Previous Position
        formData.reasonForLeaving || "", // Column M: Reason For Leaving (NEW)
        formData.maritalStatus || "", // Column N: Marital Status
        formData.lastSalaryDrawn || "", // Column O: Last Salary Drawn (NEW)
        photoUrl, // Column P: Candidate Photo (URL)
        "", // Column Q: Reference By
        formData.presentAddress || "", // Column R: Present Address
        formData.aadharNo || "", // Column S: Aadhar No
        resumeUrl, // Column T: Candidate Resume (URL)
      ];

      console.log("Submitting to ENQUIRY sheet:", rowData);

      // Submit to ENQUIRY sheet
      const enquiryResponse = await fetch(
        "https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            sheetName: "ENQUIRY",
            action: "insert",
            rowData: JSON.stringify(rowData),
          }),
        }
      );

      const enquiryResult = await enquiryResponse.json();
      console.log("ENQUIRY response:", enquiryResult);

      if (!enquiryResult.success) {
        throw new Error(enquiryResult.error || "ENQUIRY submission failed");
      }

      // Only update INDENT sheet if status is Complete
      if (formData.status === "Complete") {
        console.log("Updating INDENT sheet for status Complete");

        // Fetch current INDENT data for update
        const indentFetchResponse = await fetch(
          "https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec?sheet=INDENT&action=fetch"
        );

        const latestIndentResult = await indentFetchResponse.json();
        console.log("INDENT data fetched for status update:", latestIndentResult);

        if (!latestIndentResult.success) {
          throw new Error(
            "Failed to fetch INDENT data for update: " +
            (latestIndentResult.error || "Unknown error")
          );
        }

        // Find the correct row for this indent
        let rowIndex = -1;
        for (let i = 1; i < latestIndentResult.data.length; i++) {
          if (latestIndentResult.data[i][1] === selectedItem.indentNo) {
            rowIndex = i + 1; // Spreadsheet rows are 1-indexed
            break;
          }
        }

        if (rowIndex === -1) {
          throw new Error(
            `Could not locate indentNo: ${selectedItem.indentNo} in INDENT sheet`
          );
        }

        console.log("Located row index:", rowIndex);

        // Get headers from retrieved data
        const headers = latestIndentResult.data[5];
        console.log("Headers:", headers);

        // Find column indices
        const getColumnIndex = (columnName) => {
          return headers.findIndex(
            (h) => h && h.toString().trim() === columnName
          );
        };

        const statusIndex = getColumnIndex("Status");
        const actual2Index = getColumnIndex("Actual 2");

        console.log("Status column index:", statusIndex);
        console.log("Actual 2 column index:", actual2Index);

        // Update Status column
        if (statusIndex !== -1) {
          console.log("Updating Status column...");
          const statusResponse = await fetch(
            "https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                sheetName: "INDENT",
                action: "updateCell",
                rowIndex: rowIndex.toString(),
                columnIndex: (statusIndex + 1).toString(), // Convert to string
                value: "Complete",
              }),
            }
          );

          const statusResult = await statusResponse.json();
          console.log("Status update result:", statusResult);

          if (!statusResult.success) {
            console.error("Status update failed:", statusResult.error);
          }
        }

        // Update Actual 2 column
        if (actual2Index !== -1) {
          console.log("Updating Actual 2 column...");
          const actual2Response = await fetch(
            "https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                sheetName: "INDENT",
                action: "updateCell",
                rowIndex: rowIndex.toString(),
                columnIndex: (actual2Index + 1).toString(), // Convert to string
                value: new Date().toISOString(),
              }),
            }
          );

          const actual2Result = await actual2Response.json();
          console.log("Actual 2 update result:", actual2Result);

          if (!actual2Result.success) {
            console.error("Actual 2 update failed:", actual2Result.error);
          }
        }

        toast.success("Enquiry submitted and INDENT marked as Complete!");
      } else {
        toast.success("Enquiry submitted successfully!");
      }

      setShowModal(false);
      fetchAllData();
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
      setUploadingPhoto(false);
      setUploadingResume(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Robust date parsing for filter matching
  const getFormattedDateToMatch = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getFormattedDateToMatchFromSheet = (itemDate) => {
    if (!itemDate) return "";
    if (typeof itemDate === "string" && /^\d{2}\/\d{2}\/\d{4}/.test(itemDate)) {
      return itemDate.split(" ")[0];
    }
    const d = new Date(itemDate);
    if (isNaN(d.getTime())) return String(itemDate);
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const filteredPendingData = indentData.filter((item) => {
    const matchesSearch =
      item.post?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.indentNo?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = filterDepartment
      ? item.department === filterDepartment
      : true;

    let matchesDate = true;
    if (filterDate) {
      const formattedFilterDate = getFormattedDateToMatch(filterDate);
      const formattedItemDate = getFormattedDateToMatchFromSheet(item.completionDate);
      matchesDate = formattedItemDate === formattedFilterDate;
    }

    return matchesSearch && matchesDepartment && matchesDate;
  });

  const filteredHistoryData = enquiryData.filter((item) => {
    const matchesSearch =
      item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.candidateEnquiryNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.indentNo?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = filterDepartment
      ? item.department === filterDepartment
      : true;

    let matchesDate = true;
    if (filterDate) {
      const formattedFilterDate = getFormattedDateToMatch(filterDate);
      // History uses candidateDOB or Timestamp logic potentially, but we'll stick to a primary field or the portal standard
      const formattedItemDate = getFormattedDateToMatchFromSheet(item.candidateDOB);
      matchesDate = formattedItemDate === formattedFilterDate;
    }

    return matchesSearch && matchesDepartment && matchesDate;
  });

  // Get unique departments for filter dropdown
  const uniqueDepartmentsFromData = Array.from(
    new Set(
      [...indentData, ...enquiryData]
        .map((item) => item.department)
        .filter((dept) => dept && typeof dept === 'string' && dept.trim() !== "")
    )
  ).sort();

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        [field]: file,
      }));
    }
  };

  // Unified Pagination logic
  const filteredData = activeTab === "pending" ? filteredPendingData : filteredHistoryData;
  const filteredDataCount = filteredData.length;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(filteredDataCount / itemsPerPage));

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Pagination navigation renderer matching Indent.jsx
  const renderPaginationNav = () => (
    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px w-full justify-center sm:w-auto" aria-label="Pagination">
      <button
        onClick={() => paginate(currentPage - 1)}
        disabled={currentPage === 1}
        className="relative inline-flex items-center px-1.5 py-1 sm:px-2 sm:py-1 rounded-l-md border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="sr-only">Previous</span>
        <svg className="h-4 w-4 sm:h-4 sm:w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </button>

      {[...Array(totalPages)].map((_, i) => {
        const pageNum = i + 1;
        if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
          return (
            <button
              key={pageNum}
              onClick={() => paginate(pageNum)}
              className={`relative inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1 border text-xs sm:text-sm font-medium ${currentPage === pageNum ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
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
        disabled={currentPage === totalPages}
        className="relative inline-flex items-center px-1.5 py-1 sm:px-2 sm:py-1 rounded-r-md border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="sr-only">Next</span>
        <svg className="h-4 w-4 sm:h-4 sm:w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </button>
    </nav>
  );



  return (
    <div className="space-y-3 md:pb-4 mb-4">
      {/* Unified "One Filter" Dashboard Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 md:gap-4 mb-2">
        <div className="flex items-center gap-4">
          <h1 className="hidden md:block text-2xl font-bold text-gray-800">Find Enquiry</h1>

          {/* Segmented Tab Control (Integrated into Filter Row) */}
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 shadow-sm self-start sm:self-center">
            <button
              onClick={() => { setActiveTab("pending"); setCurrentPage(1); }}
              className={`flex items-center gap-2 py-1 px-4 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all duration-200 ${activeTab === "pending"
                  ? "bg-white text-indigo-600 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
            >
              <Clock size={13} />
              <span>Pending ({filteredPendingData.length})</span>
            </button>
            <button
              onClick={() => { setActiveTab("history"); setCurrentPage(1); }}
              className={`flex items-center gap-2 py-1 px-4 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all duration-200 ${activeTab === "history"
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
          {/* Search + Action Section */}
          <div className="flex flex-row items-center gap-2 w-full sm:w-auto order-1 sm:order-none">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full text-xs sm:text-sm shadow-sm transition-all"
              />
            </div>

            <button
              onClick={() => handleEnquiryClick()}
              className="inline-flex items-center justify-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 shrink-0 transform active:scale-95"
              title="New Enquiry"
            >
              <Plus size={16} className="sm:mr-2" />
              <span className="hidden sm:inline">New Enquiry</span>
            </button>
          </div>

          <div className="grid grid-cols-2 lg:flex lg:items-center gap-2 w-full sm:w-auto order-2 sm:order-none">
            {/* Department Filter */}
            <div className="relative col-span-1 min-w-[140px]">
              <div
                onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                className="flex items-center gap-2 h-9 px-3 border border-gray-300 rounded bg-white text-xs text-gray-700 cursor-pointer hover:border-indigo-500 transition shadow-sm relative overflow-hidden"
              >
                <Filter size={12} className="text-gray-400 shrink-0" />
                <span className="truncate font-medium">{filterDepartment || "All Dept"}</span>
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
                    {uniqueDepartmentsFromData.map((dept, index) => (
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
                  className="w-full bg-transparent focus:outline-none text-[11px] font-medium cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Main Content Container (Synced with Indent.jsx) */}
      <div className="overflow-hidden border border-gray-200 rounded-lg bg-white min-h-[500px] flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner message="Retrieving records..." minHeight="400px" />
          </div>
        ) : (
          <>
            {activeTab === "pending" && (
              <div className="p-0">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto scrollbar-hide">
                  <div className="max-h-[calc(105vh-280px)] min-h-[530px] overflow-y-auto scrollbar-hide border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Action</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Indent Number</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Post Title</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Gender</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Department</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Prefer</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Experience</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">No. of Post</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Completion Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {tableLoading ? (
                          <tr>
                            <td colSpan="9" className="px-4 py-1">
                              <LoadingSpinner message="Searching records..." minHeight="300px" />
                            </td>
                          </tr>
                        ) : filteredPendingData.length === 0 ? (
                          <tr>
                            <td colSpan="9" className="px-4 py-12 text-center text-gray-400 text-xs font-medium">No pending enquiries found.</td>
                          </tr>
                        ) : (
                          currentItems.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <button
                                  onClick={() => handleEnquiryClick(item)}
                                  className="bg-indigo-600 text-white px-3 py-1 rounded-md text-xs hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
                                >
                                  Process
                                </button>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.indentNo}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.post}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.gender}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.department}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.prefer}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.experience}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.numberOfPost}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                {(() => {
                                  const dateStr = item.completionDate;
                                  if (!dateStr) return "-";
                                  if (typeof dateStr === 'string' && /^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) return dateStr.split(' ')[0];
                                  const d = new Date(dateStr);
                                  return isNaN(d.getTime()) ? dateStr : `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
                                })()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View with Embedded Pagination */}
                <div className="md:hidden flex flex-col border border-gray-300 rounded-xl overflow-hidden bg-gray-50 shadow-sm h-[calc(105vh-240px)]">
                  <div className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-hide">
                    {tableLoading ? (
                      <LoadingSpinner message="Searching pending records..." minHeight="250px" />
                    ) : filteredPendingData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-24">
                        <p className="text-gray-500 text-lg">No pending enquiries found.</p>
                      </div>
                    ) : (
                      currentItems.map((item, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 space-y-1.5">
                          {/* Top Bar */}
                          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-indigo-600 text-sm">#{item.indentNo}</span>
                              <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-medium uppercase tracking-wider">{item.department}</span>
                            </div>
                            <button
                              onClick={() => handleEnquiryClick(item)}
                              className="bg-indigo-50 px-3 py-1 rounded text-indigo-700 text-xs font-bold border border-indigo-100"
                            >
                              Enquiry
                            </button>
                          </div>

                          {/* Main Details */}
                          <div className="flex justify-between items-center py-0.5">
                            <div className="text-sm">
                              <span className="font-bold text-gray-900">{item.post}</span>
                              <span className="text-gray-400 text-[10px] ml-2">({item.numberOfPost} pos)</span>
                            </div>
                          </div>

                          {/* Full Details */}
                          <div className="grid grid-cols-1 divide-y divide-gray-50 text-[11px] pt-1">
                            <div className="flex justify-between py-1">
                              <span className="text-gray-400">Gender</span>
                              <span className="font-semibold text-gray-700">{item.gender}</span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-gray-400">Prefer</span>
                              <span className="font-semibold text-gray-700 text-right truncate max-w-[150px]">{item.prefer || "-"} {item.experience}</span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-gray-400">Completion</span>
                              <span className="font-semibold text-gray-700">{item.completionDate ? new Date(item.completionDate).toLocaleDateString() : "-"}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Fixed Bounding Box Pagination */}
                  <div className="border-t border-gray-300 bg-white px-2 py-2 flex justify-center sticky bottom-0">
                    {renderPaginationNav()}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="p-0">
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto scrollbar-hide">
                  <div className="max-h-[calc(105vh-280px)] min-h-[530px] overflow-y-auto scrollbar-hide border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Photo</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Resume</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Indent No.</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Enq No.</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Candidate Name</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Post</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">DOB</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Phone</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Email</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Previous Company</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Experience</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Department</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Position</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Reason of Leaving</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Marital Status</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Salary Drawn</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Reference</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Address</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Aadhar</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {tableLoading ? (
                          <tr>
                            <td colSpan="19" className="px-4 py-1">
                              <LoadingSpinner message="Retrieving history..." minHeight="300px" />
                            </td>
                          </tr>
                        ) : filteredHistoryData.length === 0 ? (
                          <tr>
                            <td colSpan="19" className="px-4 py-12 text-center text-gray-400 text-xs font-medium">No enquiry history found.</td>
                          </tr>
                        ) : (
                          currentItems.map((item, index) => (
                            <tr key={item.id || index} className="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                {item.candidatePhoto ? (
                                  <a href={item.candidatePhoto} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline">PHOTO</a>
                                ) : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                {item.resumeCopy ? (
                                  <a href={item.resumeCopy} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline">RESUME</a>
                                ) : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.indentNo}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.candidateEnquiryNo}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.candidateName}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.applyingForPost}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.candidateDOB}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.candidatePhone}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 lowercase">{item.candidateEmail}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.previousCompany || "-"}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.jobExperience}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 uppercase">{item.department}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.previousPosition}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 italic max-w-[150px] truncate">{item.reasonOfLeaving}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.maritalStatus}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 font-medium">{item.lastSalaryDrawn}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.referenceBy || "—"}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 max-w-[200px] truncate">{item.presentAddress}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 tracking-tighter">{item.aadharNumber}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View with Embedded Pagination */}
                <div className="md:hidden flex flex-col border border-gray-300 rounded-xl overflow-hidden bg-gray-50 shadow-sm h-[calc(105vh-240px)]">
                  <div className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-hide">
                    {tableLoading ? (
                      <LoadingSpinner message="Retrieving history..." minHeight="250px" />
                    ) : filteredHistoryData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-24">
                        <p className="text-gray-500 text-lg">No history found.</p>
                      </div>
                    ) : (
                      currentItems.map((item, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 space-y-2">
                          <div className="flex justify-between items-center bg-gray-50 -mx-2.5 -mt-2.5 p-2 px-3 rounded-t-lg border-b border-gray-100 mb-1">
                            <span className="font-bold text-indigo-600 text-xs tracking-tight">{item.indentNo} / {item.candidateEnquiryNo}</span>
                            <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">{item.department}</span>
                          </div>

                          <div className="flex justify-between items-start pt-1">
                            <div>
                              <div className="text-sm font-bold text-gray-900 leading-tight">{item.candidateName}</div>
                              <div className="text-[11px] text-indigo-600 font-bold">{item.applyingForPost}</div>
                            </div>
                            <div className="flex gap-1.5">
                              {item.candidatePhoto && (
                                <a href={item.candidatePhoto} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 shadow-sm">
                                  <Upload size={12} />
                                </a>
                              )}
                              {item.resumeCopy && (
                                <a href={item.resumeCopy} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 shadow-sm">
                                  <Share size={12} />
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1 border-t border-gray-50 mt-2">
                            <div className="space-y-0.5">
                              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter block line-clamp-1">Personal Info</span>
                              <div className="text-[10px] font-semibold text-gray-700">{item.candidatePhone}</div>
                              <div className="text-[9px] text-gray-500 line-clamp-1 truncate lowercase">{item.candidateEmail}</div>
                              <div className="text-[9px] text-gray-500 font-medium">{item.candidateDOB}, {item.maritalStatus}</div>
                              <div className="text-[8px] text-gray-400 mt-0.5 font-mono">ID: {item.aadharNumber}</div>
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter block line-clamp-1">Experience</span>
                              <div className="text-[10px] font-bold text-gray-800 line-clamp-1 truncate">{item.previousCompany || "N/A"}</div>
                              <div className="text-[9px] text-gray-600">{item.jobExperience} as {item.previousPosition}</div>
                              <div className="text-[9px] text-indigo-600 font-bold">Sal: {item.lastSalaryDrawn}</div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-gray-50 text-[10px] space-y-1">
                            <div className="flex gap-2">
                              <span className="text-gray-400 font-bold uppercase text-[9px] shrink-0">Reason:</span>
                              <span className="text-gray-600 italic line-clamp-2 leading-tight">{item.reasonOfLeaving}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-gray-400 font-bold uppercase text-[9px] shrink-0">Address:</span>
                              <span className="text-gray-600 line-clamp-2 leading-tight">{item.presentAddress}</span>
                            </div>
                            {item.referenceBy && (
                              <div className="flex gap-2">
                                <span className="text-indigo-400 font-bold uppercase text-[9px] shrink-0">Ref:</span>
                                <span className="text-indigo-600 font-medium">{item.referenceBy}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Fixed Bounding Box Pagination */}
                  <div className="border-t border-gray-300 bg-white px-2 py-2 flex justify-center sticky bottom-0">
                    {renderPaginationNav()}
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Pagination Controls Footer (Standardized) */}
            <div className="hidden md:flex px-4 py-1.5 bg-white border-t border-gray-200 items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-4 flex-wrap">
                <p className="text-sm text-gray-700 font-medium">
                  Showing <span className="font-bold">{filteredDataCount > 0 ? indexOfFirstItem + 1 : 0}</span> to <span className="font-bold">{Math.min(indexOfLastItem, filteredDataCount)}</span> of <span className="font-bold">{filteredDataCount}</span> records
                </p>
                <div className="flex items-center gap-2 border-l border-gray-300 pl-4 h-5">
                  <label className="text-xs text-gray-500 font-medium whitespace-nowrap">Rows per page:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="text-[11px] border border-gray-200 rounded-md px-2 py-0.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white font-medium text-gray-700 outline-none transition shadow-sm"
                  >
                    {[15, 30, 50, 100].map((val) => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center w-auto justify-end gap-4">
                {renderPaginationNav()}
              </div>
            </div>
          </>
        )}
      </div>

      {showModal && selectedItem && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/20">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100 sticky top-0 bg-white z-10 transition-all">
              <div>
                <h3 className="text-lg font-extrabold text-gray-800 tracking-tight">New Candidate Enquiry</h3>
                <p className="text-[10px] text-gray-400 mt-0.5 font-medium uppercase tracking-widest">Indent: {selectedItem.indentNo}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-hide">
              {/* Section 1: Basic Identifiers */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 pb-1 border-b border-gray-50">
                  <div className="w-1 h-3 bg-indigo-600 rounded-full"></div>
                  <h4 className="text-[10px] font-black text-gray-700 uppercase tracking-wider">Identifiers</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="bg-gray-50/50 p-2 rounded-md border border-gray-100">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Indent No.</label>
                    <div className="text-xs font-black text-indigo-600">{selectedItem.indentNo}</div>
                  </div>
                  <div className="bg-gray-50/50 p-2 rounded-md border border-gray-100">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Enquiry No.</label>
                    <div className="text-xs font-black text-gray-600">{generatedCandidateNo}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1">Status*</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 bg-white font-medium"
                      required
                    >
                      <option value="NeedMore">Need More </option>
                      <option value="Complete">Complete</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1">Applying For Post</label>
                    <input
                      type="text"
                      value={selectedItem.post}
                      onChange={(e) => {
                        setSelectedItem((prev) => ({ ...prev, post: e.target.value }));
                      }}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 bg-white text-gray-600 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 bg-gray-50 text-gray-500 cursor-not-allowed"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Candidate Information */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 pb-1 border-b border-gray-50">
                  <div className="w-1 h-3 bg-indigo-600 rounded-full"></div>
                  <h4 className="text-[10px] font-black text-gray-700 uppercase tracking-wider">Personal Details</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-1.5">
                  <div className="lg:col-span-1">
                    <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Full Name*</label>
                    <input
                      type="text"
                      name="candidateName"
                      value={formData.candidateName}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Date of Birth</label>
                    <input
                      type="date"
                      name="candidateDOB"
                      value={formData.candidateDOB}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Marital Status</label>
                    <select
                      name="maritalStatus"
                      value={formData.maritalStatus}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">Select</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Phone Number*</label>
                    <input
                      type="tel"
                      name="candidatePhone"
                      value={formData.candidatePhone}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 bg-white font-medium"
                      required
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Email Address</label>
                    <input
                      type="email"
                      name="candidateEmail"
                      value={formData.candidateEmail}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 bg-white lowercase"
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Aadhar Number*</label>
                    <input
                      type="text"
                      name="aadharNo"
                      value={formData.aadharNo}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 bg-white font-mono tracking-wider"
                      required
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Current Address</label>
                    <input
                      type="text"
                      name="presentAddress"
                      value={formData.presentAddress}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Experience History */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 pb-1 border-b border-gray-50">
                  <div className="w-1 h-3 bg-indigo-600 rounded-full"></div>
                  <h4 className="text-[10px] font-black text-gray-700 uppercase tracking-wider">Professional History</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-1.5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Previous Company</label>
                    <input
                      type="text"
                      name="previousCompany"
                      value={formData.previousCompany}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Position Held</label>
                    <input
                      type="text"
                      name="previousPosition"
                      value={formData.previousPosition}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Total Experience</label>
                    <input
                      type="text"
                      name="jobExperience"
                      value={formData.jobExperience}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 bg-white"
                      placeholder="e.g. 2.5 Years"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Last Salary Drawn</label>
                    <input
                      type="text"
                      name="lastSalaryDrawn"
                      value={formData.lastSalaryDrawn}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 bg-white font-bold text-indigo-600"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Reason for Leaving</label>
                    <input
                      type="text"
                      name="reasonForLeaving"
                      value={formData.reasonForLeaving}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 bg-white italic"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Attachments */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 pb-1 border-b border-gray-50">
                  <div className="w-1 h-3 bg-indigo-600 rounded-full"></div>
                  <h4 className="text-[10px] font-black text-gray-700 uppercase tracking-wider">Documents</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border border-dashed border-gray-200 rounded-lg p-2 bg-gray-50/50">
                    <label className="block text-[9px] font-bold text-gray-400 mb-1.5 uppercase">Photo</label>
                    <div className="flex items-center gap-3">
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "candidatePhoto")} className="hidden" id="photo-upload" />
                      <label htmlFor="photo-upload" className="flex items-center px-3 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-600 hover:bg-gray-50 shadow-sm cursor-pointer">
                        <Upload size={12} className="mr-1.5 text-indigo-600" />
                        {uploadingPhoto ? "..." : "Upload"}
                      </label>
                      {formData.candidatePhoto && <Check size={12} className="text-green-500 font-bold" />}
                    </div>
                  </div>

                  <div className="border border-dashed border-gray-200 rounded-lg p-2 bg-gray-50/50">
                    <label className="block text-[9px] font-bold text-gray-400 mb-1.5 uppercase">Resume</label>
                    <div className="flex items-center gap-3">
                      <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => handleFileChange(e, "candidateResume")} className="hidden" id="resume-upload" />
                      <label htmlFor="resume-upload" className="flex items-center px-3 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-600 hover:bg-gray-50 shadow-sm cursor-pointer">
                        <Upload size={12} className="mr-1.5 text-indigo-600" />
                        {uploadingResume ? "..." : "Upload"}
                      </label>
                      {formData.candidateResume && <Check size={12} className="text-green-500 font-bold" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="flex justify-end items-center gap-2 pt-4 border-t border-gray-100 sticky bottom-0 bg-white pb-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 border border-gray-200 rounded-md text-[11px] font-bold text-gray-500 hover:bg-gray-50 transition-all"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2 bg-indigo-600 text-white rounded-md text-[11px] font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center"
                  disabled={submitting}
                >
                  {submitting ? "Processing..." : "Submit Enquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {showShareModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-300">
              <h3 className="text-lg font-medium text-gray-900">
                Share Candidate Details
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleShareSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  name="recipientName"
                  value={shareFormData.recipientName}
                  onChange={handleShareInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="recipientEmail"
                  value={shareFormData.recipientEmail}
                  onChange={handleShareInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={shareFormData.subject}
                  onChange={handleShareInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={shareFormData.message}
                  onChange={handleShareInputChange}
                  rows={5}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attached Links
                </label>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center">
                    <a
                      href="https://sbh-find-enquiry.vercel.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      Enquiry Form Link
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white bg-indigo-700 rounded-md hover:bg-indigo-800 flex items-center justify-center min-h-[42px] ${submitting ? "opacity-90 cursor-not-allowed" : ""
                    }`}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    "Send Email"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Enquiry Form QR Code</h2>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center space-y-4">
              <div id="qr-code-container" className="bg-white p-4 rounded-lg border border-gray-200">
                <QRCodeSVG
                  value="https://qr-find-enquiry.vercel.app/"
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  const svgElement = document.querySelector('#qr-code-container svg');
                  if (!svgElement) return;
                  const svgData = new XMLSerializer().serializeToString(svgElement);
                  const canvas = document.createElement('canvas');
                  canvas.width = 4096;
                  canvas.height = 4096;
                  const ctx = canvas.getContext('2d');
                  const img = new Image();
                  img.onload = () => {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const link = document.createElement('a');
                    link.download = 'enquiry-form-qr.png';
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                  };
                  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center gap-1"
              >
                <Download size={16} />
                Download
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="px-4 py-2 bg-indigo-700 text-white rounded-md hover:bg-opacity-90 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindEnquiry;
