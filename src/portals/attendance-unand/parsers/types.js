/** Shared parser data models. */

/**
 * @typedef {Object} AcademicMetricBySemester
 * @property {number} semester
 * @property {number | null} ips
 * @property {number | null} ipk
 * @property {number | null} semesterCredits
 * @property {number | null} cumulativeCredits
 */

/**
 * @typedef {Object} CumulativeAcademicSummary
 * @property {AcademicMetricBySemester[]} semesters
 * @property {number | null} currentSemester
 * @property {number | null} currentIps
 * @property {number | null} currentIpk
 * @property {number | null} passedCredits
 * @property {number | null} totalCredits
 * @property {string[]} sourceLabels
 */

/**
 * @typedef {Object} CourseHistoryRecord
 * @property {string | null} semesterLabel
 * @property {number | null} semesterNumber
 * @property {string | null} semesterCode
 * @property {string | null} courseCode
 * @property {string | null} courseName
 * @property {string | null} courseType
 * @property {number | null} gradeWeight
 * @property {string | null} gradeLabel
 * @property {number | null} credits
 * @property {string | null} krsValue
 * @property {string | null} krsStatus
 * @property {Record<string, string>} raw
 */

/**
 * @typedef {Object} AcademicAdvisingPeriod
 * @property {number} rowIndex
 * @property {string | null} advisingStatus
 * @property {string | null} semesterLabel
 * @property {string | null} academicYear
 * @property {string | null} verificationStatus
 * @property {string | null} detailUrl
 */

/**
 * @typedef {Object} AttendanceRecord
 * @property {string | null} courseCode
 * @property {string | null} courseName
 * @property {number | null} meetings
 * @property {number | null} present
 * @property {number | null} permit
 * @property {number | null} sick
 * @property {number | null} absent
 * @property {number | null} percentage
 * @property {Record<string, string>} raw
 */

export {};
