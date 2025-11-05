import React, { useEffect, useState } from "react";

interface SidebarProps {
  activeTab:
    | "users"
    | "companies"
    | "programs"
    | "specializations"
    | "levels"
    | "classes"
    | "courses"
    | "modules"
    | "schoolYears"
    | "schoolYearPeriods"
    | "classRooms"
    | "students"
    | "teachers"
    | "administrators"
    | "studentLinkTypes"
    | "studentContacts"
    | "studentDiplomes";
  onTabChange: (
    tab:
      | "users"
      | "companies"
      | "programs"
      | "specializations"
      | "levels"
      | "classes"
      | "courses"
      | "modules"
      | "schoolYears"
      | "schoolYearPeriods"
      | "classRooms"
      | "students"
      | "teachers"
      | "administrators"
      | "studentLinkTypes"
      | "studentContacts"
      | "studentDiplomes"
  ) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const [isParametersOpen, setIsParametersOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleParameters = () => {
    setIsParametersOpen(!isParametersOpen);
  };

  useEffect(() => {
    const handler = () => setIsMobileOpen((prev) => !prev);
    window.addEventListener("toggle-sidebar", handler as any);
    return () => window.removeEventListener("toggle-sidebar", handler as any);
  }, []);

  const closeMobile = () => setIsMobileOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Overlay for mobile */}
      <div
        className={`fixed left-0 right-0 top-16 bottom-0 bg-black/30 z-30 sm:hidden transition-opacity ${
          isMobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={closeMobile}
      />
      <div
        className={`w-64 bg-white shadow-lg fixed left-0 top-16 z-40 transform transition-transform sm:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        }`}
        style={{ height: 'calc(100vh - 4rem)' }}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-gray-900">Edusol</h2>
            {/* Close button on mobile */}
            <button
              type="button"
              aria-label="Close sidebar"
              className="sm:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100"
              onClick={closeMobile}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Users Section */}
          <div className="mb-6">
            <button
              onClick={() => onTabChange("users")}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === "users"
                  ? "bg-blue-100 text-blue-700 border-l-4 border-blue-500"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
                Users
              </div>
            </button>
          </div>

          {/* Parameters Section */}
          <div className="mb-6 flex-1 overflow-y-auto pr-2">
            <button
              onClick={toggleParameters}
              className="w-full text-left px-4 py-3 rounded-lg font-medium transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Parameters
                </div>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    isParametersOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            {/* Dropdown Content */}
            {isParametersOpen && (
              <div className="ml-8 mt-2 space-y-2 pb-8">
                <button
                  onClick={() => onTabChange("companies")}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === "companies"
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                    </svg>
                    Companies
                  </div>
                </button>

                <button
                  onClick={() => onTabChange("programs")}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === "programs"
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10M4 18h6" />
                  </svg>
                    Programs
                  </div>
                </button>

                <button
                  onClick={() => onTabChange("specializations")}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === "specializations"
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c1.657 0 3-1.343 3-3S13.657 2 12 2 9 3.343 9 5s1.343 3 3 3zM5.5 21a4.5 4.5 0 019 0m-11-7a4.5 4.5 0 019 0" />
                    </svg>
                    Specializations
                  </div>
                </button>

                <button
                  onClick={() => onTabChange("levels")}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === "levels"
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h6" />
                    </svg>
                    Levels
                  </div>
                </button>

                <button
                  onClick={() => onTabChange("classes")}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === "classes"
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 11h16M4 16h10" />
                    </svg>
                    Classes
                  </div>
                </button>

                <button
                  onClick={() => onTabChange("courses")}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === "courses"
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center">
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
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    Courses
                  </div>
                </button>

                <button
                  onClick={() => onTabChange("modules")}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === "modules"
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center">
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
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                    Modules
                  </div>
                </button>

                {/* School Year */}
                <button
                  onClick={() => onTabChange("schoolYears")}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === "schoolYears"
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center">
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
                        d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z"
                      />
                    </svg>
                    School Year
                  </div>
                </button>

                {/* School Year Period */}
                <button
                  onClick={() => onTabChange("schoolYearPeriods")}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === "schoolYearPeriods"
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center">
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
                        d="M8 7V3m8 4V3M3 11h18M7 21h10a2 2 0 002-2V9H5v10a2 2 0 002 2z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 13h8"
                      />
                    </svg>
                    School Year Period
                  </div>
                </button>

                {/* Class Rooms */}
                <button
                  onClick={() => onTabChange("classRooms")}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === "classRooms"
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center">
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
                        d="M3 7h18M3 12h18M3 17h18"
                      />
                    </svg>
                    Class Rooms
                  </div>
                </button>

                {/* Student Link Types */}
                <button
                  onClick={() => onTabChange("studentLinkTypes")}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === "studentLinkTypes"
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center">
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
                        d="M7 8h10M7 12h6m-6 4h10"
                      />
                    </svg>
                    Student Link Types
                  </div>
                </button>

                {/* Student Contacts */}
                <button
                  onClick={() => onTabChange("studentContacts")}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === "studentContacts"
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center">
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
                        d="M5.121 17.804A13.937 13.937 0 0112 15c2.485 0 4.797.607 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Student Contacts
                  </div>
                </button>

                {/* Student Diplomes */}
                <button
                  onClick={() => onTabChange("studentDiplomes")}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === "studentDiplomes"
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center">
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
                        d="M12 14l9-5-9-5-9 5 9 5zm0 0v6"
                      />
                    </svg>
                    Student Diplomes
                  </div>
                </button>

                {/* Students */}
                <button
                  onClick={() => onTabChange("students")}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === "students"
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center">
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
                        d="M5.121 17.804A7 7 0 1118.88 4.196M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Students
                  </div>
                </button>

                {/* Teachers */}
                <button
                  onClick={() => onTabChange("teachers")}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === "teachers"
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center">
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
                        d="M12 14l9-5-9-5-9 5 9 5z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 14l6.16-3.422A12.083 12.083 0 0112 21.5a12.083 12.083 0 01-6.16-10.922L12 14z"
                      />
                    </svg>
                    Teachers
                  </div>
                </button>

                {/* Administrators */}
                <button
                  onClick={() => onTabChange("administrators")}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === "administrators"
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center">
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
                        d="M16 11V7a4 4 0 10-8 0v4M5 11h14v10H5V11z"
                      />
                    </svg>
                    Administrators
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
