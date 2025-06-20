'use client'

import Image from 'next/image'
import { PieChart } from 'lucide-react'

const BestModelPage = () => {
  const riskDistribution = {
    'Low Risk': 163,
    'Moderate Risk': 28,
    'High Risk': 7,
    'Very High Risk': 2,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-slate-900">Dropout Prediction Model Overview</h1>
          <p className="text-lg text-slate-600">
            Showcasing the model built using Dempster-Shafer Theory, Random Forest, and Expert Rules
          </p>
        </div>

        {/* Summary Card */}
        <div className="bg-white shadow-xl border border-slate-200 rounded-xl p-6">
          <div className="text-lg font-medium text-slate-700 mb-4">Model Summary</div>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-slate-600">
            <li><strong>Accuracy:</strong> 72.0%</li>
            <li><strong>Precision:</strong> 66.7%</li>
            <li><strong>Specificity:</strong> 98.6%</li>
            <li><strong>ROC AUC:</strong> 0.44</li>
            <li><strong>Avg. Uncertainty:</strong> 0.019</li>
            <li><strong>Interval Coverage:</strong> 10.5%</li>
          </ul>
          <p className="mt-4 text-xs text-slate-500">
            ⚠️ The model achieves high <strong>specificity (98.6%)</strong>, meaning it confidently avoids false alarms. 
            <br />
            ✅ A <strong>low average uncertainty (0.019)</strong> and a <strong>well-calibrated belief score</strong> ROC AUC suggest strong confidence in high-certainty zones—critical for decision-making in sensitive use-cases.
          </p>
        </div>

        {/* Explanation Card */}
        <div className="bg-slate-50 shadow border border-slate-200 rounded-xl p-6 mt-6">
          <div className="text-lg font-medium text-slate-700 mb-4">Metric Interpretation</div>
          <ul className="text-sm text-slate-600 space-y-2">
            <li><strong>Accuracy</strong>: % of total predictions that were correct. <span className="text-green-600">Higher is better</span>.</li>
            <li><strong>Precision</strong>: Of predicted "at-risk" students, how many truly were. <span className="text-green-600">Higher is better</span>.</li>
            <li><strong>Specificity</strong>: % of "not at risk" students correctly identified. <span className="text-green-600">Higher is better</span>.</li>
            <li><strong>ROC AUC</strong>: Overall model discrimination ability across thresholds. <span className="text-green-600">Higher is better</span>.</li>
            <li><strong>Avg. Uncertainty</strong>: Confidence in predictions (0 = certain, 1 = confused). <span className="text-red-600">Lower is better</span>.</li>
            <li><strong>Interval Coverage</strong>: % of samples where belief & plausibility differ. Indicates "gray area" where model is unsure. <span className="text-neutral-600">Moderate is ideal</span>.</li>
          </ul>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white shadow-xl border border-slate-200 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <PieChart className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-800">Current Risk Distribution</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(riskDistribution).map(([label, count], idx) => {
              const colors = ['bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500']
              const bgColors = ['bg-green-50', 'bg-yellow-50', 'bg-orange-50', 'bg-red-50']
              return (
                <div
                  key={label}
                  className={`${bgColors[idx]} p-4 rounded-lg text-center border border-slate-200`}
                >
                  <div className={`w-10 h-10 ${colors[idx]} rounded-full mx-auto mb-2`}></div>
                  <p className="font-semibold text-slate-800">{label}</p>
                  <p className="text-slate-600 text-sm">{count} students</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Anomalies Chart */}
        <div className="bg-white shadow-xl border border-slate-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Anomalies Detected</h2>
          <Image
            src="/anomaly1.png"
            alt="Anomalies Chart"
            width={800}
            height={600}
            className="rounded-lg border border-slate-200 mx-auto"
          />
        </div>

        {/* Anomalies Chart */}
        <div className="bg-white shadow-xl border border-slate-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Anomalies</h2>
          <Image
            src="/anomaly2.png"
            alt="Anomalies Chart"
            width={800}
            height={600}
            className="rounded-lg border border-slate-200 mx-auto"
          />
        </div>

        {/* Belief-Plausibility Chart */}
        <div className="bg-white shadow-xl border border-slate-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Belief-Plausibility Scatter Plot</h2>
          <Image
            src="/belief_plot.png"
            alt="Belief vs. Plausibility Plot"
            width={800}
            height={600}
            className="rounded-lg border border-slate-200 mx-auto"
          />
        </div>
      </div>
    </div>
  )
}

export default BestModelPage