import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const LeaveApproval = () => {
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

  // Calculate leave statistics
  const calculateLeaveStats = () => {
    const currentYear = new Date().getFullYear();

    // Filter leaves based on selected employee
    const relevantLeaves =
      selectedEmployee === "all"
        ? approvedLeaves
        : approvedLeaves.filter(
          (leave) => leave.employeeName === selectedEmployee
        );

    // Calculate approved leaves for current year
    const casualLeaveTaken = relevantLeaves
      .filter((leave) => {
        const leaveYear = new Date(
          leave.startDate.split("/").reverse().join("-")
        ).getFullYear();
        return (
          leave.leaveType &&
          leave.leaveType.toLowerCase().includes("casual") &&
          leaveYear === currentYear
        );
      })
      .reduce((sum, leave) => sum + leave.days, 0);

    const earnedLeaveTaken = relevantLeaves
      .filter((leave) => {
        const leaveYear = new Date(
          leave.startDate.split("/").reverse().join("-")
        ).getFullYear();
        return (
          leave.leaveType &&
          leave.leaveType.toLowerCase().includes("earned") &&
          leaveYear === currentYear
        );
      })
      .reduce((sum, leave) => sum + leave.days, 0);

    const sickLeaveTaken = relevantLeaves
      .filter((leave) => {
        const leaveYear = new Date(
          leave.startDate.split("/").reverse().join("-")
        ).getFullYear();
        return (
          leave.leaveType &&
          leave.leaveType.toLowerCase().includes("sick") &&
          leaveYear === currentYear
        );
      })
      .reduce((sum, leave) => sum + leave.days, 0);

    const restrictedHolidayTaken = relevantLeaves
      .filter((leave) => {
        const leaveYear = new Date(
          leave.startDate.split("/").reverse().join("-")
        ).getFullYear();
        return (
          leave.leaveType &&
          leave.leaveType.toLowerCase().includes("restricted") &&
          leaveYear === currentYear
        );
      })
      .reduce((sum, leave) => sum + leave.days, 0);

    const totalLeave =
      casualLeaveTaken +
      earnedLeaveTaken +
      sickLeaveTaken +
      restrictedHolidayTaken;

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

  useEffect(() => {
    fetchLeaveData();
  }, []);

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

    // If it's already in MM/DD/YYYY format, return as-is
    if (dateString.includes("/") && dateString.split("/")[0].length <= 2) {
      const parts = dateString.split("/");
      if (parts.length === 3) {
        const [first, second, third] = parts;
        // Check if it's already in MM/DD/YYYY format (first part <= 12)
        if (first <= 12 && second <= 31) {
          return dateString;
        }
        // If it's in DD/MM/YYYY format, convert to MM/DD/YYYY
        if (second <= 12 && first <= 31) {
          return `${second.padStart(2, "0")}/${first.padStart(2, "0")}/${third}`;
        }
      }
    }

    // Convert from YYYY-MM-DD to MM/DD/YYYY
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return as-is if not a valid date
    }

    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  };

  const handleLeaveAction = async (action) => {
    if (!selectedRow) {
      toast.error("Please select a leave request");
      return;
    }

    setActionInProgress(action);
    setLoading(true);

    try {
      const fullDataResponse = await fetch(
        "https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec?sheet=Leave Management&action=fetch"
      );

      if (!fullDataResponse.ok) {
        throw new Error(`HTTP error! status: ${fullDataResponse.status}`);
      }

      const fullDataResult = await fullDataResponse.json();
      const allData = fullDataResult.data || fullDataResult;

      // Find the row index by matching Column B (serial number) and Column C (employee ID)
      const rowIndex = allData.findIndex(
        (row, idx) =>
          idx > 0 && // Skip header row
          row[1]?.toString().trim() ===
          selectedRow.serialNo?.toString().trim() &&
          row[2]?.toString().trim() ===
          selectedRow.employeeId?.toString().trim()
      );

      if (rowIndex === -1) {
        throw new Error(
          `Leave request not found for employee ${selectedRow.employeeId}`
        );
      }

      const today = new Date();
      const day = String(today.getDate()).padStart(2, "0");
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const year = today.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;

      // Prepare only the columns we want to update
      const updateData = {
        sheetName: "Leave Management",
        action: "updateCell", // Change to updateCell action
        rowIndex: rowIndex + 1, // Add 1 because Google Sheets rows are 1-indexed
      };

      // Update Column A (timestamp)
      const timestampPayload = {
        ...updateData,
        columnIndex: 1, // Column A
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

      // Update Column E (start date) if changed
      if (editableDates.from && editableDates.from !== selectedRow.startDate) {
        const startDatePayload = {
          ...updateData,
          columnIndex: 5, // Column E
          value: formatDOB(editableDates.from)
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
        const endDatePayload = {
          ...updateData,
          columnIndex: 6, // Column F
          value: formatDOB(editableDates.to)
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

      // Update Column M (HOD approval status)
      const approvalPayload = {
        ...updateData,
        columnIndex: 13, // Column M
        value: action === "accept" ? "approved" : "rejected"
      };

      const approvalResponse = await fetch(
        "https://script.google.com/macros/s/AKfycbx2Gx6GwLbx4vROXNK6PnB9J6pU61x5cfjjaqsEYH5nWkZwQGR8p-0geF14UK7QyG3qPg/exec",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams(approvalPayload).toString(),
        }
      );

      const approvalResult = await approvalResponse.json();
      if (!approvalResult.success) {
        throw new Error("Failed to update approval status");
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

      const processedData = dataRows.map((row) => ({
        timestamp: row[0] || "",
        serialNo: row[1] || "",
        employeeId: row[2] || "",
        employeeName: row[3] || "",
        startDate: row[4] || "",
        endDate: row[5] || "",
        remark: row[6] || "",
        days: row[13],
        status: row[7],
        leaveType: row[8],
        hodName: row[9] || "",
        department: row[10] || "",
        substitute: row[11] || "",
        hodApproval: row[12] || "", // Column M - HOD Approval Status
      }));

      // Filter leaves where HOD approval is pending
      setPendingLeaves(
        processedData.filter(
          (leave) => leave.hodApproval?.toString().toLowerCase() === "pending"
        )
      );

      // Filter leaves where HOD approval is approved
      setApprovedLeaves(
        processedData.filter(
          (leave) => leave.hodApproval?.toString().toLowerCase() === "approved"
        )
      );

      // Filter leaves where HOD approval is rejected
      setRejectedLeaves(
        processedData.filter(
          (leave) => leave.hodApproval?.toString().toLowerCase() === "rejected"
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

    // Handle MM/DD/YYYY format and convert to DD/MM/YYYY
    if (dateString.includes("/")) {
      const parts = dateString.split("/");
      if (parts.length === 3) {
        const [month, day, year] = parts;
        return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
      }
    }

    // Fallback for other date formats
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString();
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
            Department
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
            Substitute
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
                {item.department}
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
                {selectedRow?.serialNo === item.serialNo
                  ? calculateDays(editableDates.from, editableDates.to)
                  : item.days}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.remark}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.leaveType}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.substitute}
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
                        <span>Approving...</span>
                      </div>
                    ) : (
                      "Approve"
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
            <td colSpan="11" className="px-6 py-12 text-center">
              <p className="text-gray-500">No pending leave requests for HOD approval.</p>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderApprovedLeavesTable = () => (
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
            Department
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
            Substitute
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            HOD Approval Status
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
                {item.department}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(item.startDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(item.endDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.days}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.remark}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.leaveType}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.substitute}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                Approved
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="10" className="px-6 py-12 text-center">
              <p className="text-gray-500">
                No approved leave requests found.
              </p>
            </td>
          </tr>
        )}
      </tbody>
    </table>
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
            Department
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
            Substitute
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            HOD Approval Status
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
                {item.department}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(item.startDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(item.endDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.days}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.remark}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.leaveType}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.substitute}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                Rejected
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="10" className="px-6 py-12 text-center">
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
    <div className="space-y-3 md:pb-4 mb-4 font-outfit">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Leave Approvals</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">HOD Dashboard</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm transition-all hover:border-indigo-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Casual</p>
          <p className="text-xl font-bold text-indigo-600">{leaveStats.casualLeave}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm transition-all hover:border-emerald-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Earned</p>
          <p className="text-xl font-bold text-emerald-600">{leaveStats.earnedLeave}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm transition-all hover:border-rose-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Sick</p>
          <p className="text-xl font-bold text-rose-600">{leaveStats.sickLeave}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm transition-all hover:border-amber-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Restricted</p>
          <p className="text-xl font-bold text-amber-600">{leaveStats.restrictedHoliday}</p>
        </div>
        <div className="bg-indigo-600 p-3 rounded-lg border border-indigo-700 shadow-sm col-span-2 md:col-span-1 shadow-indigo-100">
          <p className="text-[10px] font-bold text-indigo-100 uppercase">Total Taken</p>
          <p className="text-xl font-bold text-white">{leaveStats.totalLeave}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs sm:text-sm transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
           <select 
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-[11px] font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm bg-white"
          >
            <option value="all">ALL EMPLOYEES</option>
            {uniqueEmployeeNames.map(name => (
              <option key={name} value={name}>{name.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Card with Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/30">
          <nav className="flex px-2 overflow-x-auto no-scrollbar">
            {[
              { id: "pending", label: "Pending", count: pendingLeaves.length },
              { id: "approved", label: "Approved", count: approvedLeaves.length },
              { id: "rejected", label: "Rejected", count: rejectedLeaves.length }
            ].map((tab) => (
              <button
                key={tab.id}
                className={`py-3 px-4 font-bold text-[10px] uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        <div className="p-0">
          <div className="overflow-x-auto">
            {tableLoading ? (
              <LoadingSpinner message="Synchronizing leave requests..." minHeight="300px" />
            ) : error ? (
              <div className="px-6 py-12 text-center">
                <p className="text-rose-500 text-xs font-bold mb-2">Error: {error}</p>
                <button onClick={fetchLeaveData} className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded text-xs font-bold shadow-sm">Retry</button>
              </div>
            ) : (
               <>
                {/* Desktop Tables */}
                <div className="hidden md:block">
                  {activeTab === "pending" && (
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50/50">
                        <tr>
                          <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select</th>
                          <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Employee</th>
                          <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dates</th>
                          <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type / Reason</th>
                          <th className="px-4 py-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 bg-white">
                        {filteredPendingLeaves.length > 0 ? (
                          filteredPendingLeaves.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50/50 transition-colors group">
                               <td className="px-4 py-2 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={selectedRow?.serialNo === item.serialNo}
                                  onChange={() => handleCheckboxChange(item.serialNo, item)}
                                  className="h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded shadow-sm"
                                />
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <p className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.employeeName}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">{item.employeeId}</p>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                  {selectedRow?.serialNo === item.serialNo ? (
                                    <div className="flex items-center gap-1">
                                      <input type="date" value={editableDates.from} onChange={(e) => handleDateChange("from", e.target.value)} className="border border-gray-200 rounded px-1.5 py-0.5 text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none" />
                                      <span className="text-gray-300">-</span>
                                      <input type="date" value={editableDates.to} onChange={(e) => handleDateChange("to", e.target.value)} className="border border-gray-200 rounded px-1.5 py-0.5 text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none" />
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-bold text-gray-600">{formatDate(item.startDate)} - {formatDate(item.endDate)}</span>
                                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1 rounded">{item.days}D</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2">
                                <p className="text-[11px] font-bold text-gray-700">{item.leaveType}</p>
                                <p className="text-[10px] text-gray-400 italic line-clamp-1">"{item.remark}"</p>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleLeaveAction("accept")}
                                    disabled={!selectedRow || selectedRow.serialNo !== item.serialNo || loading}
                                    className={`px-3 py-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 text-[10px] font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-sm ${(!selectedRow || selectedRow.serialNo !== item.serialNo || loading) ? "opacity-40" : ""}`}
                                  >
                                    {loading && selectedRow?.serialNo === item.serialNo && actionInProgress === "accept" ? "Wait.." : "Approve"}
                                  </button>
                                  <button
                                    onClick={() => handleLeaveAction("rejected")}
                                    disabled={selectedRow?.serialNo !== item.serialNo || loading}
                                    className={`px-3 py-1 bg-rose-50 text-rose-700 rounded border border-rose-100 text-[10px] font-bold hover:bg-rose-600 hover:text-white transition-all shadow-sm ${(selectedRow?.serialNo !== item.serialNo || loading) ? "opacity-40" : ""}`}
                                  >
                                    {loading && selectedRow?.serialNo === item.serialNo && actionInProgress === "rejected" ? "Wait.." : "Reject"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="5" className="px-4 py-12 text-center text-gray-400 text-xs">No pending requests.</td></tr>
                        )}
                      </tbody>
                    </table>
                  )}
                  {activeTab === "approved" && (
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50/50">
                        <tr>
                          <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Employee</th>
                          <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Period</th>
                          <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</th>
                          <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Days</th>
                          <th className="px-4 py-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 bg-white">
                        {filteredApprovedLeaves.map((item, index) => (
                           <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-2 whitespace-nowrap">
                              <p className="text-xs font-bold text-gray-900">{item.employeeName}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">{item.employeeId}</p>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-[11px] font-bold text-gray-600">{formatDate(item.startDate)} - {formatDate(item.endDate)}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-[11px] font-bold text-gray-700">{item.leaveType}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-xs font-bold text-indigo-600 bg-indigo-50/50 text-center rounded">{item.days}D</td>
                            <td className="px-4 py-2 whitespace-nowrap text-center">
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold uppercase tracking-widest shadow-sm">Approved</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {activeTab === "rejected" && (
                     <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50/50">
                        <tr>
                          <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Employee</th>
                          <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Period</th>
                          <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reason</th>
                          <th className="px-4 py-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 bg-white">
                        {filteredRejectedLeaves.map((item, index) => (
                           <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-2 whitespace-nowrap">
                              <p className="text-xs font-bold text-gray-900">{item.employeeName}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">{item.employeeId}</p>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-[11px] font-bold text-gray-600">{formatDate(item.startDate)} - {formatDate(item.endDate)}</td>
                            <td className="px-4 py-2 text-[10px] text-gray-400 italic">"{item.remark}"</td>
                            <td className="px-4 py-2 whitespace-nowrap text-center">
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[9px] font-bold uppercase tracking-widest shadow-sm">Rejected</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-gray-100">
                  {activeTab === "pending" && (
                    filteredPendingLeaves.length > 0 ? (
                      filteredPendingLeaves.map((item, index) => (
                        <div key={index} className="p-3 space-y-2">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-indigo-600">#{item.employeeId}</span>
                            <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">{item.department}</span>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 leading-tight">{item.employeeName}</div>
                            <div className="text-[11px] text-indigo-600 font-medium">{item.leaveType}</div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded border border-gray-100">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-gray-400 uppercase font-bold tracking-tighter">Period</span>
                              <span className="font-bold text-gray-700">{formatDate(item.startDate)} - {formatDate(item.endDate)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] mt-1">
                              <span className="text-gray-400 uppercase font-bold tracking-tighter">Remark</span>
                              <span className="text-gray-500 italic max-w-[200px] truncate">"{item.remark}"</span>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => {
                                handleCheckboxChange(item.serialNo, item);
                                setTimeout(() => handleLeaveAction("accept"), 50);
                              }}
                              className="flex-1 py-2 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all"
                            >
                              Approve
                            </button>
                            <button
                               onClick={() => {
                                handleCheckboxChange(item.serialNo, item);
                                setTimeout(() => handleLeaveAction("rejected"), 50);
                              }}
                              className="flex-1 py-2 bg-rose-50 text-rose-700 rounded border border-rose-100 text-xs font-bold hover:bg-rose-600 hover:text-white transition-all"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-400 text-xs font-medium">No pending requests.</div>
                    )
                  )}
                  {(activeTab === "approved" || activeTab === "rejected") && (
                    (activeTab === "approved" ? filteredApprovedLeaves : filteredRejectedLeaves).map((item, index) => (
                      <div key={index} className="p-3 space-y-2">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-indigo-600">#{item.employeeId}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${activeTab === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{activeTab}</span>
                        </div>
                        <div className="text-sm font-bold text-gray-900">{item.employeeName}</div>
                        <div className="flex justify-between items-center pt-1 border-t border-gray-50 text-[10px]">
                          <span className="text-gray-400 font-bold uppercase tracking-widest">{item.leaveType}</span>
                          <span className="text-gray-600 font-bold">{formatDate(item.startDate)} - {formatDate(item.endDate)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
               </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveApproval;