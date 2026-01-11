'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

interface Student {
  student_id: string;
  gpa: number;
  attendance: number;
  semester: number;
  prev_gpa: number;
  failed_courses: number;
  feedback_engagement: number;
  late_assignments: number;
  forum_participation: number;
  meeting_attendance: number;
  study_group: number;
  days_active: number;
  clicks_per_week: number;
  assessments_submitted: number;
  previous_attempts: number;
  studied_credits: number;
  dropout: number;
  risk_score: number;
  risk_category: string;
}

const RISK_CONFIG: Record<string, {
  color: string;
  textColor: string;
  priority: string;
}> = {
  'Extreme Risk': {
    color: 'text-red-600 bg-red-50 border-red-200',
    textColor: 'text-red-800',
    priority: 'Critical'
  },
  'High Risk': {
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    textColor: 'text-orange-800',
    priority: 'High'
  },
  'Moderate Risk': {
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    textColor: 'text-yellow-800',
    priority: 'Medium'
  },
  'Low Risk': {
    color: 'text-green-600 bg-green-50 border-green-200',
    textColor: 'text-green-800',
    priority: 'Low'
  }
};


function getRecommendations(category: string) {
  const recommendations: Record<string, { title: string; actions: string[] }> = {
    'Extreme Risk': {
      title: 'Immediate Intervention Required',
      actions: [
        'Schedule urgent one-on-one meeting with academic advisor',
        'Assign dedicated mentor for daily check-ins',
        'Reduce course load and provide study plan restructuring',
        'Connect with counseling services for stress management',
        'Implement weekly progress monitoring with faculty'
      ]
    },
    'High Risk': {
      title: 'Proactive Support Needed',
      actions: [
        'Schedule bi-weekly meetings with academic advisor',
        'Enroll in peer tutoring program',
        'Provide time management workshops',
        'Monitor assignment submission patterns closely',
        'Encourage participation in study groups'
      ]
    },
    'Moderate Risk': {
      title: 'Preventive Measures',
      actions: [
        'Regular check-ins every 3-4 weeks',
        'Suggest attending office hours',
        'Provide resources for skill development',
        'Monitor engagement trends',
        'Offer optional tutoring sessions'
      ]
    },
    'Low Risk': {
      title: 'Maintain Current Trajectory',
      actions: [
        'Continue with standard academic support',
        'Encourage peer mentoring opportunities',
        'Provide enrichment activities',
        'Monitor for any changes in performance',
        'Celebrate successes and milestones'
      ]
    }
  };
  
  return recommendations[category] || recommendations['Low Risk'];
}

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params?.id as string;
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setError('No student ID provided');
      setLoading(false);
      return;
    }

    const fetchStudent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/students/${studentId}`);
        
        if (!response.ok) {
          throw new Error(`Student not found: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.student) {
          setStudent(data.student);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching student:', err);
        setError(err instanceof Error ? err.message : 'Failed to load student data');
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [studentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Student Data</h2>
            <p className="text-red-600 mb-4">{error || 'Student not found'}</p>
            <Link 
              href="/students" 
              className="inline-block px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Back to Students List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const riskConfig = RISK_CONFIG[student.risk_category] || RISK_CONFIG['Low Risk'];
  const recommendations = getRecommendations(student.risk_category);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/students" 
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
          >
            ← Back to Students
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Student Profile</h1>
          <p className="text-gray-600 mt-2">Detailed analytics and risk assessment</p>
        </div>

        {/* Risk Status Card */}
        <div className={`bg-white shadow rounded-lg border-l-4 ${riskConfig.color.split(' ')[2]} mb-6`}>
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{student.student_id}</h2>
                <div className="flex items-center gap-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${riskConfig.color}`}>
                    {student.risk_category}
                  </span>
                  <span className="text-gray-600">
                    Risk Score: <span className={`font-bold ${riskConfig.textColor}`}>
                      {student.risk_score?.toFixed(1)}%
                    </span>
                  </span>
                  <span className="text-gray-600">
                    Priority: <span className="font-medium">{riskConfig.priority}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">GPA</h3>
            <p className="text-3xl font-bold text-gray-900">{student.gpa?.toFixed(2) || 'N/A'}</p>
            <p className="text-sm text-gray-500 mt-1">Previous: {student.prev_gpa?.toFixed(2) || 'N/A'}</p>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Attendance</h3>
            <p className="text-3xl font-bold text-gray-900">{student.attendance?.toFixed(0) || 0}%</p>
            <p className="text-sm text-gray-500 mt-1">Meeting: {student.meeting_attendance?.toFixed(0) || 0}%</p>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Failed Courses</h3>
            <p className="text-3xl font-bold text-gray-900">{student.failed_courses || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Previous Attempts: {student.previous_attempts || 0}</p>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Semester</h3>
            <p className="text-3xl font-bold text-gray-900">{student.semester || 'N/A'}</p>
            <p className="text-sm text-gray-500 mt-1">Credits: {student.studied_credits || 0}</p>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm text-gray-600">Feedback Engagement</p>
              <p className="text-2xl font-bold text-gray-900">{student.feedback_engagement?.toFixed(0) || 0}%</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm text-gray-600">Forum Participation</p>
              <p className="text-2xl font-bold text-gray-900">{student.forum_participation || 0}</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm text-gray-600">Study Group</p>
              <p className="text-2xl font-bold text-gray-900">{student.study_group ? 'Yes' : 'No'}</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <p className="text-sm text-gray-600">Days Active</p>
              <p className="text-2xl font-bold text-gray-900">{student.days_active || 0}/7</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <p className="text-sm text-gray-600">Clicks per Week</p>
              <p className="text-2xl font-bold text-gray-900">{student.clicks_per_week || 0}</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <p className="text-sm text-gray-600">Assessments Submitted</p>
              <p className="text-2xl font-bold text-gray-900">{student.assessments_submitted || 0}</p>
            </div>
          </div>
        </div>

        {/* Performance Issues */}
        {(student.late_assignments || 0) > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Performance Concerns</h3>
            <ul className="list-disc list-inside text-yellow-700 space-y-1">
              {(student.late_assignments || 0) > 0 && (
                <li>Late Assignments: {student.late_assignments}</li>
              )}
              {(student.failed_courses || 0) > 0 && (
                <li>Failed Courses: {student.failed_courses}</li>
              )}
              {(student.attendance || 0) < 75 && (
                <li>Low Attendance: {student.attendance?.toFixed(0)}%</li>
              )}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {recommendations.title}
          </h3>
          <ul className="space-y-3">
            {recommendations.actions.map((action, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="text-gray-700">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}