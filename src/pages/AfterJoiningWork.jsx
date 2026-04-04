import React, { useState, useEffect } from 'react';
import { Filter, Search, Clock, CheckCircle, X, Calendar, ChevronDown, Check, ChevronUp } from 'lucide-react';
import useDataStore from '../store/dataStore';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const AfterJoiningWork = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pendingData, setPendingData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [filterDepartment, setFilterDepartment] = useState("");
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const [filterDate, setFilterDate] = useState("");

  // Pagination State (Synced with CallTracker.jsx)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const [formData, setFormData] = useState({
    checkSalarySlipResume: false,
    offerLetterReceived: false,
    offerLetterImage: null,
    offerLetterImageUrl: "",
    welcomeMeeting: false,
    welcomeMeetingImage: null,
    welcomeMeetingImageUrl: "",
    biometricAccess: false,
    punchCode: "",
    officialEmailId: false,
    emailId: "",
    emailPassword: "",
    assignAssets: false,
    laptop: "",
    mobile: "",
    vehicle: "",
    other: "",
    manualImage: null,
    manualImageUrl: "",
    pfEsic: false,
    pfEsicImage: null,
    pfEsicImageUrl: "",
    companyDirectory: false,
    assets: [],
  });

  // Google Drive folder ID for storing images
  const DRIVE_FOLDER_ID = "1SEpx7Z3wuI3-jQHovPfTc8svpbcOBpuA";

  const fetchJoiningData = async () => {
    setLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec?sheet=JOINING&action=fetch"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Raw JOINING API response:", result);

      if (!result.success) {
        throw new Error(
          result.error || "Failed to fetch data from JOINING sheet"
        );
      }

      const rawData = result.data || result;

      if (!Array.isArray(rawData)) {
        throw new Error("Expected array data not received");
      }

      const headers = rawData[5];
      const dataRows = rawData.length > 6 ? rawData.slice(6) : [];

      const getIndex = (headerName) => {
        const index = headers.findIndex(
          (h) =>
            h && h.toString().trim().toLowerCase() === headerName.toLowerCase()
        );
        return index;
      };

      const processedData = dataRows.map((row) => ({
        timestamp: row[getIndex("Timestamp")] || "",
        joiningNo: row[getIndex("Joining ID")] || "",
        indentNo: row[getIndex("Indent No")] || "",
        enquiryNo: row[getIndex("Enquiry No")] || "",
        candidateName: row[getIndex("Name As Per Aadhar")] || "",
        fatherName: row[getIndex("Father / Husband name")] || "",
        dateOfJoining: row[getIndex("Date Of Joining")] || "",
        joiningPlace: row[getIndex("Joining Place")] || "",
        designation: row[getIndex("Designation")] || "",
        department: row[getIndex("Department")] || "",
        aadharPhoto: row[getIndex("Aadhar Frontside Photo")] || "",
        panCard: row[getIndex("Pan card")] || "",
        candidatePhoto: row[getIndex("Candidate's Photo")] || "",
        currentAddress: row[getIndex("Current Address")] || "",
        addressAsPerAadhar: row[getIndex("Address As Per Aadhar Card")] || "",
        bodAsPerAadhar: row[getIndex("Date Of Birth As Per Aadhar Card")] || "",
        gender: row[getIndex("Gender")] || "",
        mobileNo: row[getIndex("Mobile No.")] || "",
        familyMobileNo: row[getIndex("Family Mobile No.")] || "",
        relationWithFamily:
          row[getIndex("Relationship With Family Person")] || "",
        pfId: row[getIndex("Past Pf Id No. (If Any)")] || "",
        accountNo: row[getIndex("Current Bank A.C No.")] || "",
        ifscCode: row[getIndex("Ifsc Code")] || "",
        branchName: row[getIndex("Branch Name")] || "",
        passbookPhoto: row[getIndex("Photo Of Front Bank Passbook")] || "",
        email: row[getIndex("Personal Email-Id")] || "",
        esicNo: row[getIndex("ESIC No (IF Any)")] || "",
        qualification: row[getIndex("Highest Qualification")] || "",
        pfEligible: row[getIndex("PF Eligible")] || "",
        esicEligible: row[getIndex("ESIC Eligible")] || "",
        companyName: row[getIndex("Joining Company Name")] || "",
        emailToBeIssue: row[getIndex("Email ID To Be Issue")] || "",
        issueMobile: row[getIndex("Issue Mobile")] || "",
        issueLaptop: row[getIndex("Issue Laptop")] || "",
        aadharNo: row[getIndex("Aadhar Card No")] || "",
        modeOfAttendance: row[getIndex("Mode Of Attendance")] || "",
        quaficationPhoto: row[getIndex("Quafication Photo")] || "",
        paymentMode: row[getIndex("Payment Mode")] || "",
        salarySlip: row[getIndex("Salary Slip")] || "",
        resumeCopy: row[getIndex("Resume Copy")] || "",
        plannedDate: row[getIndex("Planned Date")] || "",
        actual: row[getIndex("Actual")] || "",
      }));

      const pendingTasks = processedData.filter(
        (task) => task.plannedDate && !task.actual
      );
      console.log("Processed joining data:", processedData);
      setPendingData(pendingTasks);

      const historyTasks = processedData.filter(
        (task) => task.plannedDate && task.actual
      );
      setHistoryData(historyTasks);
    } catch (error) {
      console.error("Error fetching joining data:", error);
      setError(error.message);
      toast.error(`Failed to load joining data: ${error.message}`);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  // Fetch previous assets data from Assets sheet
  const fetchAssetsData = async (employeeId) => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec?sheet=Assets&action=fetch"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        return null;
      }

      const data = result.data || result;
      if (!Array.isArray(data) || data.length < 2) {
        return null;
      }

      // Find the row with matching employee ID (column B, index 1)
      const matchingRow = data.find((row, index) => {
        if (index === 0) return false; // Skip header row
        return row[1]?.toString().trim() === employeeId?.toString().trim();
      });

      if (matchingRow) {
        return {
          punchCode: matchingRow[10] || "",
          emailId: matchingRow[3] || "",
          emailPassword: matchingRow[4] || "",
          laptop: matchingRow[5] || "",
          mobile: matchingRow[6] || "",
          vehicle: matchingRow[7] || "",
          other: matchingRow[8] || "",
          manualImageUrl: matchingRow[9] || "",
          offerLetterImageUrl: matchingRow[11] || "", // Column L
          welcomeMeetingImageUrl: matchingRow[12] || "", // Column M
          pfEsicImageUrl: matchingRow[13] || "" // Column N
        };
      }

      return null;
    } catch (error) {
      console.error("Error fetching assets data:", error);
      return null;
    }
  };


  // Upload image to Google Drive
  const uploadImageToDrive = async (file, fileName) => {
    try {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64Data = reader.result;
            const response = await fetch(
              "https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  action: "uploadFile",
                  base64Data: base64Data,
                  fileName: fileName,
                  mimeType: file.type,
                  folderId: DRIVE_FOLDER_ID,
                }).toString(),
              }
            );

            const result = await response.json();
            if (result.success) {
              resolve(result.fileUrl);
            } else {
              reject(new Error(result.error || "Upload failed"));
            }
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchJoiningData();
  }, []);

  const handleAfterJoiningClick = async (item) => {
    // Reset form data first
    setFormData({
      checkSalarySlipResume: false,
      offerLetterReceived: false,
      welcomeMeeting: false,
      biometricAccess: false,
      punchCode: "", // Initialize punch code
      officialEmailId: false,
      emailId: "",
      emailPassword: "",
      assignAssets: false,
      laptop: "",
      mobile: "",
      vehicle: "",
      other: "",
      manualImage: null,
      manualImageUrl: "",
      pfEsic: false,
      companyDirectory: false,
      assets: [],
    });

    setSelectedItem(item);
    setShowModal(true);
    setLoading(true);

    try {
      // Fetch previous assets data first
      const assetsData = await fetchAssetsData(item.joiningNo);

      const fullDataResponse = await fetch(
        "https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec?sheet=JOINING&action=fetch"
      );

      if (!fullDataResponse.ok) {
        throw new Error(`HTTP error! status: ${fullDataResponse.status}`);
      }

      const fullDataResult = await fullDataResponse.json();
      const allData = fullDataResult.data || fullDataResult;

      // Look for header row with "Joining ID" instead of "Employee ID"
      let headerRowIndex = allData.findIndex((row) =>
        row.some((cell) =>
          cell?.toString().trim().toLowerCase().includes("joining id")
        )
      );
      if (headerRowIndex === -1) headerRowIndex = 5;

      const headers = allData[headerRowIndex].map((h) => h?.toString().trim());

      // Use "Joining ID" instead of "Employee ID"
      const employeeIdIndex = headers.findIndex(
        (h) => h?.toLowerCase() === "joining id"
      );
      if (employeeIdIndex === -1) {
        throw new Error("Could not find 'Joining ID' column");
      }

      const rowIndex = allData.findIndex(
        (row, idx) =>
          idx > headerRowIndex &&
          row[employeeIdIndex]?.toString().trim() ===
          item.joiningNo?.toString().trim()
      );

      if (rowIndex === -1)
        throw new Error(`Employee ${item.joiningNo} not found`);

      // Updated column indices
      const actualColumnIndex = 27; // Column AB (0-based index: 27)
      const startColumnIndex = 29; // Column AD (0-based index: 29)

      const currentValues = {
        checkSalarySlipResume:
          allData[rowIndex][startColumnIndex] // Column AD
            ?.toString()
            .trim()
            .toLowerCase() === "yes",
        offerLetterReceived:
          allData[rowIndex][startColumnIndex + 1] // Column AE
            ?.toString()
            .trim()
            .toLowerCase() === "yes",
        welcomeMeeting:
          allData[rowIndex][startColumnIndex + 2] // Column AF
            ?.toString()
            .trim()
            .toLowerCase() === "yes",
        biometricAccess:
          allData[rowIndex][startColumnIndex + 3] // Column AG
            ?.toString()
            .trim()
            .toLowerCase() === "yes",
        officialEmailId:
          allData[rowIndex][startColumnIndex + 4] // Column AH
            ?.toString()
            .trim()
            .toLowerCase() === "yes",
        assignAssets:
          allData[rowIndex][startColumnIndex + 5] // Column AI
            ?.toString()
            .trim()
            .toLowerCase() === "yes",
        pfEsic:
          allData[rowIndex][startColumnIndex + 6] // Column AJ
            ?.toString()
            .trim()
            .toLowerCase() === "yes",
        companyDirectory:
          allData[rowIndex][startColumnIndex + 7] // Column AK
            ?.toString()
            .trim()
            .toLowerCase() === "yes",
      };

      // Merge with assets data if available
      const finalFormData = {
        ...currentValues,
        punchCode: assetsData?.punchCode || "",
        emailId: assetsData?.emailId || "",
        emailPassword: assetsData?.emailPassword || "",
        laptop: assetsData?.laptop || "",
        mobile: assetsData?.mobile || "",
        vehicle: assetsData?.vehicle || "",
        other: assetsData?.other || "",
        manualImageUrl: assetsData?.manualImageUrl || "",
        offerLetterImageUrl: assetsData?.offerLetterImageUrl || "",
        welcomeMeetingImageUrl: assetsData?.welcomeMeetingImageUrl || "",
        pfEsicImageUrl: assetsData?.pfEsicImageUrl || "",
        manualImage: null,
        offerLetterImage: null,
        welcomeMeetingImage: null,
        pfEsicImage: null,
        assets: [],
      };

      setFormData(prev => ({
        ...prev,
        ...finalFormData
      }));

    } catch (error) {
      console.error("Error fetching current values:", error);
      // Keep the default reset values if there's an error
      toast.error("Failed to load current values");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: file,
      }));
    }
  };

  // Save assets data to Assets sheet
  const saveAssetsData = async (employeeId, employeeName, assetsData) => {
    try {
      const now = new Date();
      const timestamp = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const rowData = [
        timestamp,
        employeeId,
        employeeName,
        assetsData.emailId || "",
        assetsData.emailPassword || "",
        assetsData.laptop || "",
        assetsData.mobile || "",
        assetsData.vehicle || "",
        assetsData.other || "",
        assetsData.manualImageUrl || "",
        assetsData.punchCode || "",
        assetsData.offerLetterImageUrl || "", // Column L
        assetsData.welcomeMeetingImageUrl || "", // Column M
        assetsData.pfEsicImageUrl || "" // Column N
      ];

      // First, check if record exists
      const existingData = await fetchAssetsData(employeeId);

      if (existingData) {
        // Update existing record - find the row and update it
        const fetchResponse = await fetch(
          "https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec?sheet=Assets&action=fetch"
        );
        const result = await fetchResponse.json();
        const data = result.data || result;

        const rowIndex = data.findIndex((row, index) => {
          if (index === 0) return false; // Skip header
          return row[1]?.toString().trim() === employeeId?.toString().trim();
        });

        if (rowIndex !== -1) {
          // Update existing row
          const response = await fetch(
            "https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                sheetName: "Assets",
                action: "update",
                rowIndex: (rowIndex + 1).toString(),
                rowData: JSON.stringify(rowData),
              }).toString(),
            }
          );
          return await response.json();
        }
      }

      // Insert new record
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            sheetName: "Assets",
            action: "insert",
            rowData: JSON.stringify(rowData),
          }).toString(),
        }
      );

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to save assets data: ${error.message}`);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitting(true);

    if (!selectedItem.joiningNo || !selectedItem.candidateName) {
      toast.error("Please fill all required fields");
      setSubmitting(false);
      return;
    }

    try {
      // Upload manual image if new file selected (only for company directory)
      // Upload images if new files selected
      let manualImageUrl = formData.manualImageUrl;
      let offerLetterImageUrl = formData.offerLetterImageUrl;
      let welcomeMeetingImageUrl = formData.welcomeMeetingImageUrl;
      let pfEsicImageUrl = formData.pfEsicImageUrl;

      if (formData.manualImage) {
        try {
          manualImageUrl = await uploadImageToDrive(
            formData.manualImage,
            `${selectedItem.joiningNo}_manual_${Date.now()}.${formData.manualImage.name.split('.').pop()}`
          );
        } catch (error) {
          toast.error(`Failed to upload manual image: ${error.message}`);
        }
      }

      if (formData.offerLetterImage) {
        try {
          offerLetterImageUrl = await uploadImageToDrive(
            formData.offerLetterImage,
            `${selectedItem.joiningNo}_offerletter_${Date.now()}.${formData.offerLetterImage.name.split('.').pop()}`
          );
        } catch (error) {
          toast.error(`Failed to upload offer letter image: ${error.message}`);
        }
      }

      if (formData.welcomeMeetingImage) {
        try {
          welcomeMeetingImageUrl = await uploadImageToDrive(
            formData.welcomeMeetingImage,
            `${selectedItem.joiningNo}_welcomemeeting_${Date.now()}.${formData.welcomeMeetingImage.name.split('.').pop()}`
          );
        } catch (error) {
          toast.error(`Failed to upload welcome meeting image: ${error.message}`);
        }
      }

      if (formData.pfEsicImage) {
        try {
          pfEsicImageUrl = await uploadImageToDrive(
            formData.pfEsicImage,
            `${selectedItem.joiningNo}_pfesic_${Date.now()}.${formData.pfEsicImage.name.split('.').pop()}`
          );
        } catch (error) {
          toast.error(`Failed to upload PF/ESIC image: ${error.message}`);
        }
      }

      // Save assets data
      await saveAssetsData(selectedItem.joiningNo, selectedItem.candidateName, {
        emailId: formData.emailId,
        emailPassword: formData.emailPassword,
        laptop: formData.laptop,
        mobile: formData.mobile,
        vehicle: formData.vehicle,
        other: formData.other,
        manualImageUrl: manualImageUrl,
        punchCode: formData.punchCode,
        offerLetterImageUrl: offerLetterImageUrl,
        welcomeMeetingImageUrl: welcomeMeetingImageUrl,
        pfEsicImageUrl: pfEsicImageUrl
      });

      // Continue with existing logic for updating JOINING sheet
      const fullDataResponse = await fetch(
        "https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec?sheet=JOINING&action=fetch"
      );
      if (!fullDataResponse.ok) {
        throw new Error(`HTTP error! status: ${fullDataResponse.status}`);
      }

      const fullDataResult = await fullDataResponse.json();
      const allData = fullDataResult.data || fullDataResult;
      let headerRowIndex = allData.findIndex((row) =>
        row.some((cell) =>
          cell?.toString().trim().toLowerCase().includes("joining id")
        )
      );
      if (headerRowIndex === -1) headerRowIndex = 5;

      const headers = allData[headerRowIndex].map((h) => h?.toString().trim());
      const employeeIdIndex = headers.findIndex(
        (h) => h?.toLowerCase() === "joining id"
      );
      if (employeeIdIndex === -1) {
        throw new Error("Could not find 'Joining ID' column");
      }

      const rowIndex = allData.findIndex(
        (row, idx) =>
          idx > headerRowIndex &&
          row[employeeIdIndex]?.toString().trim() ===
          selectedItem.joiningNo?.toString().trim()
      );
      if (rowIndex === -1)
        throw new Error(`Employee ${selectedItem.joiningNo} not found`);

      const now = new Date();
      // Format for display: DD/MM/YYYY
      const formattedTimestamp = `${now.getDate()}/${now.getMonth() + 1
        }/${now.getFullYear()}`;

      // Format for Google Sheets as a proper date object (YYYY-MM-DD format)
      const formattedDateForSheets = `${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

      const allFieldsYes =
        formData.checkSalarySlipResume &&
        formData.offerLetterReceived &&
        formData.welcomeMeeting &&
        formData.biometricAccess &&
        formData.officialEmailId &&
        formData.assignAssets &&
        formData.pfEsic &&
        formData.companyDirectory;

      // Updated column indices
      const actualColumnIndex = 27; // Column AB (0-based index: 27)
      const startColumnIndex = 29; // Column AD (0-based index: 29)

      const updatePromises = [];

      if (allFieldsYes) {
        updatePromises.push(
          fetch(
            "https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                sheetName: "JOINING",
                action: "updateCell",
                rowIndex: (rowIndex + 1).toString(),
                columnIndex: (actualColumnIndex + 1).toString(), // Column AB
                value: formattedDateForSheets, // Send as YYYY-MM-DD format
              }).toString(),
            }
          )
        );
      }

      const fields = [
        { value: formData.checkSalarySlipResume ? "Yes" : "No", offset: 0 }, // Column AD
        { value: formData.offerLetterReceived ? "Yes" : "No", offset: 1 }, // Column AE
        { value: formData.welcomeMeeting ? "Yes" : "No", offset: 2 }, // Column AF
        { value: formData.biometricAccess ? "Yes" : "No", offset: 3 }, // Column AG
        { value: formData.officialEmailId ? "Yes" : "No", offset: 4 }, // Column AH
        { value: formData.assignAssets ? "Yes" : "No", offset: 5 }, // Column AI
        { value: formData.pfEsic ? "Yes" : "No", offset: 6 }, // Column AJ
        { value: formData.companyDirectory ? "Yes" : "No", offset: 7 }, // Column AK
      ];

      fields.forEach((field) => {
        updatePromises.push(
          fetch(
            "https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                sheetName: "JOINING",
                action: "updateCell",
                rowIndex: (rowIndex + 1).toString(),
                columnIndex: (startColumnIndex + field.offset + 1).toString(),
                value: field.value,
              }).toString(),
            }
          )
        );
      });

      const responses = await Promise.all(updatePromises);
      const results = await Promise.all(responses.map((r) => r.json()));

      const hasError = results.some((result) => !result.success);
      if (hasError) {
        console.error("Some cell updates failed:", results);
        throw new Error("Some cell updates failed");
      }

      if (allFieldsYes) {
        toast.success("All conditions met! Data saved and actual date updated successfully.");
      } else {
        toast.success(
          "Data saved successfully. Actual date will be updated when all conditions are met."
        );
      }

      setShowModal(false);
      fetchJoiningData();
    } catch (error) {
      console.error("Update error:", error);
      toast.error(`Update failed: ${error.message}`);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };


  const formatDOB = (dateString) => {
    if (!dateString) return "";

    // Handle the format "2021-11-01"
    if (dateString.includes('-')) {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const day = parts[2];
        const month = parts[1];
        const year = parts[0].slice(-2); // Get last 2 digits of year
        return `${day}/${month}/${year}`;
      }
    }

    // Fallback for other formats
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const day = date.getDate();
    const month = date.getMonth() + 1; // Months are 0-indexed, so add 1
    const year = date.getFullYear().toString().slice(-2);

    return `${day}/${month}/${year}`;
  };

  const uniqueDepartments = Array.from(
    new Set(
      [...pendingData, ...historyData]
        .map((item) => item.department)
        .filter((dept) => dept && typeof dept === 'string' && dept.trim() !== "")
    )
  ).sort();

  // Combined Filter logic synced with CallTracker.jsx
  const filterRecords = (data) => {
    return data.filter((item) => {
      const matchesSearch =
        item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.joiningNo?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment = !filterDepartment || item.department === filterDepartment;

      let matchesDate = true;
      if (filterDate) {
        // Handle various date formats (e.g. 01/11/2021 or 2021-11-01)
        const getFormattedDate = (dateStr) => {
          if (!dateStr) return "";
          if (dateStr.includes('/')) {
            const [d, m, y] = dateStr.split(' ')[0].split('/');
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          }
          try {
            return new Date(dateStr).toISOString().split('T')[0];
          } catch (e) {
            return "";
          }
        };
        const itemDate = getFormattedDate(item.dateOfJoining);
        matchesDate = itemDate === filterDate;
      }

      return matchesSearch && matchesDepartment && matchesDate;
    });
  };

  const filteredPendingData = filterRecords(pendingData);
  const filteredHistoryData = filterRecords(historyData);

  // Pagination Logic (Synced with CallTracker.jsx)
  const activeData = activeTab === "pending" ? filteredPendingData : filteredHistoryData;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = activeData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(activeData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
        }
        if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
          return <span key={pageNum} className="relative inline-flex items-center px-2 py-1 border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-700">...</span>;
        }
        return null;
      })}

      <button
        onClick={() => paginate(currentPage + 1)}
        disabled={currentPage === totalPages || totalPages === 0}
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
    <div className="space-y-4 md:space-y-6">
      {/* Header & Segmented Control */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 md:gap-4 mb-2">
        <div className="flex items-center gap-4">
          <h1 className="hidden md:block text-2xl font-bold text-gray-800 tracking-tight">After Joining Work</h1>

          {/* Segmented Tab Control (Standardized Layout) */}
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 shadow-sm self-start sm:self-center">
            <button
              onClick={() => { setActiveTab("pending"); setCurrentPage(1); }}
              className={`flex items-center gap-2 py-1.5 px-4 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === "pending"
                ? "bg-white text-indigo-600 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                }`}
            >
              <Clock size={13} />
              <span>Pending ({filteredPendingData.length})</span>
            </button>
            <button
              onClick={() => { setActiveTab("history"); setCurrentPage(1); }}
              className={`flex items-center gap-2 py-1.5 px-4 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === "history"
                ? "bg-white text-indigo-600 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                }`}
            >
              <CheckCircle size={13} />
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
                placeholder="Search candidates/ID..."
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
                  className="w-full bg-transparent focus:outline-none text-[11px] font-medium cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Main Content Container (Synced with CallTracker.jsx) */}
      <div className="overflow-hidden border border-gray-200 rounded-lg bg-white min-h-[530px] flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12 text-center">
            <LoadingSpinner message="Retrieving joining records..." minHeight="450px" />
          </div>
        ) : (
          <>
            {activeTab === "pending" && (
              <div className="flex-1 flex flex-col">
                {/* Desktop View (Table + Footer combined) */}
                <div className="hidden md:flex flex-col bg-white overflow-hidden">
                  <div className="max-h-[calc(105vh-280px)] min-h-[530px] overflow-y-auto scrollbar-hide">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Action</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Joining ID</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Name</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Father Name</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Joining Date</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Designation</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Department</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {tableLoading ? (
                          <tr>
                            <td colSpan="7" className="px-4 py-1">
                              <LoadingSpinner message="Scanning records..." minHeight="300px" />
                            </td>
                          </tr>
                        ) : error ? (
                          <tr>
                            <td colSpan="7" className="px-4 py-12 text-center">
                              <p className="text-rose-500 text-xs font-bold mb-2">Error: {error}</p>
                              <button onClick={fetchJoiningData} className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded text-xs font-bold shadow-sm">Retry</button>
                            </td>
                          </tr>
                        ) : currentItems.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="px-4 py-24 text-center">
                              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest leading-loose">No pending work found.</p>
                            </td>
                          </tr>
                        ) : (
                          currentItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <button
                                  onClick={() => handleAfterJoiningClick(item)}
                                  className="bg-indigo-600 text-white px-3 py-1 rounded-md text-xs hover:bg-indigo-700 transition-all shadow-sm active:scale-95 font-bold"
                                >
                                  Process
                                </button>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">{item.joiningNo}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600 font-bold">{item.candidateName}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.fatherName}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 font-medium tracking-tight">{formatDOB(item.dateOfJoining)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.designation}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-[11px] font-bold text-indigo-600 uppercase tracking-tighter bg-indigo-50/30 rounded-full py-1 h-fit">{item.department}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Desktop Pagination Footer */}
                  <div className="px-4 py-3 bg-white border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-6 flex-wrap">
                      <p className="text-[13px] text-gray-600 font-medium tracking-wide">
                        Showing <span className="font-bold text-gray-900">{activeData.length > 0 ? indexOfFirstItem + 1 : 0}</span> to <span className="font-bold text-gray-900">{Math.min(indexOfLastItem, activeData.length)}</span> of <span className="font-bold text-gray-900">{activeData.length}</span> records
                      </p>
                      <div className="flex items-center gap-2 h-5 text-gray-400">
                        <label className="text-[12px] font-bold uppercase tracking-widest whitespace-nowrap">Rows:</label>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="text-xs bg-transparent font-bold text-indigo-600 outline-none cursor-pointer"
                        >
                          {[15, 30, 50, 100].map((val) => (
                            <option key={val} value={val}>{val}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center w-auto justify-end">
                      {renderPaginationNav()}
                    </div>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden flex flex-col h-[calc(100vh-240px)]">
                  <div className="flex-1 p-2 space-y-3 overflow-y-auto scrollbar-hide">
                    {currentItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-24">
                        <p className="text-gray-500 text-lg">No pending work found.</p>
                      </div>
                    ) : (
                      currentItems.map((item, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 space-y-1.5 hover:border-indigo-200 transition-colors">
                          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-indigo-600 text-sm">#{item.joiningNo}</span>
                              <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-medium uppercase tracking-wider">{item.department}</span>
                            </div>
                            <button
                              onClick={() => handleAfterJoiningClick(item)}
                              className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-bold shadow-sm active:scale-95 transition-transform"
                            >
                              Process
                            </button>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-800 tracking-tight">{item.candidateName}</div>
                            <div className="text-xs text-gray-600 mt-0.5 tracking-tight font-medium">Designation: {item.designation}</div>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1 border-t border-gray-50 mt-1">
                            <span>Joining: {formatDOB(item.dateOfJoining)}</span>
                            <span className="truncate max-w-[120px]">{item.fatherName}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t border-gray-300 bg-white px-2 py-2 flex justify-center sticky bottom-0">
                    {renderPaginationNav()}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="flex-1 flex flex-col">
                {/* Desktop History View */}
                <div className="hidden md:flex flex-col bg-white overflow-hidden">
                  <div className="max-h-[calc(105vh-280px)] min-h-[530px] overflow-y-auto scrollbar-hide">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Joining ID</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Name</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Designation</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Joining Date</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {currentItems.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-4 py-24 text-center">
                              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest leading-loose">No history found.</p>
                            </td>
                          </tr>
                        ) : (
                          currentItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">{item.joiningNo}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600 font-bold">{item.candidateName}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.designation}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 font-medium tracking-tight tracking-tight">{formatDOB(item.dateOfJoining)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest border border-green-200">
                                  Completed
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Desktop Pagination Footer */}
                  <div className="px-4 py-3 bg-white border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-6 flex-wrap">
                      <p className="text-[13px] text-gray-600 font-medium tracking-wide">
                        Showing <span className="font-bold text-gray-900">{activeData.length > 0 ? indexOfFirstItem + 1 : 0}</span> to <span className="font-bold text-gray-900">{Math.min(indexOfLastItem, activeData.length)}</span> of <span className="font-bold text-gray-900">{activeData.length}</span> records
                      </p>
                    </div>
                    <div className="flex items-center w-auto justify-end">
                      {renderPaginationNav()}
                    </div>
                  </div>
                </div>

                {/* Mobile History View */}
                <div className="md:hidden flex flex-col h-[calc(100vh-240px)]">
                  <div className="flex-1 p-2 space-y-3 overflow-y-auto scrollbar-hide">
                    {currentItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-24">
                        <p className="text-gray-500 text-lg">No history found.</p>
                      </div>
                    ) : (
                      currentItems.map((item, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 space-y-1.5">
                          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                            <span className="font-bold text-indigo-600 text-sm">#{item.joiningNo}</span>
                            <span className="bg-green-100 text-green-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Completed</span>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-800 tracking-tight">{item.candidateName}</div>
                            <div className="text-xs text-gray-600 mt-0.5 tracking-tight font-medium">{item.designation}</div>
                          </div>
                          <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-50">
                            Joining: {formatDOB(item.dateOfJoining)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t border-gray-300 bg-white px-2 py-2 flex justify-center sticky bottom-0">
                    {renderPaginationNav()}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Checklist Modal - Premium Redesign */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/20 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 tracking-tight">
                After Joining Work Checklist
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Joining ID
                  </label>
                  <input
                    type="text"
                    value={selectedItem.joiningNo}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={selectedItem.candidateName}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-md font-medium text-gray-500">
                  Checklist Items
                </h4>

                {/* Check Salary Slip & Resume */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="checkSalarySlipResume"
                    checked={formData.checkSalarySlipResume}
                    onChange={() =>
                      handleCheckboxChange("checkSalarySlipResume")
                    }
                    className="h-4 w-4 text-gray-500 focus:ring-blue-500 border-gray-300 rounded bg-white"
                  />
                  <label
                    htmlFor="checkSalarySlipResume"
                    className="ml-2 text-sm text-gray-500"
                  >
                    Check Salary Slip & Resume Copy
                  </label>
                </div>

                {/* Offer Letter Received with image upload */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="offerLetterReceived"
                      checked={formData.offerLetterReceived}
                      onChange={() =>
                        handleCheckboxChange("offerLetterReceived")
                      }
                      className="h-4 w-4 text-gray-500 focus:ring-blue-500 border-gray-300 rounded bg-white"
                    />
                    <label
                      htmlFor="offerLetterReceived"
                      className="ml-2 text-sm text-gray-500"
                    >
                      Offer Letter Received
                    </label>
                  </div>

                  {formData.offerLetterReceived && (
                    <div className="mt-2 ml-6 p-3 bg-gray-50 rounded-md">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-500">
                          Offer Letter Document
                        </label>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input
                              type="file"
                              id="offerLetterImage"
                              accept="image/*"
                              onChange={(e) =>
                                handleImageUpload(e, "offerLetterImage")
                              }
                              className="hidden"
                            />
                            <label
                              htmlFor="offerLetterImage"
                              className="cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center"
                            >
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                ></path>
                              </svg>
                              {formData.offerLetterImage
                                ? "Change Document"
                                : formData.offerLetterImageUrl
                                  ? "Replace Document"
                                  : "Upload Document"}
                            </label>
                          </div>
                          {formData.offerLetterImageUrl &&
                            !formData.offerLetterImage && (
                              <div className="mt-2">
                                <img
                                  src={formData.offerLetterImageUrl}
                                  alt="Existing Offer Letter"
                                  className="h-32 w-full object-contain rounded border"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Current offer letter document
                                </p>
                              </div>
                            )}
                          {formData.offerLetterImage && (
                            <div className="mt-2">
                              <img
                                src={URL.createObjectURL(
                                  formData.offerLetterImage
                                )}
                                alt="New Offer Letter"
                                className="h-32 w-full object-contain rounded border"
                              />
                              <p className="text-xs text-green-600 mt-1">
                                New document selected
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Welcome Meeting with image upload */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="welcomeMeeting"
                      checked={formData.welcomeMeeting}
                      onChange={() => handleCheckboxChange("welcomeMeeting")}
                      className="h-4 w-4 text-gray-500 focus:ring-blue-500 border-gray-300 rounded bg-white"
                    />
                    <label
                      htmlFor="welcomeMeeting"
                      className="ml-2 text-sm text-gray-500"
                    >
                      Welcome Meeting
                    </label>
                  </div>

                  {formData.welcomeMeeting && (
                    <div className="mt-2 ml-6 p-3 bg-gray-50 rounded-md">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-500">
                          Welcome Meeting Photo
                        </label>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input
                              type="file"
                              id="welcomeMeetingImage"
                              accept="image/*"
                              onChange={(e) =>
                                handleImageUpload(e, "welcomeMeetingImage")
                              }
                              className="hidden"
                            />
                            <label
                              htmlFor="welcomeMeetingImage"
                              className="cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center"
                            >
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                ></path>
                              </svg>
                              {formData.welcomeMeetingImage
                                ? "Change Photo"
                                : formData.welcomeMeetingImageUrl
                                  ? "Replace Photo"
                                  : "Upload Photo"}
                            </label>
                          </div>
                          {formData.welcomeMeetingImageUrl &&
                            !formData.welcomeMeetingImage && (
                              <div className="mt-2">
                                <img
                                  src={formData.welcomeMeetingImageUrl}
                                  alt="Existing Welcome Meeting"
                                  className="h-32 w-full object-contain rounded border"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Current welcome meeting photo
                                </p>
                              </div>
                            )}
                          {formData.welcomeMeetingImage && (
                            <div className="mt-2">
                              <img
                                src={URL.createObjectURL(
                                  formData.welcomeMeetingImage
                                )}
                                alt="New Welcome Meeting"
                                className="h-32 w-full object-contain rounded border"
                              />
                              <p className="text-xs text-green-600 mt-1">
                                New photo selected
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Biometric Access */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="biometricAccess"
                    checked={formData.biometricAccess}
                    onChange={() => handleCheckboxChange("biometricAccess")}
                    className="h-4 w-4 text-gray-500 focus:ring-blue-500 border-gray-300 rounded bg-white"
                  />
                  <label
                    htmlFor="biometricAccess"
                    className="ml-2 text-sm text-gray-500"
                  >
                    Biometric Access
                  </label>
                </div>

                {formData.biometricAccess && (
                  <div className="mt-2 ml-6 p-3 bg-gray-50 rounded-md">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Punch Code
                        </label>
                        <input
                          type="text"
                          name="punchCode"
                          value={formData.punchCode}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder="Enter punch code"
                        />
                      </div>
                    </div>
                  </div>
                )}
                {/* Official Email ID Section */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="officialEmailId"
                      checked={formData.officialEmailId}
                      onChange={() => handleCheckboxChange("officialEmailId")}
                      className="h-4 w-4 text-gray-500 focus:ring-blue-500 border-gray-300 rounded bg-white"
                    />
                    <label
                      htmlFor="officialEmailId"
                      className="ml-2 text-sm text-gray-500"
                    >
                      Official Email ID
                    </label>
                  </div>

                  {formData.officialEmailId && (
                    <div className="mt-2 ml-6 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-md">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Email ID
                        </label>
                        <input
                          type="text"
                          name="emailId"
                          value={formData.emailId}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder="Enter email ID"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          name="emailPassword"
                          value={formData.emailPassword}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder="Enter password"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="assignAssets"
                    checked={formData.assignAssets}
                    onChange={() => handleCheckboxChange("assignAssets")}
                    className="h-4 w-4 text-gray-500 focus:ring-blue-500 border-gray-300 rounded bg-white"
                  />
                  <label
                    htmlFor="assignAssets"
                    className="ml-2 text-sm text-gray-500"
                  >
                    Assign Assets
                  </label>
                </div>
                {formData.assignAssets && (
                  <div className="mt-2 ml-6 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-md">
                    {[
                      { id: "laptop", label: "Laptop" },
                      { id: "mobile", label: "Mobile" },
                      { id: "vehicle", label: "Vehicle" },
                      { id: "other", label: "SIM" },
                    ].map((asset) => (
                      <div key={asset.id} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-500">
                          {asset.label}
                        </label>
                        <input
                          type="text"
                          name={asset.id}
                          value={formData[asset.id]}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder={`Enter ${asset.label} details`}
                        />
                      </div>
                    ))}
                  </div>
                )}
                {/* PF / ESIC with image upload */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="pfEsic"
                      checked={formData.pfEsic}
                      onChange={() => handleCheckboxChange("pfEsic")}
                      className="h-4 w-4 text-gray-500 focus:ring-blue-500 border-gray-300 rounded bg-white"
                    />
                    <label
                      htmlFor="pfEsic"
                      className="ml-2 text-sm text-gray-500"
                    >
                      PF / ESIC
                    </label>
                  </div>

                  {formData.pfEsic && (
                    <div className="mt-2 ml-6 p-3 bg-gray-50 rounded-md">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-500">
                          PF / ESIC Document
                        </label>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input
                              type="file"
                              id="pfEsicImage"
                              accept="image/*"
                              onChange={(e) =>
                                handleImageUpload(e, "pfEsicImage")
                              }
                              className="hidden"
                            />
                            <label
                              htmlFor="pfEsicImage"
                              className="cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center"
                            >
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                ></path>
                              </svg>
                              {formData.pfEsicImage
                                ? "Change Document"
                                : formData.pfEsicImageUrl
                                  ? "Replace Document"
                                  : "Upload Document"}
                            </label>
                          </div>
                          {formData.pfEsicImageUrl && !formData.pfEsicImage && (
                            <div className="mt-2">
                              <img
                                src={formData.pfEsicImageUrl}
                                alt="Existing PF/ESIC"
                                className="h-32 w-full object-contain rounded border"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Current PF/ESIC document
                              </p>
                            </div>
                          )}
                          {formData.pfEsicImage && (
                            <div className="mt-2">
                              <img
                                src={URL.createObjectURL(formData.pfEsicImage)}
                                alt="New PF/ESIC"
                                className="h-32 w-full object-contain rounded border"
                              />
                              <p className="text-xs text-green-600 mt-1">
                                New document selected
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Company Directory Section */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="companyDirectory"
                      checked={formData.companyDirectory}
                      onChange={() => handleCheckboxChange("companyDirectory")}
                      className="h-4 w-4 text-gray-500 focus:ring-blue-500 border-gray-300 rounded bg-white"
                    />
                    <label
                      htmlFor="companyDirectory"
                      className="ml-2 text-sm text-gray-500"
                    >
                      Company Directory
                    </label>
                  </div>

                  {formData.companyDirectory && (
                    <div className="mt-2 ml-6 p-3 bg-gray-50 rounded-md">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-500">
                          Manual
                        </label>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input
                              type="file"
                              id="manualImage"
                              accept="image/*"
                              onChange={(e) =>
                                handleImageUpload(e, "manualImage")
                              }
                              className="hidden"
                            />
                            <label
                              htmlFor="manualImage"
                              className="cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center"
                            >
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                ></path>
                              </svg>
                              {formData.manualImage
                                ? "Change Manual"
                                : formData.manualImageUrl
                                  ? "Replace Manual"
                                  : "Upload Manual"}
                            </label>
                          </div>
                          {/* Show existing manual image if available */}
                          {formData.manualImageUrl && !formData.manualImage && (
                            <div className="mt-2">
                              <img
                                src={formData.manualImageUrl}
                                alt="Existing Manual"
                                className="h-32 w-full object-contain rounded border"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Current manual image
                              </p>
                            </div>
                          )}
                          {/* Show new selected manual image preview */}
                          {formData.manualImage && (
                            <div className="mt-2">
                              <img
                                src={URL.createObjectURL(formData.manualImage)}
                                alt="New Manual"
                                className="h-32 w-full object-contain rounded border"
                              />
                              <p className="text-xs text-green-600 mt-1">
                                New manual image selected
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white bg-indigo-700 rounded-md hover:bg-indigo-800 min-h-[42px] flex items-center justify-center ${submitting ? "opacity-90 cursor-not-allowed" : ""
                    }`}
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="flex items-center">
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
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AfterJoiningWork;