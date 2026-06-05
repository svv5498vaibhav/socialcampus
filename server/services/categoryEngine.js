/**
 * Category Classification Engine - Keyword frequency matcher
 */

const CATEGORIES_KEYWORD_MAP = {
  infrastructure: [
    /wifi/i, /internet/i, /water/i, /geyser/i, /lift/i, /elevator/i, /toilet/i, /washroom/i,
    /building/i, /renovation/i, /cleaning/i, /canteen/i, /roads/i, /parking/i, /power cut/i, /electricity/i
  ],
  academics: [
    /exam/i, /syllabus/i, /marks/i, /lecture/i, /notes/i, /semester/i, /credit/i, /grading/i,
    /course/i, /curriculum/i, /assignment/i, /attendance/i, /result/i, /classroom/i, /project/i
  ],
  faculty: [
    /professor/i, /teacher/i, /instructor/i, /teaching/i, /faculty/i, /hod/i, /dean/i, /guide/i,
    /advisor/i, /lecturer/i
  ],
  events: [
    /fest/i, /cultural/i, /hackathon/i, /competition/i, /concert/i, /sports/i, /club/i, /auditorium/i,
    /workshop/i, /seminar/i, /celebration/i
  ],
  placement: [
    /placement/i, /jobs/i, /salary/i, /interview/i, /resume/i, /recruiter/i, /internship/i, /ctc/i,
    /offer letter/i, /career/i, /mock interview/i
  ],
  hostel: [
    /hostel/i, /warden/i, /mess/i, /room rent/i, /laundry/i, /boarding/i, /curfew/i, /security guard/i,
    /dormitory/i, /hostelite/i
  ],
  library: [
    /book/i, /library/i, /librarian/i, /reading room/i, /journal/i, /reference/i, /fine/i, /catalog/i
  ],
  labs: [
    /lab/i, /computer/i, /chemistry/i, /physics/i, /equipment/i, /beaker/i, /microscope/i, /software/i,
    /apparatus/i, /practical/i
  ],
  administration: [
    /fees/i, /id card/i, /fine/i, /refund/i, /registration/i, /admin/i, /scholarship/i, /office/i,
    /chancellor/i, /clearance/i, /document/i
  ]
};

class CategoryEngine {
  /**
   * Automatically classify text into a target category
   * @param {string} text 
   * @returns {string} One of the category enums
   */
  static classify(text) {
    if (!text || typeof text !== 'string') {
      return 'general';
    }

    const matchesMap = {};
    let maxMatches = 0;
    let classifiedCategory = 'general';

    for (const [category, patterns] of Object.entries(CATEGORIES_KEYWORD_MAP)) {
      let count = 0;
      for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
          count += matches.length;
        }
      }
      matchesMap[category] = count;

      if (count > maxMatches) {
        maxMatches = count;
        classifiedCategory = category;
      }
    }

    return classifiedCategory;
  }
}

module.exports = CategoryEngine;
