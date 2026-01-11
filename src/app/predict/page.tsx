'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';

interface PredictionResult {
  success: boolean;
  anomaly_detection: {
    score: number;
    is_anomaly: boolean;
    interpretation: string;
    dynamic_uncertainty: number;
  };
  dropout_prediction: {
    probability: number;
    prediction: string;
    threshold_used: number;
    confidence: number;
    dynamic_uncertainty: number;
  };
  expert_rules: {
    score: number;
    interpretation: string;
    dynamic_uncertainty: number;
  };
  evidence_fusion: {
    belief: number;
    plausibility: number;
    uncertainty: number;
    fusion_method: string;
  };
  risk_assessment: {
    tier: string;
    needs_intervention: boolean;
    priority_score: number;
  };
}

export default function PredictPage() {
  const [formData, setFormData] = useState({
    gpa: '3.0',
    attendance: '85',
    semester: '4',
    prev_gpa: '3.0',
    failed_courses: '0',
    feedback_engagement: '75',
    late_assignments: '10',
    forum_participation: '5',
    meeting_attendance: '80',
    study_group: '1',
    days_active: '5',
    clicks_per_week: '20',
    assessments_submitted: '8',
    previous_attempts: '0',
    studied_credits: '15'
  });

  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          gpa: parseFloat(formData.gpa),
          attendance: parseFloat(formData.attendance),
          semester: parseInt(formData.semester),
          prev_gpa: parseFloat(formData.prev_gpa),
          failed_courses: parseInt(formData.failed_courses),
          feedback_engagement: parseFloat(formData.feedback_engagement),
          late_assignments: parseFloat(formData.late_assignments),
          forum_participation: parseInt(formData.forum_participation),
          meeting_attendance: parseFloat(formData.meeting_attendance),
          study_group: parseInt(formData.study_group),
          days_active: parseInt(formData.days_active),
          clicks_per_week: parseInt(formData.clicks_per_week),
          assessments_submitted: parseInt(formData.assessments_submitted),
          previous_attempts: parseInt(formData.previous_attempts),
          studied_credits: parseInt(formData.studied_credits)
        })
      });

      if (!response.ok) {
        throw new Error(`Prediction failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div>
      <Navigation />
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
            Dropout Risk Prediction
          </h1>
          <p className="text-gray-600 text-lg">Test the ML model with custom student data and see dynamic uncertainty</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="bg-white rounded-lg shadow-md p-6 border">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">📝 Student Information</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputField label="GPA" name="gpa" value={formData.gpa} onChange={handleChange} step="0.01" />
                <InputField label="Attendance %" name="attendance" value={formData.attendance} onChange={handleChange} />
                <InputField label="Semester" name="semester" value={formData.semester} onChange={handleChange} />
                <InputField label="Previous GPA" name="prev_gpa" value={formData.prev_gpa} onChange={handleChange} step="0.01" />
                <InputField label="Failed Courses" name="failed_courses" value={formData.failed_courses} onChange={handleChange} />
                <InputField label="Feedback Engagement %" name="feedback_engagement" value={formData.feedback_engagement} onChange={handleChange} />
                <InputField label="Late Assignments %" name="late_assignments" value={formData.late_assignments} onChange={handleChange} />
                <InputField label="Forum Posts/Week" name="forum_participation" value={formData.forum_participation} onChange={handleChange} />
                <InputField label="Meeting Attendance %" name="meeting_attendance" value={formData.meeting_attendance} onChange={handleChange} />
                <InputField label="Study Group" name="study_group" value={formData.study_group} onChange={handleChange} />
                <InputField label="Days Active/Week" name="days_active" value={formData.days_active} onChange={handleChange} />
                <InputField label="Clicks/Week" name="clicks_per_week" value={formData.clicks_per_week} onChange={handleChange} />
                <InputField label="Assessments Submitted" name="assessments_submitted" value={formData.assessments_submitted} onChange={handleChange} />
                <InputField label="Previous Attempts" name="previous_attempts" value={formData.previous_attempts} onChange={handleChange} />
                <InputField label="Credits Enrolled" name="studied_credits" value={formData.studied_credits} onChange={handleChange} />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? '🔄 Predicting...' : '🎯 Predict Dropout Risk'}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-semibold">❌ Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {result && (
              <>
                {/* Risk Assessment */}
                <div className={`rounded-lg shadow-md p-6 border-2 ${
                  result.risk_assessment.tier === 'Very High' ? 'bg-red-50 border-red-300' :
                  result.risk_assessment.tier === 'High' ? 'bg-orange-50 border-orange-300' :
                  result.risk_assessment.tier === 'Moderate' ? 'bg-yellow-50 border-yellow-300' :
                  'bg-green-50 border-green-300'
                }`}>
                  <h3 className="text-2xl font-bold mb-3">
                    {result.risk_assessment.tier === 'Very High' ? '🔴' :
                     result.risk_assessment.tier === 'High' ? '🟠' :
                     result.risk_assessment.tier === 'Moderate' ? '🟡' : '🟢'} Risk Level: {result.risk_assessment.tier}
                  </h3>
                  <p className="text-lg font-semibold">
                    {result.dropout_prediction.prediction}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Intervention {result.risk_assessment.needs_intervention ? 'Required' : 'Not Required'}
                  </p>
                </div>

                {/* Dempster-Shafer Evidence Fusion */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border-2 border-blue-200">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">📊 {result.evidence_fusion.fusion_method}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Belief (Lower Bound):</span>
                      <span className="text-2xl font-bold text-blue-600">{(result.evidence_fusion.belief * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Plausibility (Upper Bound):</span>
                      <span className="text-2xl font-bold text-purple-600">{(result.evidence_fusion.plausibility * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center bg-white rounded-lg p-3 border border-blue-300">
                      <span className="text-gray-800 font-bold">📏 Uncertainty Interval:</span>
                      <span className="text-2xl font-bold text-red-600">{(result.evidence_fusion.uncertainty * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* Dynamic Uncertainties */}
                <div className="bg-white rounded-lg shadow-md p-6 border">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">🎯 Dynamic Uncertainty (Instance-Specific)</h3>
                  <div className="space-y-3">
                    <UncertaintyBar 
                      label="Anomaly Model" 
                      value={result.anomaly_detection.dynamic_uncertainty}
                      color="bg-orange-500"
                    />
                    <UncertaintyBar 
                      label="Classifier Model" 
                      value={result.dropout_prediction.dynamic_uncertainty}
                      color="bg-blue-500"
                    />
                    <UncertaintyBar 
                      label="Expert Rules" 
                      value={result.expert_rules.dynamic_uncertainty}
                      color="bg-green-500"
                    />
                  </div>
                </div>

                {/* Detailed Results */}
                <div className="bg-white rounded-lg shadow-md p-6 border">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">📋 Detailed Results</h3>
                  <div className="space-y-4 text-sm">
                    <DetailItem label="Anomaly Detection" value={`${(result.anomaly_detection.score * 100).toFixed(1)}% - ${result.anomaly_detection.interpretation}`} />
                    <DetailItem label="Dropout Probability" value={`${(result.dropout_prediction.probability * 100).toFixed(1)}%`} />
                    <DetailItem label="Model Confidence" value={`${(result.dropout_prediction.confidence * 100).toFixed(1)}%`} />
                    <DetailItem label="Expert Rules Score" value={`${(result.expert_rules.score * 100).toFixed(1)}% - ${result.expert_rules.interpretation}`} />
                    <DetailItem label="Priority Score" value={`${(result.risk_assessment.priority_score * 100).toFixed(1)}%`} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, name, value, onChange, step = "1" }: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        step={step}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        required
      />
    </div>
  );
}

function UncertaintyBar({ label, value, color }: { label: string; value: number; color: string }) {
  const percentage = value * 100;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{percentage.toFixed(2)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div className={`${color} h-3 rounded-full transition-all`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100">
      <span className="text-gray-600">{label}:</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}
