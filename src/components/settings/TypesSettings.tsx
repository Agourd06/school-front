import React, { useState } from 'react';
import StudentLinkTypesSection from '../sections/StudentLinkTypesSection';
import ClassRoomTypesSection from './ClassRoomTypesSection';

type TypesSubTab = 'linkTypes' | 'classRoomTypes';

const TypesSettings: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<TypesSubTab>('linkTypes');

  const subTabs: Array<{ id: TypesSubTab; label: string }> = [
    { id: 'linkTypes', label: 'Link Types' },
    { id: 'classRoomTypes', label: 'Class Room Types' },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSubTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Sub-tab Content */}
      <div>
        {activeSubTab === 'linkTypes' && <StudentLinkTypesSection />}
        {activeSubTab === 'classRoomTypes' && <ClassRoomTypesSection />}
      </div>
    </div>
  );
};

export default TypesSettings;

