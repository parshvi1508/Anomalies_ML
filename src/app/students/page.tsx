'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

interface Student {
  id: string;
  riskCategory: string;
  name?: string;
  lastActive?: string;
}

interface ApiStudent {
  student_id?: string;
  id?: string;
  name?: string;
  student_name?: string;
  last_active?: string;
  lastActive?: string;
  risk_category?: string;
}

const riskCategoryColors = {
  'extreme risk': 'bg-red-100 text-red-800 border-red-200',
  'high risk': 'bg-orange-100 text-orange-800 border-orange-200',
  'moderate risk': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'low risk': 'bg-green-100 text-green-800 border-green-200',
  'high': 'bg-orange-100 text-orange-800 border-orange-200',
  'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'low': 'bg-green-100 text-green-800 border-green-200',
  'unknown': 'bg-gray-100 text-gray-800 border-gray-200'
};

const riskCategoryIcons = {
  'extreme risk': '🔴',
  'high risk': '🟠',
  'moderate risk': '🟡',
  'low risk': '🟢',
  'high': '🟠',
  'medium': '🟡',
  'low': '🟢',
  'unknown': '⚪'
};

const riskCategoryBgColors = {
  'extreme risk': 'bg-red-50 border-red-200',
  'high risk': 'bg-orange-50 border-orange-200',
  'moderate risk': 'bg-yellow-50 border-yellow-200',
  'low risk': 'bg-green-50 border-green-200',
  'high': 'bg-orange-50 border-orange-200',
  'medium': 'bg-yellow-50 border-yellow-200',
  'low': 'bg-green-50 border-green-200',
  'unknown': 'bg-gray-50 border-gray-200'
};

// Function to normalize risk category names
const normalizeRiskCategory = (category: string): string => {
  if (!category) return 'unknown';
  const normalized = category.toLowerCase().trim();
  
  // Map various risk category formats to consistent names
  if (normalized.includes('extreme')) return 'extreme risk';
  if (normalized.includes('high')) return 'high risk';
  if (normalized.includes('moderate') || normalized.includes('medium')) return 'moderate risk';
  if (normalized.includes('low')) return 'low risk';
  
  return normalized;
};

export default function StudentListPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRiskCategory, setSelectedRiskCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'id' | 'riskCategory'>('id');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/students');
        if (!response.ok) throw new Error(`Failed to fetch students: ${response.statusText}`);

        const data = await response.json();
        console.log('API Response:', data); // Debug log to see actual data structure
        
        // Handle backend response format: { success: true, students: [...] }
        let studentsArray = [];
        
        if (Array.isArray(data)) {
          // Direct array response
          studentsArray = data;
        } else if (data.students && Array.isArray(data.students)) {
          // Backend format: { success: true, students: [...] }
          studentsArray = data.students;
        } else if (typeof data === 'object' && !data.students) {
          // Grouped by category format: { "High Risk": [...], "Low Risk": [...] }
          studentsArray = Object.entries(data).flatMap(([category, list]) =>
            (list as ApiStudent[]).map((s: ApiStudent) => ({
              ...s,
              risk_category: s.risk_category || category
            }))
          );
        }
        
        const formatted = studentsArray.map((s: ApiStudent) => ({
          id: s.student_id || s.id || '',
          riskCategory: normalizeRiskCategory(s.risk_category || 'unknown'),
          name: s.name || s.student_name,
          lastActive: s.last_active || s.lastActive
        }));

        console.log('API Response:', data);
        console.log('Formatted students:', formatted);
        console.log('Risk categories found:', [...new Set(formatted.map(s => s.riskCategory))]);
        setStudents(formatted);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching students');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Get unique risk categories from actual data
  const availableRiskCategories = useMemo(() => {
    const categories = [...new Set(students.map(s => s.riskCategory))];
    return categories.filter(cat => cat && cat !== 'unknown').sort();
  }, [students]);

  const filteredAndSortedStudents = useMemo(() => {
    const filtered = students.filter(student => {
      const matchesSearch = student.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.name && student.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRiskCategory = selectedRiskCategory === 'all' || student.riskCategory === selectedRiskCategory;
      return matchesSearch && matchesRiskCategory;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'id') return a.id.localeCompare(b.id);
      return a.riskCategory.localeCompare(b.riskCategory);
    });
  }, [students, searchTerm, selectedRiskCategory, sortBy]);

  const riskCategoryCounts = useMemo(() => {
    return students.reduce((acc, student) => {
      acc[student.riskCategory] = (acc[student.riskCategory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [students]);

  const handleSortChange = (val: string) => {
    if (val === 'id' || val === 'riskCategory') setSortBy(val);
  };

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4 w-48"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navigation />
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Students</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">Student Dashboard</h1>
        <p className="text-gray-600 text-lg">Select a student to view their detailed information</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-5 border-2 border-blue-200">
          <div className="text-3xl font-bold text-blue-900 mb-1">{students.length}</div>
          <div className="text-sm font-medium text-blue-700">Total Students</div>
        </div>
        {Object.entries(riskCategoryCounts)
          .filter(([category]) => category !== 'unknown')
          .map(([category, count]) => (
          <div key={category} className={`rounded-lg shadow-md p-5 border-2 ${riskCategoryBgColors[category as keyof typeof riskCategoryBgColors] || 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {riskCategoryIcons[category as keyof typeof riskCategoryIcons] || '⚪'}
              </span>
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{count}</div>
                <div className="text-sm font-semibold text-gray-700 capitalize">
                  {category}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-2">
              🔍 Search Students
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search by ID or name..."
              aria-label="Search Students by Name or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Only show risk filter if we have risk categories */}
          {availableRiskCategories.length > 0 && (
            <div className="md:w-56">
              <label htmlFor="riskFilter" className="block text-sm font-semibold text-gray-700 mb-2">
                🎯 Filter by Risk
              </label>
              <select
                id="riskFilter"
                aria-label="Filter by Risk Level"
                value={selectedRiskCategory}
                onChange={(e) => setSelectedRiskCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              >
                <option value="all">All Risk Levels</option>
                {availableRiskCategories.map(category => (
                  <option key={category} value={category} className="capitalize">
                    {category}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="md:w-48">
            <label htmlFor="sort" className="block text-sm font-semibold text-gray-700 mb-2">
              📊 Sort By
            </label>
            <select
              id="sort"
              aria-label="Sort Students"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            >
              <option value="id">Student ID</option>
              <option value="riskCategory">Risk Category</option>
            </select>
          </div>
        </div>

        {(searchTerm || selectedRiskCategory !== 'all') && (
          <div className="mt-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-700">\n            📋 Showing {filteredAndSortedStudents.length} of {students.length} students
          </div>
        )}
      </div>

      {/* Student List */}
      {filteredAndSortedStudents.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center border">
          <div className="text-gray-400 text-6xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
          <p className="text-gray-500">
            {searchTerm || selectedRiskCategory !== 'all'
              ? 'Try adjusting your search criteria or filters.'
              : 'No students are currently available.'}
          </p>
        </div>
      ) : (
        <section aria-labelledby="studentList" className="bg-white rounded-lg shadow-md border">
          <div className="grid grid-cols-1 divide-y divide-gray-100">
            {filteredAndSortedStudents.map((student) => (
              <Link key={student.id} href={`/students/${student.id}`}>
                <div className="p-5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                          <span className="text-white font-bold text-base">
                            {student.name ? student.name.charAt(0).toUpperCase() : student.id.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {student.name || `Student ${student.id}`}
                        </div>
                        <div className="text-sm text-gray-600">ID: {student.id}</div>
                        {student.lastActive && (
                          <div className="text-xs text-gray-500 mt-1">
                            Last active: {new Date(student.lastActive).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border-2 capitalize shadow-sm ${
                          riskCategoryColors[student.riskCategory as keyof typeof riskCategoryColors] ||
                          riskCategoryColors.unknown
                        }`}
                      >
                        <span className="mr-1.5 text-base">
                          {riskCategoryIcons[student.riskCategory as keyof typeof riskCategoryIcons] || '⚪'}
                        </span>
                        {student.riskCategory}
                      </span>
                      <svg
                        className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
    </div>
  );
}