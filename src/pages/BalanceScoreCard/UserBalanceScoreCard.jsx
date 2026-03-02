import { Activity } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { UserAjayUpadhyay } from './UserScorecard/UserAjayUpadhyay';
import { UserAlokPandey } from './UserScorecard/UserAlokUpadhyay';
import { UserDeepmalaPatil } from './UserScorecard/UserDeepmalaPatil';
import { UserDeepuMourya } from './UserScorecard/UserDeepuMourya';
import { UserGeetanjaliDeep } from './UserScorecard/UserGeetanjaliDeep';
import { UserHansrajSingh } from './UserScorecard/UserHansraj';
// import { UserIshaShrivastava } from './UserScorecard/UserIshaShrivastava';
import { UserHarshRai } from './UserScorecard/UserHarshRai';
import { UserJharnaAmbulkar } from './UserScorecard/UserJharnaAmbulkar';
import { UserLalitMohanBisht } from './UserScorecard/UserLalitMohanBisht';
import { UserMangeshSahu } from './UserScorecard/UserMangeshSahu';
import { UserNeeluSahu } from './UserScorecard/UserNeeluSahu';
import { UserNighatParveen } from './UserScorecard/UserNighatParveen';
import { UserPannaSenani } from './UserScorecard/UserPannaSenani';
import { UserPoorwaGajbhiye } from './UserScorecard/UserPoorwaGajbhiye';
import { UserPratimaVarthi } from './UserScorecard/UserPratimaVarthi';
import { UserPraveenGupta } from './UserScorecard/UserPraveenGupta';
import { UserSumanBalaSahu } from './UserScorecard/UserSumanBalaSahu';
// import { UserSurbhiNetam } from './UserScorecard/UserSurbhiNetam';
import { UserUmeshDhakkad } from './UserScorecard/UserUmeshDhakkad';
import { UserSumanGoud } from './UserScorecard/UserSumanGoud';

export const UserBalanceScoreCard = () => {
  const [employees] = useState([
  { id: 1, name: "Ajay Upadhyay", department: "Account" },
  { id: 2, name: "Alok Pandey", department: "Marketing" },
  { id: 3, name: "Deepmala Patil", department: "OPD" },
  { id: 4, name: "Deepu Mourya", department: "TPA" },
  { id: 5, name: "Geetanjali Deep", department: "HR" },
  { id: 6, name: "Hansraj Singh", department: "Housekeeping" },
  { id: 7, name: "Harsh Rai", department: "Marketing"},
  // { id: 8, name: "Isha Shrivastava", department: "Marketing" },
  { id: 9, name: "Jharna Ambulkar", department: "Admin" },
  { id: 10, name: "Lalit Mohan Bisht", department: "Operations" },
  { id: 11, name: "Mangesh Sahu", department: "Marketing"},
  { id: 12, name: "Neelu Sahu", department: "Operation" },
  { id: 13, name: "Nighat Parveen", department: "Marketing" },
  { id: 14, name: "Panna Senani", department: "Accounts" },
  { id: 15, name: "Poorwa Gajbhiye", department: "HR" },
  { id: 16, name: "Pratima Varthi", department: "Store" },
  { id: 17, name: "Praveen Gupta", department: "IT" },
  { id: 18, name: "Suman Bala Sahu", department: "Admin" },
  { id: 19, name: "Suman Goud Kuntla", department: "VP- Operations" },
  // { id: 20, name: "Surbhi Netam", department: "Marketing" },
  { id: 21, name: "Umesh Dhakkad", department: "Pharmacy" }
]);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [viewType, setViewType] = useState(''); // 'scorecard' or 'history'
  const [filteredEmployees, setFilteredEmployees] = useState(employees);

  useEffect(() => {
    // Get logged-in user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const loggedInUserName = user.Name || user.Username || '';
        
        // Find matching employee with case-insensitive comparison
        const matchedEmployee = employees.find(emp => 
          emp.name.toLowerCase() === loggedInUserName.toLowerCase()
        );
        
        if (matchedEmployee) {
          // Auto-select the user's scorecard
          setSelectedEmployee(matchedEmployee.name);
          setViewType('scorecard');
          // Filter to show only this employee
          setFilteredEmployees([matchedEmployee]);
        } else {
          // User not found in employee list, show all employees
          setFilteredEmployees(employees);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setFilteredEmployees(employees);
      }
    } else {
      setFilteredEmployees(employees);
    }
  }, [employees]);

  const handleEmployeeClick = (employeeName, type) => {
    setSelectedEmployee(employeeName);
    setViewType(type);
  };

  const handleBackClick = () => {
    setSelectedEmployee(null);
    setViewType('');
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col mb-4 md:mb-6 sticky top-0 bg-gray-50 z-10 py-2 space-y-3">
          {/* Top Row - Buttons */}
          <div className="flex justify-between items-center w-full">
            {selectedEmployee && (
              <button
                onClick={handleBackClick}
                className="px-4 py-2 bg-blue-800 text-white rounded hover:bg-blue-700 flex items-center text-sm md:text-base"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back
              </button>
            )}
            <div className="flex-1"></div> {/* Spacer */}
            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center text-sm md:text-base">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span>Download</span>
            </button>
          </div>

          {/* Bottom Row - Title and View Type */}
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
            <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center md:text-left">
                {selectedEmployee ? selectedEmployee : "Balanced Scorecard"}
              </h1>
              {selectedEmployee && (
                <span className="ml-0 md:ml-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm md:text-base text-center md:text-left mt-1 md:mt-0">
                  {viewType === "scorecard"
                    ? "Score Card View"
                    : "History View"}
                </span>
              )}
            </div>
          </div>
        </div>

        {selectedEmployee ? (
          <div>
            {viewType === "scorecard" &&
              selectedEmployee === "Ajay Upadhyay" && <UserAjayUpadhyay />}
            {viewType === "scorecard" &&
              selectedEmployee === "Alok Pandey" && <UserAlokPandey />}
            {viewType === "scorecard" &&
              selectedEmployee === "Deepmala Patil" && <UserDeepmalaPatil />}
            {viewType === "scorecard" &&
              selectedEmployee === "Deepu Mourya" && <UserDeepuMourya />}
            {viewType === "scorecard" &&
              selectedEmployee === "Geetanjali Deep" && <UserGeetanjaliDeep />}
            {viewType === "scorecard" &&
              selectedEmployee === "Hansraj Singh" && <UserHansrajSingh />}
            {viewType === "scorecard" &&
              selectedEmployee === "Harsh Rai" && <UserHarshRai />}
            {viewType === "scorecard" &&
              selectedEmployee === "Isha Shrivastava" && <UserIshaShrivastava />}
            {viewType === "scorecard" &&
              selectedEmployee === "Jharna Ambulkar" && <UserJharnaAmbulkar />}
            {viewType === "scorecard" &&
              selectedEmployee === "Lalit Mohan Bisht" && <UserLalitMohanBisht />}
            {viewType === "scorecard" &&
              selectedEmployee === "Mangesh Sahu" && <UserMangeshSahu />}
            {viewType === "scorecard" &&
              selectedEmployee === "Neelu Sahu" && <UserNeeluSahu />}
            {viewType === "scorecard" &&
              selectedEmployee === "Nighat Parveen" && <UserNighatParveen />}
            {viewType === "scorecard" &&
              selectedEmployee === "Panna Senani" && <UserPannaSenani />}
            {viewType === "scorecard" &&
              selectedEmployee === "Poorwa Gajbhiye" && <UserPoorwaGajbhiye />}
            {viewType === "scorecard" &&
              selectedEmployee === "Pratima Varthi" && <UserPratimaVarthi />}
            {viewType === "scorecard" &&
              selectedEmployee === "Praveen Gupta" && <UserPraveenGupta />}
            {viewType === "scorecard" &&
              selectedEmployee === "Suman Bala Sahu" && <UserSumanBalaSahu />}
            {viewType === "scorecard" &&
              selectedEmployee === "Suman Goud Kuntla" && <UserSumanGoud />}
            {viewType === "scorecard" &&
              selectedEmployee === "Surbhi Netam" && <UserSurbhiNetam />}
            {viewType === "scorecard" &&
              selectedEmployee === "Umesh Dhakkad" && <UserUmeshDhakkad />}
            {![
              "Ajay Upadhyay",
              "Alok Pandey",
              "Deepmala Patil",
              "Deepu Mourya",
              "Geetanjali Deep",
              "Hansraj Singh",
              "Harsh Rai",
              "Isha Shrivastava",
              "Jharna Ambulkar",
              "Lalit Mohan Bisht",
              "Mangesh Sahu",
              "Neelu Sahu",
              "Nighat Parveen",
              "Panna Senani",
              "Poorwa Gajbhiye",
              "Pratima Varthi",
              "Praveen Gupta",
              "Suman Bala Sahu",
              "Suman Goud Kuntla",
              "Surbhi Netam",
              "Umesh Dhakkad",
            ].includes(selectedEmployee) && (
              <div className="bg-white rounded-lg shadow p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                  Employee Details
                </h2>
                <p className="text-gray-600">
                  Details for {selectedEmployee} will be displayed here.
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
              <div
                className="overflow-x-auto"
                style={{ maxHeight: "calc(100vh - 180px)" }}
              >
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0 text-center">
                        SN
                      </th>
                      <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0 text-center">
                        Employee Name
                      </th>
                      <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0 text-center">
                        Department
                      </th>
                      <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0 text-center">
                        Balance Scorecard
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((employee, index) => (
                        <tr
                          key={employee.id}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            {employee.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              <div className="ml-4">
                                  {employee.name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            {employee.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              <div className="ml-4">
                                <button
                                  onClick={() =>
                                    handleEmployeeClick(
                                      employee.name,
                                      "scorecard"
                                    )
                                  }
                                  className="text-sm font-medium px-6 py-2 rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none"
                                >
                                  Click Here
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-6 py-4 text-center text-gray-500"
                        >
                          No employees available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden bg-white rounded-lg shadow overflow-hidden">
              <div className="p-0">
                {filteredEmployees.length > 0 ? (
                  <div className="space-y-0">
                    {filteredEmployees.map((employee, index) => (
                      <div
                        key={employee.id}
                        className={`p-4 border-b border-gray-200 ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-500 mr-3">
                              {employee.id}.
                            </span>
                            <button
                              onClick={() =>
                                handleEmployeeClick(employee.name, "history")
                              }
                              className="text-base font-semibold text-blue-600 hover:text-blue-800 focus:outline-none text-left"
                            >
                              {employee.name}
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-sm text-gray-600">
                              Department :
                            </span>
                            <span className="text-sm font-medium text-gray-800 ml-2">
                              {employee.department}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              handleEmployeeClick(employee.name, "scorecard")
                            }
                            className="text-sm font-medium px-4 py-2 rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none"
                          >
                            Scorecard
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    No employees available
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};