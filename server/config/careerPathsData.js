/**
 * ProfilePilot AI — Career Paths & Roadmap Data
 *
 * Career path definitions with skill/interest alignment scores.
 * Semester-wise learning roadmaps per career goal.
 */

const CAREER_PATHS = [
  {
    id: 'web_dev',
    name: 'Web Development',
    icon: '🌐',
    description: 'Build modern web applications with cutting-edge frameworks',
    alignedBranches: ['Computer Science', 'Information Technology', 'Mathematics and Computing'],
    keySkills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB', 'TypeScript', 'REST APIs'],
    keyInterests: ['Web Development', 'Open Source', 'UI/UX Design'],
  },
  {
    id: 'ai_ml',
    name: 'AI / Machine Learning',
    icon: '🤖',
    description: 'Build intelligent systems that learn and adapt',
    alignedBranches: ['Computer Science', 'Mathematics and Computing', 'Electronics and Communication'],
    keySkills: ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Deep Learning', 'Mathematics', 'Statistics'],
    keyInterests: ['Artificial Intelligence', 'Machine Learning', 'Data Science', 'Research'],
  },
  {
    id: 'data_science',
    name: 'Data Science',
    icon: '📊',
    description: 'Extract insights from data to drive decisions',
    alignedBranches: ['Computer Science', 'Mathematics and Computing', 'Information Technology', 'Economics'],
    keySkills: ['Python', 'R Programming', 'SQL', 'Statistics', 'Machine Learning', 'Data Visualization'],
    keyInterests: ['Data Science', 'Data Analytics', 'Machine Learning'],
  },
  {
    id: 'cyber_security',
    name: 'Cyber Security',
    icon: '🔒',
    description: 'Protect systems, networks, and data from threats',
    alignedBranches: ['Computer Science', 'Information Technology'],
    keySkills: ['Linux', 'Networking', 'Penetration Testing', 'Python', 'Network Security', 'Cryptography'],
    keyInterests: ['Cyber Security', 'Information Security', 'Networking'],
  },
  {
    id: 'app_dev',
    name: 'App Development',
    icon: '📱',
    description: 'Build mobile applications for iOS and Android',
    alignedBranches: ['Computer Science', 'Information Technology'],
    keySkills: ['React Native', 'Flutter', 'Dart', 'JavaScript', 'Swift', 'Kotlin', 'Firebase'],
    keyInterests: ['Mobile App Development', 'UI/UX Design'],
  },
  {
    id: 'cloud_devops',
    name: 'Cloud & DevOps',
    icon: '☁️',
    description: 'Design cloud infrastructure and automate deployments',
    alignedBranches: ['Computer Science', 'Information Technology'],
    keySkills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux', 'Git'],
    keyInterests: ['Cloud Computing', 'DevOps', 'System Administration'],
  },
  {
    id: 'ui_ux',
    name: 'UI/UX Design',
    icon: '🎨',
    description: 'Design beautiful and intuitive user experiences',
    alignedBranches: ['Computer Science', 'Information Technology'],
    keySkills: ['Figma', 'Adobe XD', 'CSS', 'JavaScript', 'User Research', 'Prototyping'],
    keyInterests: ['UI/UX Design', 'Web Development', 'Content Creation'],
  },
  {
    id: 'blockchain',
    name: 'Blockchain',
    icon: '⛓️',
    description: 'Build decentralized applications and smart contracts',
    alignedBranches: ['Computer Science', 'Mathematics and Computing'],
    keySkills: ['Solidity', 'Web3.js', 'Ethereum', 'Smart Contracts', 'Cryptography', 'JavaScript'],
    keyInterests: ['Blockchain', 'FinTech', 'Cryptography'],
  },
  {
    id: 'embedded',
    name: 'Embedded Systems',
    icon: '🔌',
    description: 'Program hardware and build IoT devices',
    alignedBranches: ['Electronics and Communication', 'Electrical Engineering', 'Electrical and Electronics'],
    keySkills: ['Embedded C', 'Arduino', 'Raspberry Pi', 'RTOS', 'IoT', 'Circuit Design'],
    keyInterests: ['Embedded Systems', 'Internet of Things', 'Robotics'],
  },
  {
    id: 'robotics',
    name: 'Robotics',
    icon: '🦾',
    description: 'Build autonomous machines and intelligent robots',
    alignedBranches: ['Mechanical Engineering', 'Electronics and Communication', 'Electrical Engineering'],
    keySkills: ['Python', 'ROS', 'Arduino', 'MATLAB', 'Control Systems', 'Computer Vision'],
    keyInterests: ['Robotics', 'Automation', 'Internet of Things', 'Mechatronics'],
  },
  {
    id: 'game_dev',
    name: 'Game Development',
    icon: '🎮',
    description: 'Create interactive games and virtual worlds',
    alignedBranches: ['Computer Science', 'Information Technology'],
    keySkills: ['Unity', 'C#', 'Unreal Engine', 'C++', '3D Modeling', 'Game Design'],
    keyInterests: ['Game Development', 'Augmented Reality', 'Virtual Reality'],
  },
  {
    id: 'product_design',
    name: 'Product Design & CAD',
    icon: '🏗️',
    description: 'Design and simulate mechanical products and structures',
    alignedBranches: ['Mechanical Engineering', 'Civil Engineering', 'Aerospace Engineering'],
    keySkills: ['SolidWorks', 'AutoCAD', 'ANSYS', 'CATIA', '3D Printing', 'Finite Element Analysis'],
    keyInterests: ['CAD/CAM', 'Product Design', '3D Printing', 'Manufacturing'],
  },
];

/**
 * Semester-wise roadmaps per career goal
 */
const ROADMAP_TEMPLATES = {
  'Web Development': [
    { semester: 1, topics: [
      { name: 'HTML & CSS', category: 'Foundation', priority: 'high' },
      { name: 'JavaScript Basics', category: 'Foundation', priority: 'high' },
      { name: 'Git & GitHub', category: 'Tooling', priority: 'medium' },
      { name: 'Responsive Design', category: 'Foundation', priority: 'medium' },
    ]},
    { semester: 2, topics: [
      { name: 'JavaScript Advanced (ES6+)', category: 'Foundation', priority: 'high' },
      { name: 'DOM Manipulation', category: 'Core', priority: 'high' },
      { name: 'CSS Frameworks (Tailwind/Bootstrap)', category: 'Tooling', priority: 'medium' },
      { name: 'Basic Projects', category: 'Practice', priority: 'high' },
    ]},
    { semester: 3, topics: [
      { name: 'React.js', category: 'Core', priority: 'high' },
      { name: 'State Management', category: 'Core', priority: 'high' },
      { name: 'Node.js & Express', category: 'Core', priority: 'high' },
      { name: 'REST API Design', category: 'Core', priority: 'medium' },
    ]},
    { semester: 4, topics: [
      { name: 'MongoDB & Mongoose', category: 'Core', priority: 'high' },
      { name: 'Authentication (JWT)', category: 'Advanced', priority: 'high' },
      { name: 'Full Stack Projects', category: 'Practice', priority: 'high' },
      { name: 'TypeScript', category: 'Advanced', priority: 'medium' },
    ]},
    { semester: 5, topics: [
      { name: 'System Design Basics', category: 'Advanced', priority: 'high' },
      { name: 'Testing (Jest, Cypress)', category: 'Advanced', priority: 'medium' },
      { name: 'GraphQL', category: 'Advanced', priority: 'medium' },
      { name: 'Docker', category: 'DevOps', priority: 'medium' },
    ]},
    { semester: 6, topics: [
      { name: 'Cloud Deployment (AWS/Vercel)', category: 'DevOps', priority: 'high' },
      { name: 'CI/CD Pipelines', category: 'DevOps', priority: 'medium' },
      { name: 'Performance Optimization', category: 'Specialization', priority: 'medium' },
      { name: 'Portfolio & Open Source', category: 'Career', priority: 'high' },
    ]},
    { semester: 7, topics: [
      { name: 'Microservices Architecture', category: 'Specialization', priority: 'medium' },
      { name: 'Next.js / SSR', category: 'Specialization', priority: 'high' },
      { name: 'WebSockets & Real-time', category: 'Specialization', priority: 'medium' },
      { name: 'Internship Prep', category: 'Career', priority: 'high' },
    ]},
    { semester: 8, topics: [
      { name: 'Capstone Project', category: 'Practice', priority: 'high' },
      { name: 'System Design Interview Prep', category: 'Career', priority: 'high' },
      { name: 'DSA Practice', category: 'Career', priority: 'high' },
    ]},
  ],
  'AI / Machine Learning': [
    { semester: 1, topics: [
      { name: 'Python Programming', category: 'Foundation', priority: 'high' },
      { name: 'Mathematics (Linear Algebra)', category: 'Foundation', priority: 'high' },
      { name: 'Statistics Basics', category: 'Foundation', priority: 'high' },
    ]},
    { semester: 2, topics: [
      { name: 'NumPy & Pandas', category: 'Foundation', priority: 'high' },
      { name: 'Data Visualization (Matplotlib)', category: 'Foundation', priority: 'medium' },
      { name: 'Probability & Statistics', category: 'Core', priority: 'high' },
    ]},
    { semester: 3, topics: [
      { name: 'Machine Learning Fundamentals', category: 'Core', priority: 'high' },
      { name: 'Scikit-learn', category: 'Core', priority: 'high' },
      { name: 'Feature Engineering', category: 'Core', priority: 'medium' },
    ]},
    { semester: 4, topics: [
      { name: 'Deep Learning (Neural Networks)', category: 'Advanced', priority: 'high' },
      { name: 'TensorFlow / Keras', category: 'Advanced', priority: 'high' },
      { name: 'Computer Vision (OpenCV)', category: 'Advanced', priority: 'medium' },
    ]},
    { semester: 5, topics: [
      { name: 'NLP (Natural Language Processing)', category: 'Specialization', priority: 'high' },
      { name: 'PyTorch', category: 'Advanced', priority: 'medium' },
      { name: 'Model Deployment (Flask/FastAPI)', category: 'Advanced', priority: 'medium' },
    ]},
    { semester: 6, topics: [
      { name: 'Reinforcement Learning', category: 'Specialization', priority: 'medium' },
      { name: 'MLOps Basics', category: 'DevOps', priority: 'medium' },
      { name: 'Research Paper Reading', category: 'Career', priority: 'high' },
      { name: 'Kaggle Competitions', category: 'Practice', priority: 'high' },
    ]},
    { semester: 7, topics: [
      { name: 'Generative AI / LLMs', category: 'Specialization', priority: 'high' },
      { name: 'Advanced NLP (Transformers)', category: 'Specialization', priority: 'high' },
      { name: 'Research Project', category: 'Practice', priority: 'high' },
    ]},
    { semester: 8, topics: [
      { name: 'Thesis / Capstone', category: 'Practice', priority: 'high' },
      { name: 'ML System Design', category: 'Career', priority: 'high' },
      { name: 'Interview Prep', category: 'Career', priority: 'high' },
    ]},
  ],
  'Data Science': [
    { semester: 1, topics: [{ name: 'Python', category: 'Foundation', priority: 'high' }, { name: 'Statistics', category: 'Foundation', priority: 'high' }, { name: 'SQL', category: 'Foundation', priority: 'high' }] },
    { semester: 2, topics: [{ name: 'Pandas & NumPy', category: 'Foundation', priority: 'high' }, { name: 'Data Cleaning', category: 'Core', priority: 'high' }, { name: 'Visualization', category: 'Core', priority: 'medium' }] },
    { semester: 3, topics: [{ name: 'Machine Learning', category: 'Core', priority: 'high' }, { name: 'EDA', category: 'Core', priority: 'high' }, { name: 'R Programming', category: 'Core', priority: 'medium' }] },
    { semester: 4, topics: [{ name: 'Advanced ML', category: 'Advanced', priority: 'high' }, { name: 'Big Data (Spark)', category: 'Advanced', priority: 'medium' }, { name: 'A/B Testing', category: 'Advanced', priority: 'medium' }] },
    { semester: 5, topics: [{ name: 'Deep Learning', category: 'Specialization', priority: 'high' }, { name: 'NLP', category: 'Specialization', priority: 'medium' }, { name: 'Cloud (AWS/GCP)', category: 'DevOps', priority: 'medium' }] },
    { semester: 6, topics: [{ name: 'Time Series', category: 'Specialization', priority: 'medium' }, { name: 'Dashboard (Tableau/PowerBI)', category: 'Tooling', priority: 'high' }, { name: 'Portfolio Projects', category: 'Career', priority: 'high' }] },
    { semester: 7, topics: [{ name: 'MLOps', category: 'DevOps', priority: 'medium' }, { name: 'Case Studies', category: 'Career', priority: 'high' }] },
    { semester: 8, topics: [{ name: 'Capstone', category: 'Practice', priority: 'high' }, { name: 'Interview Prep', category: 'Career', priority: 'high' }] },
  ],
};

// Default roadmap for career paths without a specific template
const DEFAULT_ROADMAP = [
  { semester: 1, topics: [{ name: 'Domain Fundamentals', category: 'Foundation', priority: 'high' }, { name: 'Core Language', category: 'Foundation', priority: 'high' }] },
  { semester: 2, topics: [{ name: 'Intermediate Concepts', category: 'Foundation', priority: 'high' }, { name: 'Tools & Frameworks', category: 'Tooling', priority: 'medium' }] },
  { semester: 3, topics: [{ name: 'Core Domain Skills', category: 'Core', priority: 'high' }, { name: 'Projects', category: 'Practice', priority: 'high' }] },
  { semester: 4, topics: [{ name: 'Advanced Concepts', category: 'Advanced', priority: 'high' }, { name: 'Real-world Applications', category: 'Practice', priority: 'medium' }] },
  { semester: 5, topics: [{ name: 'Specialization Topics', category: 'Specialization', priority: 'high' }, { name: 'Industry Tools', category: 'Tooling', priority: 'medium' }] },
  { semester: 6, topics: [{ name: 'Professional Projects', category: 'Practice', priority: 'high' }, { name: 'Portfolio Building', category: 'Career', priority: 'high' }] },
  { semester: 7, topics: [{ name: 'Internship / Research', category: 'Career', priority: 'high' }, { name: 'Advanced Specialization', category: 'Specialization', priority: 'medium' }] },
  { semester: 8, topics: [{ name: 'Capstone Project', category: 'Practice', priority: 'high' }, { name: 'Career Preparation', category: 'Career', priority: 'high' }] },
];

module.exports = { CAREER_PATHS, ROADMAP_TEMPLATES, DEFAULT_ROADMAP };
