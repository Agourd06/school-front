import React, { useMemo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { usePrograms } from '../../hooks/usePrograms';
import { useSpecializations } from '../../hooks/useSpecializations';
import { useLevels } from '../../hooks/useLevels';
import { useModules } from '../../hooks/useModules';
import { useCourses } from '../../hooks/useCourses';
import { moduleApi } from '../../api/module';
import { courseApi } from '../../api/course';
import type { Program } from '../../api/program';
import type { Specialization } from '../../api/specialization';
import type { Level } from '../../api/level';
import type { Module } from '../../api/module';
import type { Course } from '../../api/course';

interface HierarchyTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'programs' | 'modules' | 'courses';
}

const HierarchyTreeModal: React.FC<HierarchyTreeModalProps> = ({
  isOpen,
  onClose,
  type,
}) => {
  const { t } = useTranslation();

  // State to track expanded items
  const [expandedPrograms, setExpandedPrograms] = useState<Set<number>>(new Set());
  const [expandedSpecializations, setExpandedSpecializations] = useState<Set<number>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [expandedCourses, setExpandedCourses] = useState<Set<number>>(new Set());
  
  // Cache for module-course and course-module relationships
  const [moduleCoursesCache, setModuleCoursesCache] = useState<Map<number, Course[]>>(new Map());
  const [courseModulesCache, setCourseModulesCache] = useState<Map<number, Module[]>>(new Map());
  const [loadingRelationships, setLoadingRelationships] = useState<Set<number>>(new Set());

  // Reset expanded state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setExpandedPrograms(new Set());
      setExpandedSpecializations(new Set());
      setExpandedModules(new Set());
      setExpandedCourses(new Set());
      setModuleCoursesCache(new Map());
      setCourseModulesCache(new Map());
      setLoadingRelationships(new Set());
    }
  }, [isOpen]);

  // Toggle program expansion
  const toggleProgram = (programId: number) => {
    setExpandedPrograms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(programId)) {
        newSet.delete(programId);
        // Also collapse all specializations under this program
        const program = programsHierarchy.find((p) => p.id === programId);
        if (program) {
          program.specializations.forEach((spec) => {
            setExpandedSpecializations((prevSpecs) => {
              const newSpecSet = new Set(prevSpecs);
              newSpecSet.delete(spec.id);
              return newSpecSet;
            });
          });
        }
      } else {
        newSet.add(programId);
      }
      return newSet;
    });
  };

  // Toggle specialization expansion
  const toggleSpecialization = (specId: number) => {
    setExpandedSpecializations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(specId)) {
        newSet.delete(specId);
      } else {
        newSet.add(specId);
      }
      return newSet;
    });
  };

  // Toggle module expansion and load courses if needed
  const toggleModule = async (moduleId: number) => {
    const isExpanded = expandedModules.has(moduleId);
    
    if (!isExpanded && !moduleCoursesCache.has(moduleId)) {
      // Load courses for this module
      setLoadingRelationships((prev) => new Set(prev).add(moduleId));
      try {
        const assignments = await moduleApi.getCourseAssignments(moduleId);
        setModuleCoursesCache((prev) => {
          const newMap = new Map(prev);
          newMap.set(moduleId, assignments.assigned || []);
          return newMap;
        });
      } catch (error) {
        console.error('Error loading courses for module:', error);
      } finally {
        setLoadingRelationships((prev) => {
          const newSet = new Set(prev);
          newSet.delete(moduleId);
          return newSet;
        });
      }
    }
    
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  // Toggle course expansion and load modules if needed
  const toggleCourse = async (courseId: number) => {
    const isExpanded = expandedCourses.has(courseId);
    
    if (!isExpanded && !courseModulesCache.has(courseId)) {
      // Load modules for this course
      setLoadingRelationships((prev) => new Set(prev).add(courseId));
      try {
        const assignments = await courseApi.getModuleAssignments(courseId);
        setCourseModulesCache((prev) => {
          const newMap = new Map(prev);
          newMap.set(courseId, assignments.assigned || []);
          return newMap;
        });
      } catch (error) {
        console.error('Error loading modules for course:', error);
      } finally {
        setLoadingRelationships((prev) => {
          const newSet = new Set(prev);
          newSet.delete(courseId);
          return newSet;
        });
      }
    }
    
    setExpandedCourses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  // Fetch data based on type
  const { data: programsResp, isLoading: isLoadingPrograms, error: programsError } = usePrograms({ 
    page: 1, 
    limit: 100 
  });
  
  const { data: allSpecializationsResp, isLoading: isLoadingSpecializations, error: specializationsError } = useSpecializations({ 
    page: 1, 
    limit: 100 
  });
  
  const { data: allLevelsResp, isLoading: isLoadingLevels, error: levelsError } = useLevels({ 
    page: 1, 
    limit: 100 
  });

  const { data: modulesResp, isLoading: isLoadingModules, error: modulesError } = useModules({ 
    page: 1, 
    limit: 100 
  });

  const { data: coursesResp, isLoading: isLoadingCourses, error: coursesError } = useCourses({ 
    page: 1, 
    limit: 100 
  });

  const programs = programsResp?.data ?? [];
  const allSpecializations = allSpecializationsResp?.data ?? [];
  const allLevels = allLevelsResp?.data ?? [];
  const modules = modulesResp?.data ?? [];
  const courses = coursesResp?.data ?? [];
  
  // Determine loading and error states based on type
  const isLoading = useMemo(() => {
    if (type === 'programs') {
      return isLoadingPrograms || isLoadingSpecializations || isLoadingLevels;
    } else if (type === 'modules') {
      return isLoadingModules;
    } else {
      return isLoadingCourses;
    }
  }, [type, isLoadingPrograms, isLoadingSpecializations, isLoadingLevels, isLoadingModules, isLoadingCourses]);

  const hasError = useMemo(() => {
    if (type === 'programs') {
      return programsError || specializationsError || levelsError;
    } else if (type === 'modules') {
      return modulesError;
    } else {
      return coursesError;
    }
  }, [type, programsError, specializationsError, levelsError, modulesError, coursesError]);

  // Build programs hierarchy structure
  const programsHierarchy = useMemo(() => {
    if (!isOpen || type !== 'programs') return [];
    
    return programs.map((program: Program) => {
      const programSpecializations = allSpecializations.filter(
        (spec: Specialization) => spec.program_id === program.id
      );

      const specializationsWithLevels = programSpecializations.map((spec: Specialization) => {
        const specLevels = allLevels.filter(
          (level: Level) => level.specialization_id === spec.id
        );
        return {
          ...spec,
          levels: specLevels,
        };
      });

      return {
        ...program,
        specializations: specializationsWithLevels,
      };
    });
  }, [programs, allSpecializations, allLevels, isOpen, type]);

  const getTitle = () => {
    switch (type) {
      case 'programs':
        return t('sections.programsHierarchy') || 'Programs Hierarchy';
      case 'modules':
        return t('sections.modulesHierarchy') || 'Modules Hierarchy';
      case 'courses':
        return t('sections.coursesHierarchy') || 'Courses Hierarchy';
      default:
        return 'Hierarchy';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-50 bg-black bg-opacity-60 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Side Panel */}
      <div 
        className={`fixed right-0 top-0 h-full w-[33%] bg-white shadow-xl border-l-2 border-gray-300 flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-200 flex-shrink-0">
          <h3 className="text-xl font-medium text-gray-900">{getTitle()}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 pr-8 border-t border-gray-100">
        {hasError ? (
          <div className="text-center text-red-500 py-8">
            {t('sections.errorLoadingData') || 'Error loading data. Please try again.'}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="ml-2 text-gray-600">{t('sections.loading') || 'Loading...'}</span>
          </div>
        ) : (() => {
          // Render based on type
          if (type === 'programs') {
            if (programsHierarchy.length === 0) {
              return (
                <div className="text-center text-gray-500 py-8">
                  {t('sections.noDataAvailable') || 'No data available'}
                </div>
              );
            }
            
            return (
              <div className="space-y-2">
                {programsHierarchy.map((program) => {
                  const isProgramExpanded = expandedPrograms.has(program.id);
                  const hasSpecializations = program.specializations.length > 0;
                  
                  return (
                    <div key={program.id} className="border-l-2 border-gray-300 pl-4 mb-2 p-2 rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div
                        className={`flex items-center gap-2 font-semibold text-lg text-gray-900 mb-1 cursor-pointer hover:text-primary transition-colors ${
                          hasSpecializations ? '' : 'cursor-default'
                        }`}
                        onClick={() => hasSpecializations && toggleProgram(program.id)}
                      >
                        {hasSpecializations && (
                          <span className="flex-shrink-0">
                            {isProgramExpanded ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronRight className="w-5 h-5" />
                            )}
                          </span>
                        )}
                        <span>{program.title}</span>
                      </div>
                      {isProgramExpanded && (
                        <>
                          {program.specializations.length === 0 ? (
                            <div className="ml-7 text-sm text-gray-500 italic">
                              {t('sections.noSpecializations') || 'No specializations'}
                            </div>
                          ) : (
                            <div className="ml-7 space-y-2">
                              {program.specializations.map((spec) => {
                                const isSpecExpanded = expandedSpecializations.has(spec.id);
                                const hasLevels = spec.levels.length > 0;
                                
                                return (
                                  <div key={spec.id} className="border-l-2 border-gray-200 pl-4 mb-1 p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                                    <div
                                      className={`flex items-center gap-2 font-medium text-base text-gray-800 mb-1 cursor-pointer hover:text-primary transition-colors ${
                                        hasLevels ? '' : 'cursor-default'
                                      }`}
                                      onClick={() => hasLevels && toggleSpecialization(spec.id)}
                                    >
                                      {hasLevels && (
                                        <span className="flex-shrink-0">
                                          {isSpecExpanded ? (
                                            <ChevronDown className="w-4 h-4" />
                                          ) : (
                                            <ChevronRight className="w-4 h-4" />
                                          )}
                                        </span>
                                      )}
                                      <span>{spec.title}</span>
                                    </div>
                                    {isSpecExpanded && (
                                      <>
                                        {spec.levels.length === 0 ? (
                                          <div className="ml-6 text-sm text-gray-500 italic">
                                            {t('sections.noLevels') || 'No levels'}
                                          </div>
                                        ) : (
                                          <div className="ml-6 space-y-1">
                                            {spec.levels.map((level) => (
                                              <div key={level.id} className="text-sm text-gray-700">
                                                {level.title}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          } else if (type === 'modules') {
            if (modules.length === 0) {
              return (
                <div className="text-center text-gray-500 py-8">
                  {t('sections.noDataAvailable') || 'No data available'}
                </div>
              );
            }
            
            return (
              <div className="space-y-2">
                {modules.map((module: Module) => {
                  const isModuleExpanded = expandedModules.has(module.id);
                  const moduleCourses = moduleCoursesCache.get(module.id) || [];
                  const isLoadingModuleCourses = loadingRelationships.has(module.id);
                  
                  return (
                    <div key={module.id} className="border-l-2 border-gray-300 pl-4 mb-2 p-2 rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div
                        className="flex items-center gap-2 font-semibold text-lg text-gray-900 mb-1 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => toggleModule(module.id)}
                      >
                        <span className="flex-shrink-0">
                          {isModuleExpanded ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </span>
                        <span>{module.title}</span>
                      </div>
                      {isModuleExpanded && (
                        <>
                          {isLoadingModuleCourses ? (
                            <div className="ml-7 flex items-center gap-2 text-sm text-gray-500">
                              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                              <span>{t('sections.loading') || 'Loading...'}</span>
                            </div>
                          ) : moduleCourses.length === 0 ? (
                            <div className="ml-7 text-sm text-gray-500 italic">
                              {t('sections.noCourses') || 'No courses'}
                            </div>
                          ) : (
                            <div className="ml-7 space-y-1">
                              {moduleCourses.map((course) => (
                                <div key={course.id} className="text-sm text-gray-700">
                                  {course.title}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          } else {
            // type === 'courses'
            if (courses.length === 0) {
              return (
                <div className="text-center text-gray-500 py-8">
                  {t('sections.noDataAvailable') || 'No data available'}
                </div>
              );
            }
            
            return (
              <div className="space-y-2">
                {courses.map((course: Course) => {
                  const isCourseExpanded = expandedCourses.has(course.id);
                  const courseModules = courseModulesCache.get(course.id) || [];
                  const isLoadingCourseModules = loadingRelationships.has(course.id);
                  
                  return (
                    <div key={course.id} className="border-l-2 border-gray-300 pl-4 mb-2 p-2 rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div
                        className="flex items-center gap-2 font-semibold text-lg text-gray-900 mb-1 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => toggleCourse(course.id)}
                      >
                        <span className="flex-shrink-0">
                          {isCourseExpanded ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </span>
                        <span>{course.title}</span>
                      </div>
                      {isCourseExpanded && (
                        <>
                          {isLoadingCourseModules ? (
                            <div className="ml-7 flex items-center gap-2 text-sm text-gray-500">
                              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                              <span>{t('sections.loading') || 'Loading...'}</span>
                            </div>
                          ) : courseModules.length === 0 ? (
                            <div className="ml-7 text-sm text-gray-500 italic">
                              {t('sections.noModules') || 'No modules'}
                            </div>
                          ) : (
                            <div className="ml-7 space-y-1">
                              {courseModules.map((module) => (
                                <div key={module.id} className="text-sm text-gray-700">
                                  {module.title}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          }
        })()}
        </div>
      </div>
    </>
  );
};

export default HierarchyTreeModal;
