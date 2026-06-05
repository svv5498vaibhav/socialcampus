/**
 * ProfilePilot AI — Interests Catalog
 *
 * Curated interests organized by branch with cross-branch mappings.
 * Used by the Interest Detection Engine.
 */

const INTEREST_CATALOG = {
  'Computer Science': [
    'Web Development', 'Mobile App Development', 'Artificial Intelligence',
    'Machine Learning', 'Data Science', 'Cyber Security', 'Cloud Computing',
    'DevOps', 'Blockchain', 'Game Development', 'Competitive Programming',
    'Open Source', 'UI/UX Design', 'Internet of Things', 'Augmented Reality',
    'Virtual Reality', 'Quantum Computing', 'Edge Computing',
  ],
  'Information Technology': [
    'Web Development', 'Cloud Computing', 'Cyber Security', 'DevOps',
    'Networking', 'Data Analytics', 'Mobile App Development',
    'Database Management', 'IT Infrastructure', 'Open Source',
    'System Administration', 'Information Security',
  ],
  'Electronics and Communication': [
    'Internet of Things', 'Embedded Systems', 'VLSI Design', 'Robotics',
    'Signal Processing', 'Wireless Communication', '5G Technology',
    'Antenna Design', 'Satellite Communication', 'PCB Design',
    'Automation', 'Drone Technology',
  ],
  'Electrical Engineering': [
    'Power Systems', 'Renewable Energy', 'Electric Vehicles', 'Smart Grid',
    'Control Systems', 'Robotics', 'Automation', 'Internet of Things',
    'Energy Storage', 'High Voltage Engineering', 'Power Electronics',
  ],
  'Electrical and Electronics': [
    'Power Systems', 'Embedded Systems', 'Automation', 'Robotics',
    'Renewable Energy', 'Internet of Things', 'Smart Grid',
    'Control Systems', 'Electric Vehicles',
  ],
  'Mechanical Engineering': [
    'CAD/CAM', 'Robotics', '3D Printing', 'Automotive Engineering',
    'Aerospace', 'HVAC', 'Manufacturing', 'Material Science',
    'Finite Element Analysis', 'Industry 4.0', 'Mechatronics',
    'Thermal Engineering', 'Product Design',
  ],
  'Civil Engineering': [
    'Structural Engineering', 'Environmental Engineering', 'Construction Management',
    'Urban Planning', 'Transportation Engineering', 'Geotechnical Engineering',
    'Green Building', 'Smart Cities', 'GIS & Remote Sensing',
    'Water Resources', 'Bridge Engineering', 'Earthquake Engineering',
  ],
  'Chemical Engineering': [
    'Process Design', 'Petrochemical', 'Pharmaceutical', 'Environmental Engineering',
    'Polymer Engineering', 'Nanotechnology', 'Green Chemistry',
    'Biochemical Engineering', 'Food Processing', 'Energy Engineering',
  ],
  'Biotechnology': [
    'Genomics', 'Bioinformatics', 'Pharmaceutical', 'Clinical Research',
    'Synthetic Biology', 'Environmental Biotechnology', 'Agricultural Biotech',
    'Drug Discovery', 'Immunology', 'Bioprocess Engineering',
  ],
  'Aerospace Engineering': [
    'Aerodynamics', 'Space Technology', 'UAV/Drone Design', 'Propulsion',
    'Satellite Systems', 'Avionics', 'Composite Materials',
    'Rocket Science', 'Flight Mechanics', 'Hypersonics',
  ],
  'Mathematics and Computing': [
    'Competitive Programming', 'Data Science', 'Machine Learning',
    'Cryptography', 'Quantum Computing', 'Statistical Modeling',
    'Algorithm Design', 'Financial Mathematics', 'Operations Research',
  ],
  'Economics': [
    'Data Analytics', 'Financial Markets', 'Econometrics', 'Public Policy',
    'Behavioral Economics', 'Development Economics', 'Game Theory',
    'International Trade', 'FinTech',
  ],
  'Physics': [
    'Quantum Physics', 'Astrophysics', 'Optics', 'Nuclear Physics',
    'Material Science', 'Computational Physics', 'Particle Physics',
  ],
  'Chemistry': [
    'Organic Chemistry', 'Analytical Chemistry', 'Material Science',
    'Pharmaceutical Chemistry', 'Environmental Chemistry', 'Nanotechnology',
  ],
};

/**
 * Universal interests (applicable to all branches)
 */
const UNIVERSAL_INTERESTS = [
  'Entrepreneurship', 'Startups', 'Public Speaking', 'Content Creation',
  'Technical Writing', 'Leadership', 'Photography', 'Volunteering',
  'Hackathons', 'Research', 'Teaching', 'Music', 'Sports', 'Fitness',
];

/**
 * Skill-to-interest mapping for collaborative filtering
 */
const SKILL_INTEREST_MAP = {
  'React': ['Web Development', 'UI/UX Design', 'Open Source'],
  'Node.js': ['Web Development', 'DevOps', 'Cloud Computing'],
  'Python': ['Machine Learning', 'Data Science', 'Automation', 'Competitive Programming'],
  'TensorFlow': ['Artificial Intelligence', 'Machine Learning', 'Data Science'],
  'Docker': ['DevOps', 'Cloud Computing'],
  'AWS': ['Cloud Computing', 'DevOps'],
  'Arduino': ['Internet of Things', 'Embedded Systems', 'Robotics'],
  'SolidWorks': ['CAD/CAM', 'Product Design', '3D Printing'],
  'MATLAB': ['Signal Processing', 'Control Systems', 'Data Science'],
  'Flutter': ['Mobile App Development'],
  'Figma': ['UI/UX Design'],
  'Solidity': ['Blockchain'],
  'Unity': ['Game Development', 'Augmented Reality', 'Virtual Reality'],
  'Linux': ['Cyber Security', 'DevOps', 'Open Source'],
  'SQL': ['Database Management', 'Data Analytics', 'Data Science'],
  'Git': ['Open Source', 'DevOps'],
};

/**
 * Get all unique interest names
 */
const getAllInterests = () => {
  const interests = new Set();
  Object.values(INTEREST_CATALOG).forEach((list) => {
    list.forEach((i) => interests.add(i));
  });
  UNIVERSAL_INTERESTS.forEach((i) => interests.add(i));
  return [...interests].sort();
};

module.exports = { INTEREST_CATALOG, UNIVERSAL_INTERESTS, SKILL_INTEREST_MAP, getAllInterests };
