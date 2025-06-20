// app/students/[id]/page.tsx
import path from 'path';
import fs from 'fs';
import csv from 'csv-parser';
import { notFound } from 'next/navigation';

// Types for better type safety
interface Student {
  student_id: string;
  risk_category: 'Extreme Risk' | 'High Risk' | 'Moderate Risk' | 'Low Risk';
  risk_score: number;
  name?: string;
  email?: string;
  course?: string;
  enrollment_date?: string;
  completion_rate?: number;
  avg_score?: number;
}

interface PageProps {
  params: { id: string };
}

// Risk level configuration with colors and icons
const RISK_CONFIG = {
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

function getRecommendations(category: Student['risk_category']) {
  const recommendations = {
    'Extreme Risk': [
      {
        title: 'Immediate Academic Support',
        description: 'Schedule personalized academic mentoring sessions twice a week',
        urgency: 'immediate'
      },
      {
        title: 'Progress Monitoring',
        description: 'Establish weekly progress reviews with adaptive goal setting',
        urgency: 'immediate'
      },
      {
        title: 'Accessibility Support',
        description: 'Provide alternative content formats (audio summaries, transcripts, etc.)',
        urgency: 'within_week'
      },
      {
        title: 'Time Management Framework',
        description: 'Implement structured time-management with Pomodoro technique and habit-tracking',
        urgency: 'within_week'
      }
    ],
    'High Risk': [
      {
        title: 'Targeted Study Support',
        description: 'Distribute targeted study aids focused on weak areas from assessments',
        urgency: 'within_week'
      },
      {
        title: 'Microlearning Approach',
        description: 'Segment content into microlearning units with checkpoints',
        urgency: 'within_week'
      },
      {
        title: 'Peer Learning',
        description: 'Encourage participation in small peer-led study cohorts',
        urgency: 'within_month'
      },
      {
        title: 'Gamification',
        description: 'Use gamified tasks and badges to motivate engagement',
        urgency: 'within_month'
      }
    ],
    'Moderate Risk': [
      {
        title: 'Productivity Enhancement',
        description: 'Introduce Pomodoro technique with built-in break timers',
        urgency: 'within_month'
      },
      {
        title: 'Guided Learning',
        description: 'Enable guided content walkthroughs with explanations',
        urgency: 'within_month'
      },
      {
        title: 'Progress Tracking',
        description: 'Add interactive progress indicators in learning materials',
        urgency: 'optional'
      }
    ],
    'Low Risk': [
      {
        title: 'Advanced Learning',
        description: 'Recommend advanced elective modules or research topics',
        urgency: 'optional'
      },
      {
        title: 'Peer Mentoring',
        description: 'Nominate as peer mentor to support others and enhance mastery',
        urgency: 'optional'
      },
      {
        title: 'Enrichment Activities',
        description: 'Suggest participation in academic clubs or hackathons',
        urgency: 'optional'
      }
    ]
  };
  
  return recommendations[category] || [];
}

// Utility function to get risk level description
function getRiskDescription(category: Student['risk_category']) {
  const descriptions = {
    'Extreme Risk': 'Student requires immediate intervention and intensive support',
    'High Risk': 'Student needs additional support and monitoring',
    'Moderate Risk': 'Student would benefit from targeted assistance',
    'Low Risk': 'Student is performing well and may benefit from advanced opportunities'
  };
  
  return descriptions[category];
}

// Helper function to read student data
async function getStudentData(studentId: string): Promise<Student | null> {
  const filePath = path.join(process.cwd(), 'uploads', 'student_data_with_risk.csv');
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error('Student data file not found:', filePath);
    return null;
  }

  return new Promise((resolve, reject) => {
    const students: Student[] = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        students.push({
          ...row,
          risk_score: parseFloat(row.risk_score) || 0,
          completion_rate: row.completion_rate ? parseFloat(row.completion_rate) : undefined,
          avg_score: row.avg_score ? parseFloat(row.avg_score) : undefined
        });
      })
      .on('end', () => {
        const student = students.find((s) => s.student_id === studentId);
        resolve(student || null);
      })
      .on('error', (error) => {
        console.error('Error reading CSV file:', error);
        reject(error);
      });
  });
}

export default async function StudentPage({ params }: PageProps) {
  try {
    const student = await getStudentData(params.id);
    
    if (!student) {
      notFound();
    }

    const riskConfig = RISK_CONFIG[student.risk_category];
    const recommendations = getRecommendations(student.risk_category);
    const riskDescription = getRiskDescription(student.risk_category);

    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {student.name || `Student ${student.student_id}`}
          </h1>
          <p className="text-gray-600">ID: {student.student_id}</p>
        </div>

        {/* Risk Assessment Card */}
        <div className={`rounded-lg border-2 p-6 mb-8 ${riskConfig.color}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold mb-1">Risk Assessment</h2>
              <p className={`text-sm ${riskConfig.textColor}`}>{riskDescription}</p>
            </div>
            <div className="text-right">
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${riskConfig.color}`}>
                {riskConfig.priority} Priority
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Risk Level</p>
              <p className={`text-lg font-bold ${riskConfig.textColor}`}>
                {student.risk_category}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Risk Score</p>
              <p className={`text-lg font-bold ${riskConfig.textColor}`}>
                {student.risk_score.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className={`text-lg font-bold ${riskConfig.textColor}`}>
                {student.completion_rate ? `${student.completion_rate.toFixed(1)}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Student Details */}
        {(student.course || student.email || student.enrollment_date) && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Student Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {student.course && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Course</p>
                  <p className="text-gray-900">{student.course}</p>
                </div>
              )}
              {student.email && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-gray-900">{student.email}</p>
                </div>
              )}
              {student.enrollment_date && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Enrollment Date</p>
                  <p className="text-gray-900">{student.enrollment_date}</p>
                </div>
              )}
              {student.avg_score && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-gray-900">{student.avg_score.toFixed(1)}%</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Recommended Interventions</h3>
          <div className="space-y-4">
            {recommendations.map((rec, idx) => (
              <div 
                key={idx} 
                className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r"
              >
                <h4 className="font-medium text-gray-900 mb-1">{rec.title}</h4>
                <p className="text-gray-700 text-sm mb-2">{rec.description}</p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  rec.urgency === 'immediate' ? 'bg-red-100 text-red-800' :
                  rec.urgency === 'within_week' ? 'bg-orange-100 text-orange-800' :
                  rec.urgency === 'within_month' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {rec.urgency === 'immediate' ? 'Immediate' :
                   rec.urgency === 'within_week' ? 'Within 1 Week' :
                   rec.urgency === 'within_month' ? 'Within 1 Month' :
                   'Optional'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
    
  } catch (error) {
    console.error('Error loading student data:', error);
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Student Data</h2>
          <p className="text-red-700">
            There was an error loading the student information. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}