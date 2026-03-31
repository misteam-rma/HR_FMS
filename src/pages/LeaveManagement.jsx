import React, { useState, useEffect } from 'react';
import { Search, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const LeaveManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [rejectedLeaves, setRejectedLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [actionInProgress, setActionInProgress] = useState(null);
  const [editableDates, setEditableDates] = useState({ from: "", to: "" });
  const [hodNames, setHodNames] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    department: "",
    hodName: "",
    substitute: "",
    leaveDays: "",
    leaveType: "",
    fromDate: "",
    toDate: "",
    reason: "",
  });

  // Debug function to check leave data
  const debugLeaveData = () => {
    console.log("Debug - Approved Leaves Data:");
    approvedLeaves.forEach((leave, index) => {
      console.log(`${index + 1}. Employee: ${leave.employeeName}, Type: "${leave.leaveType}", Days: ${leave.leaveDays}, Year: ${new Date(leave.startDate.split("/").reverse().join("-")).getFullYear()}`);
    });
  };

  const calculateLeaveStats = () => {
    const currentYear = new Date().getFullYear();

    // Filter leaves based on selected employee and approved status
    const relevantLeaves =
      selectedEmployee === "all"
        ? approvedLeaves
        : approvedLeaves.filter(
          (leave) => leave.employeeName === selectedEmployee
        );

    // Debug: Log what we're working with
    console.log(`Calculating stats for ${selectedEmployee === "all" ? "all employees" : selectedEmployee}`);
    console.log(`Relevant leaves count: ${relevantLeaves.length}`);
    console.log(`Current year: ${currentYear}`);

    // Reset all counters
    let casualLeaveTaken = 0;
    let earnedLeaveTaken = 0;
    let sickLeaveTaken = 0;
    let restrictedHolidayTaken = 0;

    // Process each leave
    relevantLeaves.forEach((leave) => {
      try {
        // Parse the date
        const startDateParts = leave.startDate?.split('/');
        if (!startDateParts || startDateParts.length !== 3) return;

        const leaveYear = parseInt(startDateParts[2]);
        if (isNaN(leaveYear) || leaveYear !== currentYear) return;

        // Get leave type (lowercase and trimmed)
        const leaveType = leave.leaveType ? leave.leaveType.toLowerCase().trim() : "";
        const leaveDays = leave.leaveDays ? parseInt(leave.leaveDays) : 0;

        if (isNaN(leaveDays) || leaveDays <= 0) return;

        // Debug log for each leave
        console.log(`Processing: ${leave.employeeName} - Type: "${leaveType}", Days: ${leaveDays}, Year: ${leaveYear}`);

        // Check for casual leave (various formats)
        if (leaveType.includes("casual") ||
          leaveType === "casual leave" ||
          leaveType === "casual" ||
          leaveType === "cl") {
          casualLeaveTaken += leaveDays;
          console.log(`Added to Casual: ${leaveDays} days (${leaveType})`);
        }
        // Check for earned leave (various formats)
        else if (leaveType.includes("earned") ||
          leaveType === "earned leave" ||
          leaveType === "earned" ||
          leaveType === "el") {
          earnedLeaveTaken += leaveDays;
          console.log(`Added to Earned: ${leaveDays} days (${leaveType})`);
        }
        // Check for sick leave (various formats)
        else if (leaveType.includes("sick") ||
          leaveType === "sick leave" ||
          leaveType === "sick" ||
          leaveType === "sl") {
          sickLeaveTaken += leaveDays;
          console.log(`Added to Sick: ${leaveDays} days (${leaveType})`);
        }
        // Check for restricted holiday (various formats)
        else if (leaveType.includes("restricted") ||
          leaveType === "restricted holiday" ||
          leaveType === "restricted" ||
          leaveType === "rh" ||
          leaveType.includes("restricted holiday")) {
          restrictedHolidayTaken += leaveDays;
          console.log(`Added to Restricted Holiday: ${leaveDays} days (${leaveType})`);
        }
      } catch (error) {
        console.error(`Error processing leave for ${leave.employeeName}:`, error);
      }
    });

    const totalLeave =
      casualLeaveTaken +
      earnedLeaveTaken +
      sickLeaveTaken +
      restrictedHolidayTaken;

    console.log(`Final Stats - Casual: ${casualLeaveTaken}, Earned: ${earnedLeaveTaken}, Sick: ${sickLeaveTaken}, Restricted: ${restrictedHolidayTaken}, Total: ${totalLeave}`);

    return {
      casualLeave: casualLeaveTaken,
      earnedLeave: earnedLeaveTaken,
      sickLeave: sickLeaveTaken,
      restrictedHoliday: restrictedHolidayTaken,
      totalLeave: totalLeave,
    };
  };

  const leaveStats = calculateLeaveStats();

  // Get unique employee names for dropdown
  const uniqueEmployeeNames = [
    "all",
    ...new Set([
      ...pendingLeaves.map((leave) => leave.employeeName),
      ...approvedLeaves.map((leave) => leave.employeeName),
      ...rejectedLeaves.map((leave) => leave.employeeName),
    ]),
  ].filter(name => name && name !== "all");

  const fetchHodNames = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec?sheet=Master&action=fetch"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch HOD data");
      }

      const rawData = result.data || result;

      if (!Array.isArray(rawData)) {
        throw new Error("Expected array data not received");
      }

      // Extract HOD names from Column A (index 0), skip header row
      const hodData = rawData
        .slice(1)
        .map((row) => row[0]?.toString().trim())
        .filter((name) => name);

      setHodNames([...new Set(hodData)]); // Remove duplicates
    } catch (error) {
      console.error("Error fetching HOD data:", error);
      toast.error(`Failed to load HOD data: ${error.message}`);

      // Fallback to default HOD names if fetch fails
      setHodNames(["Deepak", "Vikas", "Dharam", "Pratap", "Aubhav"]);
    }
  };

  useEffect(() => {
    fetchLeaveData();
    fetchEmployees();
    fetchHodNames();
  }, []);

  useEffect(() => {
    // Debug the leave stats whenever approvedLeaves changes
    debugLeaveData();
  }, [approvedLeaves]);

  const handleCheckboxChange = (leaveId, rowData) => {
    if (selectedRow?.serialNo === leaveId) {
      setSelectedRow(null);
      setEditableDates({ from: "", to: "" });
    } else {
      // Convert MM/DD/YYYY to YYYY-MM-DD for date input
      const formatForInput = (dateStr) => {
        if (!dateStr) return "";
        if (dateStr.includes("/")) {
          const [month, day, year] = dateStr.split("/");
          return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }
        return dateStr;
      };

      setSelectedRow(rowData);
      setEditableDates({
        from: formatForInput(rowData.startDate),
        to: formatForInput(rowData.endDate),
      });
    }
  };

  const handleDateChange = (field, value) => {
    setEditableDates((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Fetch employees from JOINING sheet
  // Fetch employees from JOINING sheet
  const fetchEmployees = async () => {
    try {
      // Using a different approach - add timestamp to prevent caching issues
      const timestamp = new Date().getTime();
      const url = `https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec?sheet=JOINING&action=fetch&t=${timestamp}`;

      console.log("Fetching employees from:", url);

      // Use fetch with mode 'cors' and handle CORS errors gracefully
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors', // Try with cors mode
        cache: 'no-cache', // Don't cache
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        // Try alternative approach if the first fails
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      console.log("Raw response:", text.substring(0, 500)); // Log first 500 chars

      let result;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        throw new Error("Invalid JSON response from server");
      }

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch employee data");
      }

      const rawData = result.data || result;

      if (!Array.isArray(rawData)) {
        throw new Error("Expected array data not received");
      }

      // Data starts from row 7 (index 6)
      const employeeData = rawData
        .slice(6)
        .map((row, index) => ({
          id: row[1] || "", // Column B (Employee ID)
          name: row[2] || "", // Column E (Employee Name)
          department: row[20] || "", // Column U (Department)
          columnY: row[24] || "", // Column Y (index 24)
          rowIndex: index + 7, // Actual row number in sheet
        }))
        .filter(
          (emp) => emp.name && emp.id && !emp.columnY // Only include employees where Column Y is empty
        );

      console.log(`Loaded ${employeeData.length} employees`);
      setEmployees(employeeData);

    } catch (error) {
      console.error("Error fetching employee data:", error);

      // Fallback to static data if fetch fails
      toast.error(`Failed to load employee data. Using offline mode.`);

      // Set default/fallback employee data
      const fallbackEmployees = [
        { id: "EMP001", name: "John Doe", department: "IT" },
        { id: "EMP002", name: "Jane Smith", department: "HR" },
        { id: "EMP003", name: "Bob Johnson", department: "Finance" },
        { id: "EMP004", name: "Alice Brown", department: "Operations" },
      ];

      setEmployees(fallbackEmployees);
    }
  };

  // Handle employee selection
  const handleEmployeeChange = (selectedName) => {
    const selectedEmployee = employees.find((emp) => emp.name === selectedName);

    if (selectedEmployee) {
      setFormData((prev) => ({
        ...prev,
        employeeName: selectedName,
        employeeId: selectedEmployee.id,
        department: selectedEmployee.department,
        hodName: "", // Reset HOD name when employee changes
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        employeeName: selectedName,
        employeeId: "",
        department: "",
        hodName: "",
      }));
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "employeeName") {
      handleEmployeeChange(value);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Calculate days between dates
  const calculateDays = (startDateStr, endDateStr) => {
    if (!startDateStr || !endDateStr) return 0;

    let startDate, endDate;

    // Handle different date formats
    if (startDateStr.includes("/")) {
      const [startDay, startMonth, startYear] = startDateStr
        .split("/")
        .map(Number);
      startDate = new Date(startYear, startMonth - 1, startDay);
    } else {
      startDate = new Date(startDateStr);
    }

    if (endDateStr.includes("/")) {
      const [endDay, endMonth, endYear] = endDateStr.split("/").map(Number);
      endDate = new Date(endYear, endMonth - 1, endDay);
    } else {
      endDate = new Date(endDateStr);
    }

    const diffTime = endDate - startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const formatDOB = (dateString) => {
    if (!dateString) return "";

    // If date is already in MM/DD/YYYY format, return as-is
    if (dateString.includes("/")) {
      const parts = dateString.split("/");
      if (parts.length === 3) {
        const month = parseInt(parts[0]);
        const day = parseInt(parts[1]);
        const year = parseInt(parts[2]);

        // Check if it's already in MM/DD/YYYY format (month should be <= 12, day <= 31)
        if (month <= 12 && day <= 31 && parts[2].length === 4) {
          // Ensure proper format MM/DD/YYYY
          return `${month}/${day}/${year}`;
        }
        // Check if it's in DD/MM/YYYY format and needs conversion
        else if (day <= 12 && month <= 31 && parts[2].length === 4) {
          // Convert from DD/MM/YYYY to MM/DD/YYYY
          return `${day}/${month}/${year}`;
        }
      }
    }

    // Convert from YYYY-MM-DD (date input format) to MM/DD/YYYY
    if (dateString.includes("-")) {
      const [year, month, day] = dateString.split("-");
      return `${parseInt(month)}/${parseInt(day)}/${year}`;
    }

    return dateString;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.employeeName ||
      !formData.leaveType ||
      !formData.fromDate ||
      !formData.toDate ||
      !formData.reason ||
      !formData.hodName
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      const now = new Date();

      // Format timestamp as DD/MM/YYYY HH:MM:SS (don't change this)
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const formattedTimestamp = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;

      const rowData = [
        formattedTimestamp, // Timestamp in DD/MM/YYYY HH:MM:SS format
        "", // Serial number (empty for auto-increment)
        formData.employeeId, // Employee ID - index 2
        formData.employeeName, // Employee Name - index 3
        formatDOB(formData.fromDate), // Leave Date Start - in MM/DD/YYYY format
        formatDOB(formData.toDate), // Leave Date End - in MM/DD/YYYY format
        formData.reason, // Reason (Column G, index 6)
        "Pending", // Status (Column H, index 7)
        formData.leaveType, // Leave Type (Column I, index 8)
        formData.hodName, // HOD Name (Column J, index 9)
        formData.department, // Department (Column K, index 10)
        formData.substitute, // Substitute (Column L, index 11)
        calculateDays(formData.fromDate, formData.toDate), // Leave Days (Column M, index 12)
      ];

      console.log("Submitting leave request with dates:", {
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        formattedFrom: rowData[4],
        formattedTo: rowData[5],
        timestamp: rowData[0]
      });

      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec",
        {
          method: "POST",
          body: new URLSearchParams({
            sheetName: "Leave Management",
            action: "insert",
            rowData: JSON.stringify(rowData),
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Leave Request submitted successfully!");
        setFormData({
          employeeId: "",
          employeeName: "",
          department: "",
          hodName: "",
          substitute: "",
          leaveDays: "",
          leaveType: "",
          fromDate: "",
          toDate: "",
          reason: "",
        });
        setShowModal(false);
        // Refresh the data
        fetchLeaveData();
      } else {
        toast.error("Failed to insert: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Insert error:", error);
      toast.error("Something went wrong!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveAction = async (action) => {
    if (!selectedRow) {
      toast.error("Please select a leave request");
      return;
    }

    setActionInProgress(action);
    setLoading(true);

    try {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, "0");
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const year = today.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;

      // Prepare the update payload
      const updateData = {
        sheetName: "Leave Management",
        action: "updateCell",
        rowIndex: selectedRow.rowIndex,
      };

      // Update Column A (timestamp)
      const timestampPayload = {
        ...updateData,
        columnIndex: 1,
        value: formattedDate
      };

      const timestampResponse = await fetch(
        "https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams(timestampPayload).toString(),
        }
      );

      const timestampResult = await timestampResponse.json();
      if (!timestampResult.success) {
        throw new Error("Failed to update timestamp");
      }

      let newStartDate = selectedRow.startDate;
      let newEndDate = selectedRow.endDate;

      // Update Column E (start date) if changed
      if (editableDates.from && editableDates.from !== selectedRow.startDate) {
        newStartDate = formatDOB(editableDates.from);
        const startDatePayload = {
          ...updateData,
          columnIndex: 5,
          value: newStartDate
        };

        const startDateResponse = await fetch(
          "https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(startDatePayload).toString(),
          }
        );

        const startDateResult = await startDateResponse.json();
        if (!startDateResult.success) {
          throw new Error("Failed to update start date");
        }
      }

      // Update Column F (end date) if changed
      if (editableDates.to && editableDates.to !== selectedRow.endDate) {
        newEndDate = formatDOB(editableDates.to);
        const endDatePayload = {
          ...updateData,
          columnIndex: 6,
          value: newEndDate
        };

        const endDateResponse = await fetch(
          "https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(endDatePayload).toString(),
          }
        );

        const endDateResult = await endDateResponse.json();
        if (!endDateResult.success) {
          throw new Error("Failed to update end date");
        }
      }

      // Update Column M (leave days) if dates were changed
      if ((editableDates.from && editableDates.from !== selectedRow.startDate) ||
        (editableDates.to && editableDates.to !== selectedRow.endDate)) {

        // Parse dates for calculation
        let startDate, endDate;

        // Parse start date
        if (newStartDate.includes("/")) {
          const [month, day, year] = newStartDate.split("/").map(Number);
          startDate = new Date(year, month - 1, day);
        } else {
          startDate = new Date(newStartDate);
        }

        // Parse end date
        if (newEndDate.includes("/")) {
          const [month, day, year] = newEndDate.split("/").map(Number);
          endDate = new Date(year, month - 1, day);
        } else {
          endDate = new Date(newEndDate);
        }

        // Calculate new leave days
        const diffTime = endDate - startDate;
        const newLeaveDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const leaveDaysPayload = {
          ...updateData,
          columnIndex: 13,
          value: newLeaveDays.toString()
        };

        const leaveDaysResponse = await fetch(
          "https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(leaveDaysPayload).toString(),
          }
        );

        const leaveDaysResult = await leaveDaysResponse.json();
        if (!leaveDaysResult.success) {
          throw new Error("Failed to update leave days");
        }
      }

      // Update Column H (status)
      const statusPayload = {
        ...updateData,
        columnIndex: 8,
        value: action === "accept" ? "approved" : "rejected"
      };

      const statusResponse = await fetch(
        "https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams(statusPayload).toString(),
        }
      );

      const statusResult = await statusResponse.json();
      if (!statusResult.success) {
        throw new Error("Failed to update status");
      }

      toast.success(
        `Leave ${action === "accept" ? "approved" : "rejected"} for ${selectedRow.employeeName || "employee"
        }`
      );
      fetchLeaveData();
      setSelectedRow(null);
      setEditableDates({ from: "", to: "" });

    } catch (error) {
      console.error("Update error:", error);
      toast.error(`Failed to ${action} leave: ${error.message}`);
    } finally {
      setLoading(false);
      setActionInProgress(null);
    }
  };

  const fetchLeaveData = async () => {
    setLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec?sheet=Leave Management&action=fetch"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch leave data");
      }

      const rawData = result.data || result;

      if (!Array.isArray(rawData)) {
        throw new Error("Expected array data not received");
      }

      const dataRows = rawData.length > 1 ? rawData.slice(1) : [];

      const processedData = dataRows.map((row, index) => ({
        timestamp: row[0] || "",
        serialNo: row[1] || "", // Column B (index 1) - Serial No
        employeeId: row[2] || "", // Column C (index 2) - Employee ID
        employeeName: row[3] || "", // Column D (index 3) - Employee Name
        startDate: row[4] || "",
        endDate: row[5] || "",
        remark: row[6] || "",
        status: row[7] || "", // Column H (index 7) - Status
        leaveType: row[8] || "", // Column I (index 8) - Leave Type
        hodName: row[9] || "",
        department: row[10] || "",
        substitute: row[11] || "",
        leaveDays: row[12] || "", // Column M (index 12) - Leave Days
        rowIndex: index + 2, // Store the actual row index for updates
      }));

      console.log("Fetched Data Sample:", processedData.slice(0, 3));

      // Filter based only on Column H (status)
      setPendingLeaves(
        processedData.filter(
          (leave) => leave.status?.toString().toLowerCase() === "pending"
        )
      );
      setApprovedLeaves(
        processedData.filter(
          (leave) => leave.status?.toString().toLowerCase() === "approved"
        )
      );
      setRejectedLeaves(
        processedData.filter(
          (leave) => leave.status?.toString().toLowerCase() === "rejected"
        )
      );
    } catch (error) {
      console.error("Error fetching leave data:", error);
      setError(error.message);
      toast.error(`Failed to load leave data: ${error.message}`);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";

    // If it's in MM/DD/YYYY format, return as-is
    if (dateString.includes("/")) {
      const parts = dateString.split("/");
      if (parts.length === 3 && parts[0] <= 12 && parts[2].length === 4) {
        // It's already in MM/DD/YYYY format
        return `${parts[0]}/${parts[1]}/${parts[2]}`;
      }
      // If it's in DD/MM/YYYY, convert to MM/DD/YYYY for display
      else if (parts.length === 3 && parts[1] <= 12 && parts[2].length === 4) {
        return `${parts[1]}/${parts[0]}/${parts[2]}`;
      }
    }

    // Fallback for other date formats
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }

    // Format as MM/DD/YYYY
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const filteredPendingLeaves = pendingLeaves.filter((item) => {
    const matchesSearch =
      item.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmployee =
      selectedEmployee === "all" || item.employeeName === selectedEmployee;
    return matchesSearch && matchesEmployee;
  });

  const filteredRejectedLeaves = rejectedLeaves.filter((item) => {
    const matchesSearch =
      item.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmployee =
      selectedEmployee === "all" || item.employeeName === selectedEmployee;
    return matchesSearch && matchesEmployee;
  });

  const filteredApprovedLeaves = approvedLeaves.filter((item) => {
    const matchesSearch =
      item.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmployee =
      selectedEmployee === "all" || item.employeeName === selectedEmployee;
    return matchesSearch && matchesEmployee;
  });

  const leaveTypes = [
    "Casual Leave",
    "Earned Leave",
    "Sick Leave",
    "Restricted Holiday",
  ];

  const renderPendingLeavesTable = () => (
    <table className="min-w-full divide-y divide-white">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Select
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Employee ID
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Name
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            From
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            To
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Days
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Reason
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Leave Type
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            HOD Name
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white">
        {filteredPendingLeaves.length > 0 ? (
          filteredPendingLeaves.map((item, index) => (
            <tr key={index} className="hover:bg-white">
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedRow?.serialNo === item.serialNo}
                  onChange={() => handleCheckboxChange(item.serialNo, item)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.employeeId}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.employeeName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {selectedRow?.serialNo === item.serialNo ? (
                  <input
                    type="date"
                    value={editableDates.from}
                    onChange={(e) => handleDateChange("from", e.target.value)}
                    className="border rounded p-1 text-sm"
                  />
                ) : (
                  formatDate(item.startDate)
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {selectedRow?.serialNo === item.serialNo ? (
                  <input
                    type="date"
                    value={editableDates.to}
                    onChange={(e) => handleDateChange("to", e.target.value)}
                    className="border rounded p-1 text-sm"
                  />
                ) : (
                  formatDate(item.endDate)
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.leaveDays} {/* Display leaveDays from Column M */}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.remark}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.leaveType}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.hodName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleLeaveAction("accept")}
                    disabled={
                      !selectedRow ||
                      selectedRow.serialNo !== item.serialNo ||
                      loading
                    }
                    className={`px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 min-h-[42px] flex items-center justify-center ${!selectedRow ||
                        selectedRow.serialNo !== item.serialNo ||
                        loading
                        ? "opacity-75 cursor-not-allowed"
                        : ""
                      }`}
                  >
                    {loading &&
                      selectedRow?.serialNo === item.serialNo &&
                      actionInProgress === "accept" ? (
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
                        <span>Accepting...</span>
                      </div>
                    ) : (
                      "Accept"
                    )}
                  </button>
                  <button
                    onClick={() => handleLeaveAction("rejected")}
                    disabled={
                      selectedRow?.serialNo !== item.serialNo || loading
                    }
                    className={`px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 min-h-[42px] flex items-center justify-center ${selectedRow?.serialNo !== item.serialNo ||
                        (loading && actionInProgress === "accept")
                        ? "opacity-75 cursor-not-allowed"
                        : ""
                      }`}
                  >
                    {loading &&
                      selectedRow?.serialNo === item.serialNo &&
                      actionInProgress === "rejected" ? (
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
                        <span>Rejecting...</span>
                      </div>
                    ) : (
                      "Reject"
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="9" className="px-6 py-12 text-center">
              <p className="text-gray-500">No pending leave requests found.</p>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderApprovedLeavesTable = () => (
    <>
      <table className="min-w-full divide-y divide-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Employee ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              From
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              To
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Days
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Reason
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Leave Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              HOD Name
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white">
          {filteredApprovedLeaves.length > 0 ? (
            filteredApprovedLeaves.map((item, index) => (
              <tr key={index} className="hover:bg-white">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.employeeId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.employeeName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(item.startDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(item.endDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.leaveDays} {/* Display leaveDays from Column M */}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.remark}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.leaveType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.hodName}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="px-6 py-12 text-center">
                <p className="text-gray-500">
                  No approved leave requests found.
                </p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );

  const renderRejectedLeavesTable = () => (
    <table className="min-w-full divide-y divide-white">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Employee ID
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Name
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            From
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            To
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Days
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Reason
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Leave Type
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            HOD Name
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white">
        {filteredRejectedLeaves.length > 0 ? (
          filteredRejectedLeaves.map((item, index) => (
            <tr key={index} className="hover:bg-white">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.employeeId}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.employeeName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(item.startDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(item.endDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.leaveDays} {/* Display leaveDays from Column M */}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.remark}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.leaveType}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.hodName}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="7" className="px-6 py-12 text-center">
              <p className="text-gray-500">No rejected leave requests found.</p>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderTable = () => {
    switch (activeTab) {
      case "pending":
        return renderPendingLeavesTable();
      case "approved":
        return renderApprovedLeavesTable();
      case "rejected":
        return renderRejectedLeavesTable();
      default:
        return renderPendingLeavesTable();
    }
  };

  return (
    <div className="space-y-6">
      {/* {showLeaveApproval && (
        <div className="fixed top-0 right-0 bottom-0 left-0 lg:left-64 bg-white z-50 p-6 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Leave Approval</h2>
            <button
              onClick={() => setShowLeaveApproval(false)}
              className="px-3 py-1 bg-gray-200 rounded-md"
            >
              Close
            </button>
          </div>
          <LeaveApproval />
        </div>
      )} */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leave Management</h1>
        <div className="flex space-x-2">
          {/* <button
            onClick={() => setShowLeaveApproval(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <CheckCircle size={16} className="mr-2" />
            Leave Approval
          </button> */}
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-indigo-700"
          >
            <Plus size={16} className="mr-2" />
            New Leave Request
          </button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by name or employee ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            />
          </div>
        </div>

        {/* Employee Filter for All Tabs */}
        <div className="flex items-center gap-4">
          <label
            htmlFor="employeeFilter"
            className="text-sm font-medium text-gray-700"
          >
            Filter by Employee:
          </label>
          <select
            id="employeeFilter"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Employees</option>
            {uniqueEmployeeNames.map((name, index) => (
              <option key={index} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leave Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-bold">Casual Leave</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {leaveStats.casualLeave}
              </h3>
              {selectedEmployee !== "all" && (
                <p className="text-xs text-gray-500">
                  Total Leave : <b>6</b> | Remaining :{" "}
                  <b> {6 - leaveStats.casualLeave}</b>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-bold">Earned Leave</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {leaveStats.earnedLeave}
              </h3>
              {selectedEmployee !== "all" && (
                <p className="text-xs text-gray-500">
                  Total Leave : <b>12</b> | Remaining :{" "}
                  <b> {12 - leaveStats.earnedLeave}</b>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-bold">Sick Leave</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {leaveStats.sickLeave}
              </h3>
              {selectedEmployee !== "all" && (
                <p className="text-xs text-gray-500">
                  Total Leave : <b>6</b> | Remaining :{" "}
                  <b> {6 - leaveStats.sickLeave}</b>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-bold">
                Restricted Holiday
              </p>
              <h3 className="text-2xl font-bold text-gray-800">
                {leaveStats.restrictedHoliday}
              </h3>
              {selectedEmployee !== "all" && (
                <p className="text-xs text-gray-500">
                  Total Leave : <b>2</b> | Remaining :{" "}
                  <b> {2 - leaveStats.restrictedHoliday}</b>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-bold">Total Leave</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {leaveStats.totalLeave}
              </h3>
              {selectedEmployee !== "all" && (
                <p className="text-xs text-gray-500">
                  All approved days (Current Year)
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("pending")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === "pending"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              Pending Leaves ({pendingLeaves.length})
            </button>
            <button
              onClick={() => setActiveTab("approved")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === "approved"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              Approved Leaves ({approvedLeaves.length})
            </button>
            <button
              onClick={() => setActiveTab("rejected")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === "rejected"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              Rejected Leaves ({rejectedLeaves.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            {tableLoading ? (
              <div className="px-6 py-12 text-center">
                <div className="flex justify-center flex-col items-center">
                  <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
                  <span className="text-gray-600 text-sm">
                    {loading
                      ? "Processing request..."
                      : "Loading leave data..."}
                  </span>
                </div>
              </div>
            ) : error ? (
              <div className="px-6 py-12 text-center">
                <p className="text-red-500">Error: {error}</p>
                <button
                  onClick={fetchLeaveData}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Retry
                </button>
              </div>
            ) : (
              renderTable()
            )}
          </div>
        </div>
      </div>

      {/* Modal for new leave request */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-medium">New Leave Request</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Employee ID first */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID
                </label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 focus:outline-none"
                  readOnly
                />
              </div>

              {/* Employee Name second */}
              <select
                name="employeeName"
                value={formData.employeeName}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select Employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.name}>
                    {employee.name}
                  </option>
                ))}
              </select>

              {/* Department field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 focus:outline-none"
                  readOnly
                />
              </div>

              {/* HOD Name dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  HOD Name *
                </label>
                <select
                  name="hodName"
                  value={formData.hodName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select HOD</option>
                  {hodNames.map((name, index) => (
                    <option key={index} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* New Substitute dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Substitute
                </label>
                <select
                  name="substitute"
                  value={formData.substitute}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Substitute</option>
                  {employees
                    .filter(
                      (emp) =>
                        emp.department === formData.department &&
                        emp.name !== formData.employeeName
                    )
                    .map((employee) => (
                      <option key={employee.id} value={employee.name}>
                        {employee.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Leave Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Leave Type*
                </label>
                <select
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date fields and other existing fields remain the same */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date*
                  </label>
                  <input
                    type="date"
                    name="fromDate"
                    value={formData.fromDate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date*
                  </label>
                  <input
                    type="date"
                    name="toDate"
                    value={formData.toDate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {formData.fromDate && formData.toDate && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Total Days :{" "}
                    <span className="font-semibold">
                      {calculateDays(formData.fromDate, formData.toDate)}
                    </span>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason*
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Please provide reason for leave..."
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 min-h-[42px] flex items-center justify-center ${submitting ? "opacity-75 cursor-not-allowed" : ""
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
                    "Submit Request"
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

export default LeaveManagement;