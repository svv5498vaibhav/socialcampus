const collegeData = require('../config/colleges.json');

// Build lookup maps for fast access
const collegesByDomain = new Map();
const collegesByName = new Map();

collegeData.colleges.forEach((college) => {
  collegesByName.set(college.name.toLowerCase(), college);
  college.emailDomains.forEach((domain) => {
    collegesByDomain.set(domain.toLowerCase(), college);
  });
});

const disposableDomains = new Set(
  collegeData.disposableEmailDomains.map((d) => d.toLowerCase())
);

/**
 * Find college by email domain
 */
const findCollegeByEmail = (email) => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;
  return collegesByDomain.get(domain) || null;
};

/**
 * Find college by name
 */
const findCollegeByName = (name) => {
  return collegesByName.get(name.toLowerCase()) || null;
};

/**
 * Validate college email domain
 */
const isValidCollegeEmail = (email) => {
  return findCollegeByEmail(email) !== null;
};

/**
 * Check if email is from a disposable domain
 */
const isDisposableEmail = (email) => {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? disposableDomains.has(domain) : false;
};

/**
 * Validate roll number format for a college
 */
const isValidRollNumber = (rollNumber, collegeName) => {
  const college = findCollegeByName(collegeName);
  if (!college) return { valid: false, error: 'College not found in database' };

  const pattern = new RegExp(college.rollNumberPattern);
  const isValid = pattern.test(rollNumber.toUpperCase());

  return {
    valid: isValid,
    error: isValid ? null : `Roll number format doesn't match ${college.name} pattern (e.g., ${college.rollNumberExample})`,
    expectedFormat: college.rollNumberExample,
  };
};

/**
 * Validate branch for a college
 */
const isValidBranch = (branch, collegeName) => {
  const college = findCollegeByName(collegeName);
  if (!college) return { valid: false, error: 'College not found' };

  const branchLower = branch.toLowerCase();
  const isValid = college.branches.some((b) => b.toLowerCase() === branchLower);

  return {
    valid: isValid,
    error: isValid ? null : `Branch "${branch}" is not offered at ${college.name}`,
    availableBranches: college.branches,
  };
};

/**
 * Validate semester for a college
 */
const isValidSemester = (semester, collegeName) => {
  const college = findCollegeByName(collegeName);
  if (!college) return { valid: false, error: 'College not found' };

  const semNum = parseInt(semester, 10);
  const isValid = semNum >= 1 && semNum <= college.maxSemester;

  return {
    valid: isValid,
    error: isValid ? null : `Semester must be between 1 and ${college.maxSemester}`,
    maxSemester: college.maxSemester,
  };
};

/**
 * Get all colleges
 */
const getAllColleges = () => {
  return collegeData.colleges.map((c) => ({
    name: c.name,
    code: c.code,
    type: c.type,
    branches: c.branches,
    maxSemester: c.maxSemester,
    emailDomains: c.emailDomains,
  }));
};

/**
 * Check email-college consistency
 */
const isEmailCollegeConsistent = (email, collegeName) => {
  const collegeFromEmail = findCollegeByEmail(email);
  if (!collegeFromEmail) return { consistent: false, error: 'Email domain not recognized' };

  return {
    consistent: collegeFromEmail.name.toLowerCase() === collegeName.toLowerCase(),
    detectedCollege: collegeFromEmail.name,
    error: collegeFromEmail.name.toLowerCase() !== collegeName.toLowerCase()
      ? `Email domain belongs to ${collegeFromEmail.name}, not ${collegeName}`
      : null,
  };
};

module.exports = {
  findCollegeByEmail,
  findCollegeByName,
  isValidCollegeEmail,
  isDisposableEmail,
  isValidRollNumber,
  isValidBranch,
  isValidSemester,
  getAllColleges,
  isEmailCollegeConsistent,
};
