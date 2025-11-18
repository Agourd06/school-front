import React, { useEffect, useState } from "react";

interface SidebarProps {
  activeTab:
    | "users"
    | "companies"
    | "programs"
    | "specializations"
    | "levels"
    | "classes"
    | "classStudents"
    | "planning"
    | "studentReports"
    | "studentPresence"
    | "planningSessionTypes"
    | "levelPricings"
    | "studentPayments"
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
    | "attestations"
    | "studentAttestations";
  onTabChange: (
    tab:
      | "users"
      | "companies"
      | "programs"
      | "specializations"
      | "levels"
      | "classes"
      | "classStudents"
      | "planning"
      | "studentReports"
      | "studentPresence"
      | "planningSessionTypes"
      | "levelPricings"
      | "studentPayments"
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
      | "attestations"
      | "studentAttestations"
  ) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const [isParametersOpen, setIsParametersOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleParameters = () => {
    setIsParametersOpen(!isParametersOpen);
  };

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  useEffect(() => {
    const handler = () => setIsMobileOpen((prev) => !prev);
    window.addEventListener("toggle-sidebar", handler as any);
    return () => window.removeEventListener("toggle-sidebar", handler as any);
  }, []);

  const closeMobile = () => setIsMobileOpen(false);

  const parameterGroups: Array<{
    title: string;
    items: Array<{ tab: SidebarProps['activeTab']; label: string }>;
  }> = [
    {
      title: 'Organization',
      items: [{ tab: 'companies', label: 'Companies' }],
    },
    {
      title: 'Academic Setup',
      items: [
  
      ],
    },
    {
      title: 'Class Management',
      items: [
        { tab: 'classes', label: 'Classes' },
        { tab: 'planningSessionTypes', label: 'Planning Session Types' },
      ],
    },
    {
      title: 'Student',
      items: [
       
        { tab: 'administrators', label: 'Administrators' },
        { tab: 'studentReports', label: 'Student Reports' },
        { tab: 'studentPresence', label: 'Student Presence' },
        { tab: 'studentLinkTypes', label: 'Student Link Types' },
        { tab: 'studentContacts', label: 'Student Contacts' },
        { tab: 'studentDiplomes', label: 'Student Diplomes' },
        { tab: 'attestations', label: 'Attestations' },
        { tab: 'studentAttestations', label: 'Student Attestations' },
      ],
    },
    {
      title: 'Finance',
      items: [
        { tab: 'levelPricings', label: 'Level Pricings' },
        { tab: 'studentPayments', label: 'Student Payments' },
      ],
    },
    // New parameter groups (empty for now - will replace old ones later)
    {
      title: 'Scholarity',
      items: [
        { tab: 'planning', label: 'Planning' },

      ],
    },
    {
      title: 'Administration',
      items: [
        { tab: 'students', label: 'Students' },
        { tab: 'teachers', label: 'Teachers' },
        { tab: 'classStudents', label: 'Class Students' },

      ],
    },
    {
      title: 'Finance',
      items: [],
    },
    {
      title: 'Direction',
      items: [],
    },
    {
      title: 'Professeur',
      items: [],
    },
    {
      title: 'Eleve',
      items: [],
    },
    {
      title: 'Parent',
      items: [],
    },
    {
      title: 'Support',
      items: [
        { tab: 'schoolYears', label: 'School Years' },
        { tab: 'classRooms', label: 'Class Rooms' },
        { tab: 'programs', label: 'Programs' },
        { tab: 'modules', label: 'Modules' },
        { tab: 'courses', label: 'Courses' },

      ],
    },

   
  
  
   
   
   
   
  ];

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
              <div className="mt-2 space-y-3 pb-8">
                {parameterGroups.map((group) => {
                  const isGroupOpen = openGroups[group.title] ?? true;
                  return (
                    <div key={group.title} className="space-y-1">
                      <button
                        onClick={() => toggleGroup(group.title)}
                        className="flex w-full items-center justify-between rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                      >
                        <span>{group.title}</span>
                        <svg
                          className={`h-4 w-4 transition-transform ${isGroupOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isGroupOpen && (
                        <div className="ml-4 space-y-1 border-l border-gray-200 pl-4">
                          {group.items.map((item) => {
                            const isActive = activeTab === item.tab;
                            return (
                              <button
                                key={item.tab}
                                onClick={() => onTabChange(item.tab)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                  isActive
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                }`}
                              >
                                {item.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
