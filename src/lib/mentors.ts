export interface Mentor {
  name: string;
  role: string;
  org: string;
  expertise: string;
  contact: string;
  avatar: string;
}

const MENTORS: Record<string, Mentor[]> = {
  civil_services: [
    { name: "IAS/RAS Coaching Expert", role: "Former IAS Officer & Mentor", org: "RPSC Coaching Cell, Jaipur", expertise: "UPSC/RPSC strategy, interview prep, optional subject guidance", contact: "rpsc.rajasthan.gov.in", avatar: "🏛️" },
    { name: "Civil Services Prep Guide", role: "RPSC Topper (Rank 12)", org: "Raj IAS Academy", expertise: "Rajasthan GK, Paper II, Mains answer writing", contact: "Available via RPSC portal", avatar: "📚" },
  ],
  defense: [
    { name: "Defence Career Counselor", role: "Retd. Col., Indian Army", org: "Sainik Welfare Board, Rajasthan", expertise: "NDA, CDS, AFCAT, SSB interview preparation", contact: "sainikwelfare.rajasthan.gov.in", avatar: "⚔️" },
  ],
  banking: [
    { name: "IBPS/SBI Expert Mentor", role: "Senior Bank Officer", org: "NABARD Regional Office, Jaipur", expertise: "Bank PO/Clerk strategy, quantitative aptitude, interview", contact: "ibps.in", avatar: "🏦" },
  ],
  railways: [
    { name: "Railways Exam Mentor", role: "Sr. Section Engineer, NWR", org: "North Western Railway, Jaipur", expertise: "RRB exams, technical aptitude, Group D/C strategy", contact: "rrbajmer.gov.in", avatar: "🚂" },
  ],
  teaching: [
    { name: "REET/RPSC Teacher Expert", role: "DIET Principal", org: "DIET Jaipur, BSER", expertise: "REET Level 1 & 2, RPSC School Lecturer, B.Ed guidance", contact: "rajeduboard.rajasthan.gov.in", avatar: "📚" },
  ],
  it_tech: [
    { name: "Tech Career Mentor", role: "Senior Software Architect", org: "iStart Rajasthan, IT Park Jaipur", expertise: "Full-stack development, govt IT projects, startup ecosystem", contact: "istart.rajasthan.gov.in", avatar: "💻" },
  ],
  healthcare: [
    { name: "Medical Career Advisor", role: "Sr. Medical Officer", org: "SMS Hospital / RUHS, Jaipur", expertise: "NEET PG, government medical services, specialist pathway", contact: "rajswasthya.nic.in", avatar: "🏥" },
  ],
  aviation: [
    { name: "Aviation Career Guide", role: "Commercial Pilot (DGCA Licensed)", org: "Directorate General of Civil Aviation", expertise: "CPL pathway, flying schools in India, airline selection", contact: "dgca.gov.in", avatar: "✈️" },
  ],
  hospitality: [
    { name: "Hospitality & Tourism Expert", role: "GM, Rajasthan Tourism Hotel", org: "RTDC (Rajasthan Tourism Dev Corp)", expertise: "Hotel management colleges, RTDC careers, tourism sector", contact: "tourism.rajasthan.gov.in", avatar: "🏨" },
  ],
  legal: [
    { name: "Legal Career Mentor", role: "Additional District Judge", org: "Rajasthan High Court", expertise: "Judiciary exam, Bar Council, legal aid services", contact: "hcraj.nic.in", avatar: "⚖️" },
  ],
  finance_accounting: [
    { name: "CA / Finance Mentor", role: "Chartered Accountant (FCA)", org: "ICAI, Jaipur Branch", expertise: "CA Foundation to Final, articleship, govt audit roles", contact: "icai.org", avatar: "📊" },
  ],
  state_govt_rj: [
    { name: "Rajasthan Govt Services Expert", role: "Additional Secretary", org: "Government of Rajasthan Secretariat", expertise: "RAS, Patwari, SI, Revenue dept careers", contact: "rpsc.rajasthan.gov.in", avatar: "🏰" },
  ],
  police: [
    { name: "Rajasthan Police Mentor", role: "Deputy SP (Retd.)", org: "Rajasthan Police Academy, Jaipur", expertise: "SI, Constable exams, PAC, physical training strategy", contact: "police.rajasthan.gov.in", avatar: "👮" },
  ],
  psu: [
    { name: "PSU / GATE Expert", role: "Sr. Engineer, RVUNL", org: "Rajasthan Energy Dept / GATE Forum", expertise: "GATE score, RVUNL/RSPCB/AVVNL recruitment, PSU interviews", contact: "energy.rajasthan.gov.in", avatar: "🏭" },
  ],
};

const DEFAULT_MENTORS: Mentor[] = [
  { name: "Career Counseling Cell", role: "Govt. Certified Career Counselor", org: "Rajasthan Skill & Livelihoods Development Corp (RSLDC)", expertise: "General career guidance, skill mapping, govt schemes", contact: "rsldc.org", avatar: "🎯" },
];

export function getMentorsForCareer(category: string): Mentor[] {
  return MENTORS[category] ?? DEFAULT_MENTORS;
}
