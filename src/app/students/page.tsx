'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

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
}

const riskCategoryColors = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200',
  unknown: 'bg-gray-100 text-gray-800 border-gray-200'
};

const riskCategoryIcons = {
  high: '🔴',
  medium: '🟡',
  low: '🟢',
  unknown: '⚪'
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
        const formatted = Object.entries(data).flatMap(([category, list]) =>
          (list as ApiStudent[]).map((s: ApiStudent) => ({
            id: s.student_id || s.id || '',
            riskCategory: category.toLowerCase() || 'unknown',
            name: s.name || s.student_name,
            lastActive: s.last_active || s.lastActive
          }))
        );

        setStudents(formatted);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching students');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

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
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Dashboard</h1>
        <p className="text-gray-600">Select a student to view their detailed information</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 overflow-x-auto">
        <div className="bg-white rounded-lg shadow p-4 border">
          <div className="text-2xl font-bold text-gray-900">{students.length}</div>
          <div className="text-sm text-gray-500">Total Students</div>
        </div>
        {Object.entries(riskCategoryCounts).map(([category, count]) => (
          <div key={category} className="bg-white rounded-lg shadow p-4 border">
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {riskCategoryIcons[category as keyof typeof riskCategoryIcons] || '⚪'}
              </span>
              <div>
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-500">
                  {category.charAt(0).toUpperCase() + category.slice(1)} Risk
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Students
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search by ID or name..."
              aria-label="Search Students by Name or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="riskFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Risk
            </label>
            <select
              id="riskFilter"
              aria-label="Filter by Risk Level"
              value={selectedRiskCategory}
              onChange={(e) => setSelectedRiskCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              id="sort"
              aria-label="Sort Students"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="id">Student ID</option>
              <option value="riskCategory">Risk Category</option>
            </select>
          </div>
        </div>

        {(searchTerm || selectedRiskCategory !== 'all') && (
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredAndSortedStudents.length} of {students.length} students
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
        <section aria-labelledby="studentList" className="bg-white rounded-lg shadow border">
          <div className="grid grid-cols-1 divide-y divide-gray-200">
            {filteredAndSortedStudents.map((student) => (
              <Link key={student.id} href={`/students/${student.id}`}>
                <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {student.name ? student.name.charAt(0).toUpperCase() : student.id.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {student.name || `Student ${student.id}`}
                        </div>
                        <div className="text-sm text-gray-500">ID: {student.id}</div>
                        {student.lastActive && (
                          <div className="text-xs text-gray-400">
                            Last active: {new Date(student.lastActive).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          riskCategoryColors[student.riskCategory as keyof typeof riskCategoryColors] ||
                          riskCategoryColors.unknown
                        }`}
                      >
                        <span className="mr-1">
                          {riskCategoryIcons[student.riskCategory as keyof typeof riskCategoryIcons] || '⚪'}
                        </span>
                        {student.riskCategory.charAt(0).toUpperCase() + student.riskCategory.slice(1)} Risk
                      </span>
                      <svg
                        className="w-5 h-5 text-gray-400"
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
  );
}
