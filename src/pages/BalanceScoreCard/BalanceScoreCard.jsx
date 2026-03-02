import { Activity } from 'lucide-react';
import React, { useState } from 'react';
import { AjayUpadhyay } from './Scorecard/AjayUpadhyay';
import { AjayUpadhyayScorecardHistory } from './ScorecardHistory/AjayUpadhyayScorecardHistory'
import { AlokPandey } from './Scorecard/AlokPandey';
import { AlokPandeyScorecardHistory } from './ScorecardHistory/AlokPandeyScorecardHistory'
import { DeepmalaPatil } from './Scorecard/DeepmalaPatil';
import { DeepmalaPatilScorecardHistory } from './ScorecardHistory/DeepmalaPatilScorecardHistory'
import { DeepuMourya } from './Scorecard/DeepuMourya';
import { DeepuMouryaScorecardHistory } from './ScorecardHistory/DeepuMouryaScorecardHistory'
import { GeetanjaliDeep } from './Scorecard/GeetanjaliDeep';
import { GeetanjaliDeepScorecardHistory } from './ScorecardHistory/GeetanjaliDeepScorecardHistory'
import { HansrajSingh } from './Scorecard/HansrajSingh';
import { HansrajSinghScorecardHistory } from './ScorecardHistory/HansrajSinghScorecardHistory'
import { HarshRai } from './Scorecard/HarshRai';
import { HarshRaiScorecardHistory } from './ScorecardHistory/HarshRaiScorecardHistory';
import { JharnaAmbulkar } from './Scorecard/JharnaAmbulkar';
import { JharnaAmbulkarScorecardHistory } from './ScorecardHistory/JharnaAmbulkarScorecardHistory'
import { LalitMohanBisht } from './Scorecard/LalitMohanBisht';
import { LalitMohanBishtScorecardHistory } from './ScorecardHistory/LalitMohanBishtScorecardHistory'
import { NeeluSahu } from './Scorecard/NeeluSahu';
import { NeeluSahuScorecardHistory } from './ScorecardHistory/NeeluSahuScorecardHistory'
import { PoorwaGajbhiye } from './Scorecard/PoorwaGajbhiye';
import { PoorwaGajbhiyeScorecardHistory } from './ScorecardHistory/PoorwaGajbhiyeScorecardHistory'
import { PratimaVarthi } from './Scorecard/PratimaVarthi';
import { PratimaVarthiScorecardHistory } from './ScorecardHistory/PratimaVarthiScorecardHistory'
import { PraveenGupta } from './Scorecard/PraveenGupta';
import { PraveenGuptaScorecardHistory } from './ScorecardHistory/PraveenGuptaScorecardHistory'
import { SumanBalaSahu } from './Scorecard/SumanBalaSahu';
import { SumanBalaSahuScorecardHistory } from './ScorecardHistory/SumanBalaSahuScorecardHistory'
import { UmeshDhakkad } from './Scorecard/UmeshDhakkad';
import { UmeshDhakkadScorecardHistory } from './ScorecardHistory/UmeshDhakkadScorecardHistory'
// import { IshaShrivastava } from './Scorecard/IshaShrivastava';
// import { IshaShrivastavaScorecardHistory } from './ScorecardHistory/IshaShrivastavaScorecardHistory';
import { MangeshSahu } from './Scorecard/MangeshSahu';
import { MangeshSahuScorecardHistory } from './ScorecardHistory/MangeshSahuScorecardHistory';
import { NighatParveen } from './Scorecard/NighatParveen';
import { NighatParveenScorecardHistory } from './ScorecardHistory/NighatParveenScorecardHistory';
import { PannaSenani } from './Scorecard/PannaSenani';
import { PannaSenaniScorecardHistory } from './ScorecardHistory/PannaSenaniScorecardHistory';
// import { SurbhiNetam } from './Scorecard/SurbhiNetam';
// import { SurbhiNetamScorecardHistory } from './ScorecardHistory/SurbhiNetamScorecardHistory';
import { SumanGoud } from './Scorecard/SumanGoud';
import { SumanGoudScorecardHistory } from './ScorecardHistory/SumanGoudScorecardHistory';

export const BalanceScoreCard = () => {
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
              selectedEmployee === "Poorwa Gajbhiye" && <PoorwaGajbhiye />}
            {viewType === "history" &&
              selectedEmployee === "Poorwa Gajbhiye" && (
                <PoorwaGajbhiyeScorecardHistory />
              )}
            {viewType === "scorecard" &&
              selectedEmployee === "Geetanjali Deep" && <GeetanjaliDeep />}
            {viewType === "history" &&
              selectedEmployee === "Geetanjali Deep" && (
                <GeetanjaliDeepScorecardHistory />
              )}
            {viewType === "scorecard" &&
              selectedEmployee === "Deepmala Patil" && <DeepmalaPatil />}
            {viewType === "history" &&
              selectedEmployee === "Deepmala Patil" && (
                <DeepmalaPatilScorecardHistory />
              )}
            {viewType === "scorecard" &&
              selectedEmployee === "Lalit Mohan Bisht" && <LalitMohanBisht />}
            {viewType === "history" &&
              selectedEmployee === "Lalit Mohan Bisht" && (
                <LalitMohanBishtScorecardHistory />
              )}
            {viewType === "scorecard" &&
              selectedEmployee === "Ajay Upadhyay" && <AjayUpadhyay />}
            {viewType === "history" && selectedEmployee === "Ajay Upadhyay" && (
              <AjayUpadhyayScorecardHistory />
            )}
            {viewType === "scorecard" &&
              selectedEmployee === "Deepu Mourya" && <DeepuMourya />}
            {viewType === "history" && selectedEmployee === "Deepu Mourya" && (
              <DeepuMouryaScorecardHistory />
            )}
            {viewType === "scorecard" &&
              selectedEmployee === "Pratima Varthi" && <PratimaVarthi />}
            {viewType === "history" &&
              selectedEmployee === "Pratima Varthi" && (
                <PratimaVarthiScorecardHistory />
              )}
            {viewType === "scorecard" &&
              selectedEmployee === "Jharna Ambulkar" && <JharnaAmbulkar />}
            {viewType === "history" &&
              selectedEmployee === "Jharna Ambulkar" && (
                <JharnaAmbulkarScorecardHistory />
              )}
            {viewType === "scorecard" &&
              selectedEmployee === "Suman Bala Sahu" && <SumanBalaSahu />}
            {viewType === "history" &&
              selectedEmployee === "Suman Bala Sahu" && (
                <SumanBalaSahuScorecardHistory />
              )}
            {viewType === "scorecard" &&
              selectedEmployee === "Umesh Dhakkad" && <UmeshDhakkad />}
            {viewType === "history" && selectedEmployee === "Umesh Dhakkad" && (
              <UmeshDhakkadScorecardHistory />
            )}
            {viewType === "scorecard" &&
              selectedEmployee === "Hansraj Singh" && <HansrajSingh />}
            {viewType === "history" && selectedEmployee === "Hansraj Singh" && (
              <HansrajSinghScorecardHistory />
            )}
            {viewType === "scorecard" &&
              selectedEmployee === "Harsh Rai" && <HarshRai />}
            {viewType === "history" && selectedEmployee === "Harsh Rai" && (
              <HarshRaiScorecardHistory />
            )}
            {viewType === "scorecard" &&
              selectedEmployee === "Isha Shrivastava" && <IshaShrivastava />}
            {viewType === "history" && selectedEmployee === "Isha Shrivastava" && (
              <IshaShrivastavaScorecardHistory />
            )}
            {viewType === "scorecard" &&
              selectedEmployee === "Mangesh Sahu" && <MangeshSahu />}
            {viewType === "history" && selectedEmployee === "Mangesh Sahu" && (
              <MangeshSahuScorecardHistory />
            )}
            {viewType === "scorecard" &&
              selectedEmployee === "Nighat Parveen" && <NighatParveen />}
            {viewType === "history" && selectedEmployee === "Nighat Parveen" && (
              <NighatParveenScorecardHistory />
            )}
            {viewType === "scorecard" &&
              selectedEmployee === "Panna Senani" && <PannaSenani />}
            {viewType === "history" && selectedEmployee === "Panna Senani" && (
              <PannaSenaniScorecardHistory />
            )}
            {viewType === "scorecard" &&
              selectedEmployee === "Praveen Gupta" && <PraveenGupta />}
            {viewType === "history" && selectedEmployee === "Praveen Gupta" && (
              <PraveenGuptaScorecardHistory />
            )}
            {viewType === "scorecard" &&
              selectedEmployee === "Surbhi Netam" && <SurbhiNetam />}
            {viewType === "history" && selectedEmployee === "Surbhi Netam" && (
              <SurbhiNetamScorecardHistory />
            )}
            {viewType === "scorecard" &&
              selectedEmployee === "Suman Goud Kuntla" && <SumanGoud />}
            {viewType === "history" && selectedEmployee === "Suman Goud Kuntla" && (
              <SumanGoudScorecardHistory />
            )}
            {viewType === "scorecard" && selectedEmployee === "Alok Pandey" && (
              <AlokPandey />
            )}
            {viewType === "history" && selectedEmployee === "Alok Pandey" && (
              <AlokPandeyScorecardHistory />
            )}
            {viewType === "scorecard" && selectedEmployee === "Neelu Sahu" && (
              <NeeluSahu />
            )}
            {viewType === "history" && selectedEmployee === "Neelu Sahu" && (
              <NeeluSahuScorecardHistory />
            )}
            {![
              "Ajay Upadhyay",
              "Poorwa Gajbhiye",
              "Geetanjali Deep",
              "Deepmala Patil",
              "Lalit Mohan Bisht",
              "Deepu Mourya",
              "Pratima Varthi",
              "Jharna Ambulkar",
              "Suman Bala Sahu",
              "Umesh Dhakkad",
              "Hansraj Singh",
              "Harsh Rai",
              "Surbhi Netam",
              "Isha Shrivastava",
              "Panna Senani",
              "Alok Pandey",
              "Mangesh Sahu",
              "Nighat Parveen",
              "Praveen Gupta",
              "Suman Goud Kuntla",
              "Neelu Sahu",
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
                    {employees.length > 0 ? (
                      employees.map((employee, index) => (
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
                                <button
                                  onClick={() =>
                                    handleEmployeeClick(
                                      employee.name,
                                      "history"
                                    )
                                  }
                                  className="text-sm font-medium text-blue-600 hover:text-blue-800 focus:outline-none"
                                >
                                  {employee.name}
                                </button>
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
                {employees.length > 0 ? (
                  <div className="space-y-0">
                    {employees.map((employee, index) => (
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

export default BalanceScoreCard;