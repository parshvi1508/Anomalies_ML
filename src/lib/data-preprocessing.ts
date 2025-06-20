// src/lib/data-processing.ts
import Papa from 'papaparse'

export interface StudentData {
  student_id: string
  gpa: number
  attendance: number
  semester: number
  prev_gpa: number
  failed_courses: number
  feedback_engagement: number
  late_assignments: number
  forum_participation: number
  meeting_attendance: number
  study_group: number
  days_active: number
  clicks_per_week: number
  assessments_submitted: number
  previous_attempts: number
  studied_credits: number
  dropout: number
}

export interface BoxplotData {
  feature: string
  nonDropout: {
    min: number
    q1: number
    median: number
    q3: number
    max: number
  }
  dropout: {
    min: number
    q1: number
    median: number
    q3: number
    max: number
  }
}

export interface AnalyticsResult {
  totalStudents: number
  dropoutRate: string
  averageGPA: string
  averageAttendance: string
  gpaDistribution: Array<{ range: string; count: number }>
  attendanceDistribution: Array<{ range: string; count: number }>
  failedCoursesDistribution: Array<{ failed_courses: number; count: number }>
  scatterData: Array<{ gpa: number; attendance: number; dropout: number }>
  correlationData: Array<{ feature: string; correlation: number }>
  semesterData: Array<{ semester: number; avgGPA: number; avgAttendance: number; dropoutRate: number }>
  boxplotData: BoxplotData[]
  featureComparisons: Array<{ feature: string; dropout_avg: number; non_dropout_avg: number }>
  histogramData?: unknown
}

export class DataProcessor {
  static parseCSV(file: File): Promise<StudentData[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results: unknown) => {
          if (results.errors.length > 0) {
            reject(results.errors)
          } else {
            resolve(results.data as StudentData[])
          }
        },
        error: (error: unknown) => reject(error)
      })
    })
  }

  static generateRealAnalytics(students: StudentData[]): AnalyticsResult {
    const totalStudents = students.length
    const dropouts = students.filter(s => s.dropout === 1).length
    const dropoutRate = (dropouts / totalStudents * 100).toFixed(1)

    // Real GPA Distribution
    const gpaRanges = { '0-1': 0, '1-2': 0, '2-3': 0, '3-4': 0 }
    students.forEach(student => {
      const gpa = student.gpa
      if (gpa <= 1) gpaRanges['0-1']++
      else if (gpa <= 2) gpaRanges['1-2']++
      else if (gpa <= 3) gpaRanges['2-3']++
      else gpaRanges['3-4']++
    })

    // Real Attendance Distribution
    const attendanceRanges = { '50-60': 0, '60-70': 0, '70-80': 0, '80-90': 0, '90-100': 0 }
    students.forEach(student => {
      const att = student.attendance
      if (att < 60) attendanceRanges['50-60']++
      else if (att < 70) attendanceRanges['60-70']++
      else if (att < 80) attendanceRanges['70-80']++
      else if (att < 90) attendanceRanges['80-90']++
      else attendanceRanges['90-100']++
    })

    // Failed Courses Distribution
    const failedCoursesCount: { [key: number]: number } = {}
    students.forEach(student => {
      const failed = student.failed_courses
      failedCoursesCount[failed] = (failedCoursesCount[failed] || 0) + 1
    })

    // Feature Distributions by Dropout Status
    const dropoutStudents = students.filter(s => s.dropout === 1)
    const nonDropoutStudents = students.filter(s => s.dropout === 0)

    // Boxplot Data for Key Features
    const boxplotFeatures = ['gpa', 'attendance', 'feedback_engagement', 'clicks_per_week'] as const
    const boxplotData: BoxplotData[] = boxplotFeatures.map(feature => {
      const nonDropoutValues = nonDropoutStudents.map(s => s[feature])
      const dropoutValues = dropoutStudents.map(s => s[feature])
      
      return {
        feature,
        nonDropout: {
          min: Math.min(...nonDropoutValues),
          q1: this.percentile(nonDropoutValues, 25),
          median: this.percentile(nonDropoutValues, 50),
          q3: this.percentile(nonDropoutValues, 75),
          max: Math.max(...nonDropoutValues)
        },
        dropout: {
          min: Math.min(...dropoutValues),
          q1: this.percentile(dropoutValues, 25),
          median: this.percentile(dropoutValues, 50),
          q3: this.percentile(dropoutValues, 75),
          max: Math.max(...dropoutValues)
        }
      }
    })

    // Generate histogram data
    const histogramData = this.generateHistogramData(students)

    // Correlation Data
    const correlationData = this.calculateCorrelations(students)

    // Semester Performance
    const semesterData = this.groupBySemester(students)

    return {
      totalStudents,
      dropoutRate,
      averageGPA: (students.reduce((sum, s) => sum + s.gpa, 0) / totalStudents).toFixed(2),
      averageAttendance: (students.reduce((sum, s) => sum + s.attendance, 0) / totalStudents).toFixed(1),
      gpaDistribution: Object.entries(gpaRanges).map(([range, count]) => ({ range, count })),
      attendanceDistribution: Object.entries(attendanceRanges).map(([range, count]) => ({ range, count })),
      failedCoursesDistribution: Object.entries(failedCoursesCount).map(([failed, count]) => ({
        failed_courses: parseInt(failed),
        count
      })),
      scatterData: students.map(student => ({
        gpa: student.gpa,
        attendance: student.attendance,
        dropout: student.dropout
      })),
      correlationData,
      semesterData,
      boxplotData,
      featureComparisons: this.generateFeatureComparisons(dropoutStudents, nonDropoutStudents),
      histogramData
    }
  }

  static percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0
    const sorted = arr.slice().sort((a, b) => a - b)
    const index = (p / 100) * (sorted.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    const weight = index % 1
    return sorted[lower] * (1 - weight) + sorted[upper] * weight
  }

  static calculateCorrelations(students: StudentData[]) {
    const features = ['gpa', 'attendance', 'failed_courses', 'feedback_engagement', 'clicks_per_week'] as const
    return features.map(feature => {
      const correlation = this.pearsonCorrelation(
        students.map(s => s[feature]),
        students.map(s => s.dropout)
      )
      return { feature, correlation: Math.abs(correlation) }
    }).sort((a, b) => b.correlation - a.correlation)
  }

  static pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length
    if (n === 0) return 0
    
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)
    
    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
    
    return denominator === 0 ? 0 : numerator / denominator
  }

  static groupBySemester(students: StudentData[]) {
    const semesterGroups: { [key: number]: StudentData[] } = {}
    students.forEach(student => {
      if (!semesterGroups[student.semester]) {
        semesterGroups[student.semester] = []
      }
      semesterGroups[student.semester].push(student)
    })

    return Object.entries(semesterGroups).map(([semester, studentList]) => ({
      semester: parseInt(semester),
      avgGPA: studentList.reduce((sum, s) => sum + s.gpa, 0) / studentList.length,
      avgAttendance: studentList.reduce((sum, s) => sum + s.attendance, 0) / studentList.length,
      dropoutRate: (studentList.filter(s => s.dropout === 1).length / studentList.length) * 100
    })).sort((a, b) => a.semester - b.semester)
  }

  static generateFeatureComparisons(dropoutStudents: StudentData[], nonDropoutStudents: StudentData[]) {
    const features = ['gpa', 'attendance', 'feedback_engagement', 'clicks_per_week', 'failed_courses'] as const
    
    return features.map(feature => ({
      feature,
      dropout_avg: dropoutStudents.length > 0 ? 
        dropoutStudents.reduce((sum, s) => sum + s[feature], 0) / dropoutStudents.length : 0,
      non_dropout_avg: nonDropoutStudents.length > 0 ?
        nonDropoutStudents.reduce((sum, s) => sum + s[feature], 0) / nonDropoutStudents.length : 0
    }))
  }

  static generateHistogramData(students: StudentData[]) {
    const dropoutStudents = students.filter(s => s.dropout === 1)
    const nonDropoutStudents = students.filter(s => s.dropout === 0)

    const features = ['gpa', 'attendance', 'failed_courses', 'feedback_engagement', 'clicks_per_week']
    const histogramData: unknown = {}

    features.forEach(feature => {
      const ranges = this.createRanges(feature, students)
      histogramData[feature] = ranges.map(range => ({
        range: range.label,
        nonDropout: this.countInRange(nonDropoutStudents, feature, range.min, range.max),
        dropout: this.countInRange(dropoutStudents, feature, range.min, range.max)
      }))
    })

    return histogramData
  }

  static createRanges(feature: string, students: StudentData[]) {
    const values = students.map(s => s[feature as keyof StudentData] as number)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const step = (max - min) / 10

    const ranges = []
    for (let i = 0; i < 10; i++) {
      const rangeMin = min + (step * i)
      const rangeMax = min + (step * (i + 1))
      ranges.push({
        label: `${rangeMin.toFixed(1)}-${rangeMax.toFixed(1)}`,
        min: rangeMin,
        max: rangeMax
      })
    }
    return ranges
  }

  static countInRange(students: StudentData[], feature: string, min: number, max: number) {
    return students.filter(s => {
      const value = s[feature as keyof StudentData] as number
      return value >= min && value <= max
    }).length
  }
}
