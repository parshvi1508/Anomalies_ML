'use client'
import { useState } from 'react'
import { Play, Info, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'

interface PredictionResult {
  success: boolean
  anomaly_detection: {
    score: number
    is_anomaly: boolean
    interpretation: string
    dynamic_uncertainty: number
  }
  dropout_prediction: {
    probability: number
    prediction: string
    threshold_used: number
    confidence: number
    dynamic_uncertainty: number
  }
  expert_rules: {
    score: number
    interpretation: string
    dynamic_uncertainty: number
  }
  evidence_fusion: {
    belief: number
    plausibility: number
    uncertainty: number
    fusion_method: string
  }
  risk_assessment: {
    tier: string
    needs_intervention: boolean
    priority_score: number
  }
}

export default function InteractiveDemoPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form state with realistic defaults
  const [formData, setFormData] = useState({
    gpa: 2.8,
    prev_gpa: 3.0,
    attendance: 78.0,
    failed_courses: 1,
    feedback_engagement: 65.0,
    late_assignments: 25.0,
    clicks_per_week: 150,
    days_active: 4,
    assessments_submitted: 8,
    previous_attempts: 0,
    studied_credits: 15,
    semester: 3,
    forum_participation: 8,
    meeting_attendance: 78.0,
    study_group: 0
  })

  // Preset scenarios
  const scenarios = {
    excellent: {
      name: '🟢 Excellent Student',
      data: { gpa: 3.8, prev_gpa: 3.7, attendance: 95, failed_courses: 0, feedback_engagement: 90, late_assignments: 5, clicks_per_week: 300, days_active: 6, assessments_submitted: 15, previous_attempts: 0, studied_credits: 16, semester: 4, forum_participation: 25, meeting_attendance: 95, study_group: 1 }
    },
    average: {
      name: '🟡 Average Student',
      data: { gpa: 2.8, prev_gpa: 2.9, attendance: 78, failed_courses: 1, feedback_engagement: 65, late_assignments: 25, clicks_per_week: 150, days_active: 4, assessments_submitted: 8, previous_attempts: 0, studied_credits: 15, semester: 3, forum_participation: 8, meeting_attendance: 78, study_group: 0 }
    },
    struggling: {
      name: '🟠 Struggling Student',
      data: { gpa: 2.2, prev_gpa: 2.5, attendance: 65, failed_courses: 2, feedback_engagement: 45, late_assignments: 40, clicks_per_week: 80, days_active: 3, assessments_submitted: 5, previous_attempts: 1, studied_credits: 12, semester: 2, forum_participation: 3, meeting_attendance: 65, study_group: 0 }
    },
    atRisk: {
      name: '🔴 High Risk Student',
      data: { gpa: 1.8, prev_gpa: 2.0, attendance: 55, failed_courses: 3, feedback_engagement: 30, late_assignments: 60, clicks_per_week: 40, days_active: 2, assessments_submitted: 3, previous_attempts: 2, studied_credits: 10, semester: 2, forum_participation: 1, meeting_attendance: 50, study_group: 0 }
    }
  }

  const loadScenario = (scenarioKey: keyof typeof scenarios) => {
    setFormData(scenarios[scenarioKey].data)
    setResult(null)
    setError(null)
  }

  const handlePredict = async () => {
    setLoading(true)
    setError(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setResult(null) // Clear results when inputs change
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-2xl p-8 text-white">
        <div className="flex items-center space-x-4 mb-4">
          <Play className="h-12 w-12" />
          <div>
            <h1 className="text-4xl font-bold">Interactive Prediction Demo</h1>
            <p className="text-purple-100 text-lg mt-2">
              See how dynamic uncertainty adapts to model confidence in real-time
            </p>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-purple-50">
              <strong>Research Implementation:</strong> This demo uses the actual trained models with 
              dynamic entropy-based uncertainty quantification. Uncertainty values reflect genuine model 
              confidence (not simulated). Try different student profiles to observe how uncertainty 
              changes based on prediction confidence.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Scenarios */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Load Student Scenarios</h3>
        <div className="grid md:grid-cols-4 gap-4">
          {Object.entries(scenarios).map(([key, scenario]) => (
            <button
              key={key}
              onClick={() => loadScenario(key as keyof typeof scenarios)}
              className="px-4 py-3 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 hover:border-blue-400 rounded-lg transition-all text-left"
            >
              <div className="font-semibold text-slate-900">{scenario.name}</div>
              <div className="text-xs text-slate-600 mt-1">
                GPA: {scenario.data.gpa} | Attendance: {scenario.data.attendance}%
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Student Profile Input</h2>
            <button
              onClick={() => loadScenario('average')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset</span>
            </button>
          </div>

          {/* Academic Performance */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-700 text-sm uppercase">Academic Performance</h3>
            
            <InputSlider
              label="Current GPA"
              value={formData.gpa}
              onChange={(v) => handleInputChange('gpa', v)}
              min={0}
              max={4}
              step={0.1}
              unit=""
            />
            
            <InputSlider
              label="Previous GPA"
              value={formData.prev_gpa}
              onChange={(v) => handleInputChange('prev_gpa', v)}
              min={0}
              max={4}
              step={0.1}
              unit=""
            />
            
            <InputSlider
              label="Attendance"
              value={formData.attendance}
              onChange={(v) => handleInputChange('attendance', v)}
              min={0}
              max={100}
              step={1}
              unit="%"
            />
            
            <InputSlider
              label="Failed Courses"
              value={formData.failed_courses}
              onChange={(v) => handleInputChange('failed_courses', v)}
              min={0}
              max={5}
              step={1}
              unit="courses"
            />
          </div>

          {/* Engagement */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-700 text-sm uppercase">Engagement Metrics</h3>
            
            <InputSlider
              label="Feedback Engagement"
              value={formData.feedback_engagement}
              onChange={(v) => handleInputChange('feedback_engagement', v)}
              min={0}
              max={100}
              step={1}
              unit="%"
            />
            
            <InputSlider
              label="Late Assignments"
              value={formData.late_assignments}
              onChange={(v) => handleInputChange('late_assignments', v)}
              min={0}
              max={100}
              step={1}
              unit="%"
            />
            
            <InputSlider
              label="Clicks Per Week"
              value={formData.clicks_per_week}
              onChange={(v) => handleInputChange('clicks_per_week', v)}
              min={0}
              max={500}
              step={10}
              unit="clicks"
            />
            
            <InputSlider
              label="Days Active"
              value={formData.days_active}
              onChange={(v) => handleInputChange('days_active', v)}
              min={0}
              max={7}
              step={1}
              unit="days"
            />
          </div>

          {/* Other Metrics */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-700 text-sm uppercase">Additional Factors</h3>
            
            <InputSlider
              label="Assessments Submitted"
              value={formData.assessments_submitted}
              onChange={(v) => handleInputChange('assessments_submitted', v)}
              min={0}
              max={20}
              step={1}
              unit="assessments"
            />
            
            <InputSlider
              label="Previous Course Attempts"
              value={formData.previous_attempts}
              onChange={(v) => handleInputChange('previous_attempts', v)}
              min={0}
              max={5}
              step={1}
              unit="retakes"
            />
            
            <InputSlider
              label="Studied Credits"
              value={formData.studied_credits}
              onChange={(v) => handleInputChange('studied_credits', v)}
              min={6}
              max={24}
              step={1}
              unit="credits"
            />
          </div>

          <button
            onClick={handlePredict}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                <span>Run Prediction</span>
              </>
            )}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {result ? (
            <>
              {/* Risk Assessment */}
              <div className={`rounded-xl shadow-lg p-6 border-2 ${getRiskColor(result.risk_assessment.tier)}`}>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Risk Assessment</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Risk Tier:</span>
                    <span className={`px-4 py-2 rounded-full font-bold ${getRiskBadgeColor(result.risk_assessment.tier)}`}>
                      {result.risk_assessment.tier}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Intervention Needed:</span>
                    <span className="font-bold">{result.risk_assessment.needs_intervention ? '✅ Yes' : '❌ No'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Priority Score:</span>
                    <span className="font-bold">{(result.risk_assessment.priority_score * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Uncertainty Comparison */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center space-x-2 mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Dynamic Uncertainty Analysis</h3>
                  <InfoTooltip text="Lower uncertainty = higher model confidence. Uncertainty varies by prediction difficulty." />
                </div>
                
                <div className="space-y-4">
                  <UncertaintyBar
                    label="Anomaly Detection"
                    value={result.anomaly_detection.dynamic_uncertainty}
                    score={result.anomaly_detection.score}
                    method="Distance-based (boundary proximity)"
                  />
                  
                  <UncertaintyBar
                    label="Dropout Classifier"
                    value={result.dropout_prediction.dynamic_uncertainty}
                    score={result.dropout_prediction.probability}
                    method="Entropy-based (prediction confidence)"
                  />
                  
                  <UncertaintyBar
                    label="Expert Rules"
                    value={result.expert_rules.dynamic_uncertainty}
                    score={result.expert_rules.score}
                    method="Fixed (rule-based scoring)"
                  />
                  
                  <UncertaintyBar
                    label="Fused Evidence"
                    value={result.evidence_fusion.uncertainty}
                    score={(result.evidence_fusion.belief + result.evidence_fusion.plausibility) / 2}
                    method="Combined (Dempster-Shafer)"
                    highlight
                  />
                </div>
              </div>

              {/* Evidence Fusion Details */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg p-6 border border-blue-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Dempster-Shafer Evidence Fusion</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white/50 rounded-lg p-3">
                    <span className="text-sm font-medium text-slate-700">Belief (Lower Bound):</span>
                    <span className="text-lg font-bold text-blue-900">{(result.evidence_fusion.belief * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between bg-white/50 rounded-lg p-3">
                    <span className="text-sm font-medium text-slate-700">Plausibility (Upper Bound):</span>
                    <span className="text-lg font-bold text-purple-900">{(result.evidence_fusion.plausibility * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between bg-white/50 rounded-lg p-3">
                    <span className="text-sm font-medium text-slate-700">Uncertainty Interval:</span>
                    <span className="text-lg font-bold text-slate-900">{(result.evidence_fusion.uncertainty * 100).toFixed(2)}%</span>
                  </div>
                  <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                    <p className="text-xs text-blue-900">
                      <strong>Interpretation:</strong> True dropout probability lies between{' '}
                      <strong>{(result.evidence_fusion.belief * 100).toFixed(1)}%</strong> and{' '}
                      <strong>{(result.evidence_fusion.plausibility * 100).toFixed(1)}%</strong> with{' '}
                      <strong>{(result.evidence_fusion.uncertainty * 100).toFixed(1)}%</strong> ambiguity.
                      {result.evidence_fusion.uncertainty < 0.1 ? ' High confidence prediction.' : ' Moderate uncertainty - consider additional assessment.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Model Predictions */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Individual Model Outputs</h3>
                
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-700">Anomaly Detection</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.anomaly_detection.is_anomaly ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {result.anomaly_detection.interpretation}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{(result.anomaly_detection.score * 100).toFixed(1)}%</div>
                  <div className="text-xs text-slate-600 mt-1">Isolation Forest Score</div>
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-700">Dropout Prediction</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.dropout_prediction.prediction === 'Dropout' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {result.dropout_prediction.prediction}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{(result.dropout_prediction.probability * 100).toFixed(1)}%</div>
                  <div className="text-xs text-slate-600 mt-1">
                    Random Forest (threshold: {result.dropout_prediction.threshold_used})
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-700">Expert Rules</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getExpertRiskColor(result.expert_rules.score)}`}>
                      {result.expert_rules.interpretation}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{(result.expert_rules.score * 100).toFixed(1)}%</div>
                  <div className="text-xs text-slate-600 mt-1">Rule-based Assessment</div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 p-12 text-center">
              <Play className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 text-lg font-medium">
                Adjust student profile and click &quot;Run Prediction&quot;
              </p>
              <p className="text-slate-500 text-sm mt-2">
                See how dynamic uncertainty adapts to model confidence
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== HELPER COMPONENTS ====================

function InputSlider({ label, value, onChange, min, max, step, unit }: {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  unit: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-sm font-bold text-blue-600">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

function UncertaintyBar({ label, value, score, method, highlight = false }: {
  label: string
  value: number
  score: number
  method: string
  highlight?: boolean
}) {
  const getUncertaintyColor = (u: number) => {
    if (u < 0.1) return 'bg-green-500'
    if (u < 0.2) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getUncertaintyText = (u: number) => {
    if (u < 0.1) return 'High Confidence'
    if (u < 0.2) return 'Moderate Confidence'
    return 'Low Confidence'
  }

  return (
    <div className={`p-4 rounded-lg border ${highlight ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-slate-900">{label}</span>
        <span className="text-xs text-slate-600">{method}</span>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <div className="text-xs text-slate-600 mb-1">Model Score</div>
          <div className="text-lg font-bold text-slate-900">{(score * 100).toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-xs text-slate-600 mb-1">Uncertainty</div>
          <div className="text-lg font-bold text-slate-900">{(value * 100).toFixed(1)}%</div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getUncertaintyColor(value)} transition-all duration-500`}
            style={{ width: `${value * 100}%` }}
          />
        </div>
        <div className="text-xs text-slate-600 flex items-center justify-between">
          <span>{getUncertaintyText(value)}</span>
          <span>Max: 40%</span>
        </div>
      </div>
    </div>
  )
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <div className="group relative inline-block">
      <Info className="h-4 w-4 text-slate-400 cursor-help" />
      <div className="invisible group-hover:visible absolute z-10 w-64 p-2 bg-slate-900 text-white text-xs rounded-lg shadow-xl -right-2 top-6">
        {text}
        <div className="absolute -top-1 right-4 w-2 h-2 bg-slate-900 transform rotate-45" />
      </div>
    </div>
  )
}

// Helper functions
function getRiskColor(tier: string) {
  const colors: Record<string, string> = {
    'Very High': 'bg-red-50 border-red-300',
    'High': 'bg-orange-50 border-orange-300',
    'Moderate': 'bg-yellow-50 border-yellow-300',
    'Low': 'bg-green-50 border-green-300'
  }
  return colors[tier] || 'bg-slate-50 border-slate-300'
}

function getRiskBadgeColor(tier: string) {
  const colors: Record<string, string> = {
    'Very High': 'bg-red-600 text-white',
    'High': 'bg-orange-600 text-white',
    'Moderate': 'bg-yellow-600 text-white',
    'Low': 'bg-green-600 text-white'
  }
  return colors[tier] || 'bg-slate-600 text-white'
}

function getExpertRiskColor(score: number) {
  if (score > 0.6) return 'bg-red-100 text-red-800'
  if (score > 0.3) return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-800'
}
