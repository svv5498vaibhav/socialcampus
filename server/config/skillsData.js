/**
 * ProfilePilot AI — Skills Catalog
 *
 * Curated skills organized by branch and semester tier.
 * Used by the Skill Recommendation Engine.
 */

const SKILL_CATALOG = {
  // ═══════════════════════════════════════════
  // COMPUTER SCIENCE & IT
  // ═══════════════════════════════════════════
  'Computer Science': {
    foundation: ['C Programming', 'Python', 'HTML', 'CSS', 'JavaScript', 'Git', 'Linux', 'Mathematics', 'Logic Building'],
    core: ['Data Structures', 'Algorithms', 'Java', 'OOP', 'DBMS', 'SQL', 'Operating Systems', 'Computer Networks', 'Discrete Mathematics'],
    advanced: ['React', 'Node.js', 'Express.js', 'MongoDB', 'REST APIs', 'System Design', 'Docker', 'Cloud Computing', 'TypeScript', 'GraphQL', 'Redis'],
    specialization: ['Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Kubernetes', 'Microservices', 'CI/CD', 'AWS', 'Distributed Systems', 'Blockchain'],
  },
  'Information Technology': {
    foundation: ['C Programming', 'Python', 'HTML', 'CSS', 'JavaScript', 'Git', 'Linux', 'Networking Basics'],
    core: ['Data Structures', 'Algorithms', 'Java', 'DBMS', 'SQL', 'Computer Networks', 'Web Development', 'Operating Systems'],
    advanced: ['React', 'Node.js', 'MongoDB', 'Cloud Computing', 'Cyber Security', 'Docker', 'DevOps', 'REST APIs'],
    specialization: ['AWS', 'Azure', 'Kubernetes', 'Penetration Testing', 'Network Security', 'Terraform', 'CI/CD', 'Site Reliability'],
  },
  // ═══════════════════════════════════════════
  // ELECTRONICS
  // ═══════════════════════════════════════════
  'Electronics and Communication': {
    foundation: ['C Programming', 'Python', 'Circuit Analysis', 'Electronics Basics', 'Mathematics', 'Physics'],
    core: ['Signal Processing', 'Analog Electronics', 'Digital Electronics', 'Microprocessors', 'VLSI', 'Communication Systems', 'Embedded C'],
    advanced: ['IoT', 'Arduino', 'Raspberry Pi', 'PCB Design', 'MATLAB', 'Antenna Design', 'FPGA', 'Wireless Communication'],
    specialization: ['5G Technology', 'Satellite Communication', 'Robotics', 'Machine Learning', 'Edge Computing', 'ASIC Design'],
  },
  'Electrical Engineering': {
    foundation: ['C Programming', 'Mathematics', 'Physics', 'Circuit Theory', 'Electronics Basics'],
    core: ['Power Systems', 'Electrical Machines', 'Control Systems', 'Electromagnetics', 'Signal Processing', 'Instrumentation'],
    advanced: ['Power Electronics', 'Renewable Energy', 'MATLAB', 'Simulink', 'PLC Programming', 'SCADA', 'IoT'],
    specialization: ['Smart Grid', 'Electric Vehicles', 'High Voltage Engineering', 'Robotics', 'Machine Learning for Energy'],
  },
  'Electrical and Electronics': {
    foundation: ['C Programming', 'Mathematics', 'Physics', 'Electronics Basics', 'Circuit Analysis'],
    core: ['Power Systems', 'Digital Electronics', 'Microprocessors', 'Control Systems', 'Electrical Machines'],
    advanced: ['IoT', 'Embedded Systems', 'MATLAB', 'Power Electronics', 'PLC Programming', 'Renewable Energy'],
    specialization: ['Smart Grid', 'Robotics', 'Electric Vehicles', 'Edge Computing', 'Automation'],
  },
  // ═══════════════════════════════════════════
  // MECHANICAL
  // ═══════════════════════════════════════════
  'Mechanical Engineering': {
    foundation: ['Engineering Drawing', 'Mathematics', 'Physics', 'Workshop Practice', 'C Programming'],
    core: ['Thermodynamics', 'Fluid Mechanics', 'Strength of Materials', 'Manufacturing Processes', 'Machine Design', 'Kinematics'],
    advanced: ['CAD/CAM', 'SolidWorks', 'AutoCAD', 'ANSYS', 'CNC Programming', 'Robotics', '3D Printing'],
    specialization: ['Finite Element Analysis', 'CFD', 'Automotive Engineering', 'Aerospace Engineering', 'HVAC', 'Industry 4.0'],
  },
  // ═══════════════════════════════════════════
  // CIVIL
  // ═══════════════════════════════════════════
  'Civil Engineering': {
    foundation: ['Engineering Drawing', 'Mathematics', 'Physics', 'Surveying', 'Geology'],
    core: ['Structural Analysis', 'Concrete Technology', 'Geotechnical Engineering', 'Fluid Mechanics', 'Environmental Engineering'],
    advanced: ['AutoCAD', 'STAAD Pro', 'ETABS', 'GIS', 'Remote Sensing', 'Construction Management', 'BIM'],
    specialization: ['Earthquake Engineering', 'Bridge Engineering', 'Transportation Engineering', 'Green Building', 'Smart Cities'],
  },
  // ═══════════════════════════════════════════
  // CHEMICAL
  // ═══════════════════════════════════════════
  'Chemical Engineering': {
    foundation: ['Mathematics', 'Chemistry', 'Physics', 'C Programming', 'Material Science'],
    core: ['Chemical Process Calculations', 'Thermodynamics', 'Fluid Mechanics', 'Heat Transfer', 'Mass Transfer', 'Chemical Reaction Engineering'],
    advanced: ['Process Design', 'ASPEN', 'MATLAB', 'Process Control', 'Environmental Engineering', 'Polymer Engineering'],
    specialization: ['Biochemical Engineering', 'Petrochemical', 'Nanotechnology', 'Pharmaceutical', 'Green Chemistry'],
  },
  // ═══════════════════════════════════════════
  // OTHERS
  // ═══════════════════════════════════════════
  'Biotechnology': {
    foundation: ['Biology', 'Chemistry', 'Mathematics', 'Python', 'Microbiology'],
    core: ['Genetics', 'Biochemistry', 'Molecular Biology', 'Cell Biology', 'Biostatistics', 'Immunology'],
    advanced: ['Bioinformatics', 'Genomics', 'Proteomics', 'R Programming', 'Drug Design', 'Bioprocess Engineering'],
    specialization: ['CRISPR', 'Synthetic Biology', 'AI in Biology', 'Clinical Research', 'Pharmaceutical Biotechnology'],
  },
  'Aerospace Engineering': {
    foundation: ['Mathematics', 'Physics', 'C Programming', 'Engineering Drawing', 'Workshop Practice'],
    core: ['Aerodynamics', 'Flight Mechanics', 'Propulsion', 'Aircraft Structures', 'Space Mechanics'],
    advanced: ['CFD', 'ANSYS', 'MATLAB', 'Composite Materials', 'Control Systems', 'Avionics'],
    specialization: ['Satellite Systems', 'Rocket Propulsion', 'UAV Design', 'Space Technology', 'Hypersonics'],
  },
};

/**
 * Get semester tier from semester number
 */
const getSemesterTier = (semester) => {
  const sem = parseInt(semester, 10);
  if (sem <= 2) return 'foundation';
  if (sem <= 4) return 'core';
  if (sem <= 6) return 'advanced';
  return 'specialization';
};

/**
 * Get all tiers up to current semester
 */
const getTiersUpTo = (semester) => {
  const tiers = ['foundation', 'core', 'advanced', 'specialization'];
  const currentTier = getSemesterTier(semester);
  const index = tiers.indexOf(currentTier);
  return tiers.slice(0, index + 1);
};

/**
 * Get all unique skill names across all branches
 */
const getAllSkills = () => {
  const skills = new Set();
  Object.values(SKILL_CATALOG).forEach((branch) => {
    Object.values(branch).forEach((tier) => {
      tier.forEach((skill) => skills.add(skill));
    });
  });
  return [...skills].sort();
};

/**
 * Career goal to skill boost mapping
 */
const CAREER_SKILL_BOOST = {
  'Web Development': ['React', 'Node.js', 'JavaScript', 'TypeScript', 'MongoDB', 'HTML', 'CSS', 'REST APIs', 'GraphQL'],
  'AI/ML': ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Deep Learning', 'Mathematics', 'Statistics', 'R Programming'],
  'Data Science': ['Python', 'R Programming', 'SQL', 'Statistics', 'Machine Learning', 'Data Visualization', 'Pandas', 'NumPy'],
  'Cyber Security': ['Linux', 'Networking', 'Penetration Testing', 'Python', 'Network Security', 'Cryptography', 'Ethical Hacking'],
  'App Development': ['React Native', 'Flutter', 'Dart', 'JavaScript', 'Swift', 'Kotlin', 'Firebase', 'REST APIs'],
  'Cloud Computing': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Linux', 'Networking'],
  'DevOps': ['Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'Terraform', 'AWS', 'Linux', 'Git', 'Monitoring'],
  'UI/UX Design': ['Figma', 'Adobe XD', 'Sketch', 'CSS', 'JavaScript', 'User Research', 'Prototyping', 'Design Systems'],
  'Blockchain': ['Solidity', 'Web3.js', 'Ethereum', 'Smart Contracts', 'Cryptography', 'JavaScript', 'Python'],
  'Game Development': ['Unity', 'C#', 'Unreal Engine', 'C++', '3D Modeling', 'Physics', 'Game Design', 'Blender'],
  'Embedded Systems': ['Embedded C', 'Arduino', 'Raspberry Pi', 'RTOS', 'IoT', 'Circuit Design', 'FPGA'],
  'Robotics': ['Python', 'ROS', 'Arduino', 'MATLAB', 'Control Systems', 'Embedded C', 'Computer Vision', 'Sensors'],
};

module.exports = { SKILL_CATALOG, getSemesterTier, getTiersUpTo, getAllSkills, CAREER_SKILL_BOOST };
