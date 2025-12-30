'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Star, Clock, TrendingUp, Sparkles, AlertCircle } from 'lucide-react'

interface Recommendation {
  course_id: string
  title: string
  difficulty: string
  duration_weeks: number
  domain: string
  platform: string
  rating: number
  hybrid_score?: number
  adjusted_score?: number
  content_score?: number
  cf_score?: number
  rule_score?: number
  popularity_score?: number
}

interface RecommendationsResponse {
  user_id: string
  algorithm: string
  recommendations: Recommendation[]
  count: number
}

export default function RecommendationsPage() {
  const [userId, setUserId] = useState('U001')
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [topN, setTopN] = useState(5)

  const fetchRecommendations = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/recommendations?user_id=${userId}&top_n=${topN}&explanation=${showExplanation}`
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.statusText}`)
      }

      const data: RecommendationsResponse = await response.json()
      setRecommendations(data.recommendations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations')
      setRecommendations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-3">
            <Sparkles className="h-10 w-10 text-indigo-600" />
            <h1 className="text-4xl font-bold text-slate-900">
              Course Recommendations
            </h1>
          </div>
          <p className="text-lg text-slate-600">
            Personalized course suggestions powered by hybrid AI recommender system
          </p>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                User ID
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., U001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Number of Recommendations
              </label>
              <select
                value={topN}
                onChange={(e) => setTopN(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="explanation"
                checked={showExplanation}
                onChange={(e) => setShowExplanation(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="explanation" className="text-sm font-medium text-slate-700">
                Show score breakdown
              </label>
            </div>

            <button
              onClick={fetchRecommendations}
              disabled={loading}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Get Recommendations'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Recommendations Grid */}
        {!loading && recommendations.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                Recommended for {userId}
              </h2>
              <span className="text-sm text-slate-600">
                {recommendations.length} courses found
              </span>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {recommendations.map((course, index) => (
                <div
                  key={course.course_id}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-slate-200 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="flex items-center justify-center w-8 h-8 bg-indigo-600 text-white rounded-full font-bold text-sm">
                          {index + 1}
                        </span>
                        <h3 className="text-xl font-bold text-slate-900">
                          {course.title}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(course.difficulty)}`}>
                          {course.difficulty}
                        </span>
                        <span className="flex items-center text-sm text-slate-600">
                          <Clock className="h-4 w-4 mr-1" />
                          {course.duration_weeks} weeks
                        </span>
                        <span className="flex items-center text-sm text-slate-600">
                          <BookOpen className="h-4 w-4 mr-1" />
                          {course.domain}
                        </span>
                        <span className="flex items-center text-sm text-slate-600">
                          <Star className="h-4 w-4 mr-1 text-yellow-500" />
                          {course.rating.toFixed(1)}
                        </span>
                      </div>

                      <div className="text-sm text-slate-700 mb-2">
                        <strong>Platform:</strong> {course.platform}
                      </div>

                      {/* Score Visualization */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-slate-700">
                            Match Score
                          </span>
                          <span className="text-sm font-bold text-indigo-600">
                            {((course.hybrid_score || course.adjusted_score || 0) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${(course.hybrid_score || course.adjusted_score || 0) * 100}%`
                            }}
                          />
                        </div>
                      </div>

                      {/* Score Breakdown */}
                      {showExplanation && course.content_score !== undefined && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <h4 className="text-sm font-semibold text-slate-700 mb-2">
                            Score Breakdown
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div className="bg-blue-50 p-2 rounded">
                              <div className="text-slate-600">Content-Based</div>
                              <div className="font-bold text-blue-700">
                                {(course.content_score * 100).toFixed(0)}%
                              </div>
                            </div>
                            <div className="bg-green-50 p-2 rounded">
                              <div className="text-slate-600">Collaborative</div>
                              <div className="font-bold text-green-700">
                                {((course.cf_score || 0) * 100).toFixed(0)}%
                              </div>
                            </div>
                            <div className="bg-yellow-50 p-2 rounded">
                              <div className="text-slate-600">Rule-Based</div>
                              <div className="font-bold text-yellow-700">
                                {((course.rule_score || 0) * 100).toFixed(0)}%
                              </div>
                            </div>
                            <div className="bg-purple-50 p-2 rounded">
                              <div className="text-slate-600">Popularity</div>
                              <div className="font-bold text-purple-700">
                                {((course.popularity_score || 0) * 100).toFixed(0)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && recommendations.length === 0 && !error && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-slate-200">
            <TrendingUp className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No Recommendations Yet
            </h3>
            <p className="text-slate-600">
              Enter a User ID and click &quot;Get Recommendations&quot; to see personalized course suggestions.
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
          <h3 className="font-semibold text-indigo-900 mb-2 flex items-center">
            <Sparkles className="h-5 w-5 mr-2" />
            How It Works
          </h3>
          <ul className="text-sm text-indigo-800 space-y-1 list-disc list-inside">
            <li><strong>Content-Based:</strong> Matches courses to your learning history and preferences</li>
            <li><strong>Collaborative Filtering:</strong> Finds courses liked by users similar to you</li>
            <li><strong>Rule-Based:</strong> Applies smart rules based on your profile and goals</li>
            <li><strong>Popularity:</strong> Considers highly-rated and trending courses</li>
            <li><strong>Hybrid Fusion:</strong> Combines all methods for optimal recommendations</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
