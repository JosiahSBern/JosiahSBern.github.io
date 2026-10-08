/* content.js: everything you'd edit to update the portfolio text.
   Add projects, experience, and skills here; the page renders from these lists. */
const PROFILE = {
  name: "Josiah Bernard",
  role: "Robotics, Embedded Systems & Software Developer",
  email: "josiahrbernard@gmail.com",
  github: "https://github.com/JosiahSBern",
  linkedin: "https://www.linkedin.com/in/josiah-st-bernard",
  resume: "resume.pdf"   // the PDF sitting next to index.html in the repo
};

const CATS = { robotics:"Robotics", robomaster:"Competition robotics", embedded:"Embedded", gpu:"GPU & ML", software:"Software" };

// links: [{label:"Code", href:"https://github.com/..."}, {label:"Demo", href:"..."}]
// media: {type:"img"|"video", src:"...", alt:"..."}
const PROJECTS = [
  { name:"Off-grid smart irrigation system", cat:"embedded",
    summary:"Solar-powered irrigation, deployed on Governors Island",
    description:"A solar-powered, off-grid irrigation controller taken from first prototype to a field-ready deployment. A Raspberry Pi 4 drives solenoid valves through relay control logic, and a Flask web server lets growers monitor and run watering remotely. Delivered as a $20K customer pilot on Governors Island, where it validated performance in a real outdoor environment.",
    role:"Led the end-to-end hardware development as an engineering intern at Plantaer.",
    tech:["Raspberry Pi 4","Python","Flask","Relay control","Solenoid valves","Solar power"], links:[] },
  { name:"Emotionally intelligent robot tutor", cat:"robotics",
    summary:"Adaptive human-robot interaction for autistic children",
    description:"A ROS-based tutoring robot that combines speech, vision, and gesture recognition with SLAM so it can move around a room and adapt how it teaches to a child's emotional state. I presented the research at the BARS Symposium to an audience of more than 100 researchers and faculty.",
    role:"Robotics research assistant at CUNY: perception integration, interaction flow, and navigation.",
    tech:["ROS","SLAM","Speech recognition","Computer vision","Gesture recognition","Python"], 
    links:[{label:"Code", href:"https://github.com/JosiahSBern/emotion-aware-robot-tutor"}, 
      {label:"Emotional TTS server", href:"https://github.com/JosiahSBern/emotional-TTS-server"},
      {label:"Poster",href:"images/BARS.pdf"}] },
  { name:"NYU ARC controls", cat:"robomaster",
    summary:"ROS 2 navigation for a competition robotics team",
    description:"Controls work for NYU's combat robotics team, building navigation on ROS 2, Nav2, and SLAM running on an NVIDIA Jetson to get the robots ready for the ARCC and RoboMaster North America competitions. I keep a weekly engineering notebook of design iterations, test results, and next steps.",
    role:"Controls subteam member.",
    tech:["ROS 2","Nav2","SLAM","NVIDIA Jetson","C++","Python"], links:[] },
  { name:"RUKA", cat:"robotics",
    summary:"Dexterous hand that catches thrown objects",
    description:"A catching system for the RUKA dexterous hand mounted on a UR5e. I built the combined hand-and-arm scene in MuJoCo (22 DOF, 21 actuators) and designed a predictive catch: a Kalman filter estimates the object's trajectory so the hand is already moving to the intercept point before the object arrives.",
    role:"Simulation scene, state estimation, and a budget hardware plan built on Dynamixel XL330 servos.",
    tech:["MuJoCo","Python","Kalman filter","UR5e","Dynamixel XL330"], links:[] },
  { name:"BLOC", cat:"robotics",
    summary:"LEGO assembly with a UR5 arm in Isaac Lab",
    description:"A robot that assembles LEGO structures, trained and tested in NVIDIA Isaac Lab",
    role:"Environment setup, task design, and training runs.",
    tech:["Isaac Lab","Isaac Sim","UR5","PyTorch","Reinforcement learning"], links:[] },
  { name:"Warehouse robot simulation", cat:"robotics",
    summary:"Autonomous fleet navigation with an AI dispatcher",
    description:"A ROS 2 warehouse system in which robots map and navigate autonomously with SLAM and Nav2, while an AI-based dispatcher assigns tasks across the fleet and keeps robots from colliding.",
    role:"Solo project.",
    tech:["ROS 2","Nav2","SLAM","Python"], links:[] },
  { name:"NeuroPBR", cat:"gpu",
    summary:"End-to-end PBR material reconstruction",
    description:"A system that reconstructs physically based rendering (PBR) materials end to end, running a Core ML model on device with custom Metal shaders for rendering. Built during the CUNY Tech Prep fellowship and presented at LinkedIn HQ.",
    role:"Data Science Fellow, CUNY Tech Prep.",
    tech:["PyTorch","Core ML","Metal","Swift"], links:[{label:"Code", href:"https://github.com/josephHelfenbein/NeuroPBR"}] },
  { name:"CUDA kernels for robot learning", cat:"gpu",
    summary:"Softmax, tiled matmul, and a GPU rollout buffer",
    description:"CUDA kernels written from scratch: a single-kernel softmax using parallel reduction, packaged as a shared library; matrix multiply with shared-memory tiling; and, in progress, a parallel trajectory rollout buffer that computes generalized advantage estimation (GAE) on the GPU.",
    role:"Solo project.",
    tech:["CUDA","C++","nvcc","PyTorch"], links:[{label:"Code", href:"https://github.com/JosiahSBern/cuda-robot-learning-kernels"}, {label:"Softmax kernel", href:"https://github.com/JosiahSBern/cuda-softmax"}] },
  { name:"CartPole RL benchmarks", cat:"gpu",
    summary:"REINFORCE vs PPO vs DQN, implemented from scratch",
    description:"Three reinforcement learning algorithms (REINFORCE, PPO, and DQN) implemented in PyTorch and compared on the same CartPole task, to see how policy-gradient and value-based methods differ in sample efficiency and training stability.",
    role:"Solo project.",
    tech:["PyTorch","Python","Reinforcement learning"], links:[{label:"Code", href:"https://github.com/JosiahSBern/cartpole-rl-benchmarks"}] },
  { name:"Quiztronics RAG tutor", cat:"software",
    summary:"Retrieval-augmented C++ tutoring, 50%+ more accurate",
    description:"A retrieval-augmented generation pipeline for a C++ tutoring assistant, built with LangChain, a JSON vector store, and MySQL. Grounding answers in course material improved response accuracy by more than 50%.",
    role:"AI/software intern at Quiztronics (RFCUNY).",
    tech:["Python","LangChain","MySQL","Vector search","LLMs"], links:[{label:"Code", href:"https://github.com/JosiahSBern/rag-cpp-tutor"}] },
  { name:"Bus route risk dashboard", cat:"software",
    summary:"Live MTA data, reviewed by MTA engineers",
    description:"A Python dashboard that pulls live NYC MTA data to visualize risk metrics by bus route and neighborhood. MTA engineers formally reviewed it for potential implementation and system optimization insights.",
    role:"Solo project.",
    tech:["Python","MTA real-time data","Data visualization"], links:[] }
];

const EXPERIENCE = [
  { org:"NYU ARC Robotics", role:"Controls subteam member", when:"Sep 2026 – now", now:true,
    body:"ROS 2, Nav2, and SLAM on NVIDIA Jetson for NYU's combat robotics team, supporting readiness for the ARCC and RoboMaster North America competitions. I keep the team's weekly VIP engineering notebook." },
  { org:"Plantaer", role:"Engineering intern", when:"Feb – Aug 2026",
    body:"Led end-to-end hardware development of a solar-powered, off-grid smart irrigation system, delivered as a $20K customer pilot deployed on Governors Island." },
  { org:"CUNY Tech Prep", role:"Data Science Fellow", when:"Jul 2025 – Jul 2026",
    body:"Competitive fellowship mentored by Amazon engineers. Presented NeuroPBR, an end-to-end PBR material reconstruction system, at LinkedIn HQ." },
  { org:"Quiztronics (RFCUNY)", role:"AI/software intern", when:"Jun – Sep 2025",
    body:"Built a retrieval-augmented generation pipeline with LangChain, a JSON vector store, and MySQL that improved the accuracy of C++ tutoring responses by more than 50%." },
  { org:"CUNY", role:"Robotics research assistant", when:"Dec 2024 – Jan 2026",
    body:"Built a ROS-based, emotionally intelligent robot tutor for autistic children, combining speech, vision, gesture recognition, and SLAM. Presented the work at the BARS Symposium to 100+ researchers and faculty." },
  { org:"NYU Tandon School of Engineering", role:"B.S. Electrical & Computer Engineering", when:"Exp. May 2028",
    body:"Coursework: Robotic Manipulation & Locomotion, Signals & Systems, Linear Algebra & Differential Equations, Fundamentals of Electric Circuits." },
  { org:"Borough of Manhattan Community College", role:"A.S. Computer Science, Honors", when:"2025",
    body:"Coursework: Data Structures, Digital Logic & State Machine Design, Discrete Mathematics." }
];

const SKILLS = [
  { name:"Languages", items:["C++","C","Python","Java","JavaScript","HTML/CSS"] },
  { name:"Robotics & simulation", items:["ROS 2","Nav2","SLAM","Isaac Lab","Isaac Sim","MuJoCo"] },
  { name:"Embedded & hardware", items:["Raspberry Pi","Arduino","NVIDIA Jetson","Motor drivers","PID control","Actuators","LiDAR"] },
  { name:"ML & GPU", items:["PyTorch","CUDA","OpenCV","Reinforcement learning"] },
  { name:"AI & backend", items:["LangChain","Ollama","Flask","SQL"] },
  { name:"Tools", items:["Linux","Git"] }
];
