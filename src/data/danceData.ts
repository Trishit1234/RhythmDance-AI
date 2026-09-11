export interface Lesson {
  title: string;
  video: string;
  description: string;
  points?: string[];
  ordered?: boolean;
}

export interface DanceStyle {
  slug: string;
  name: string;
  region: string;
  tagline: string;
  image: string;
  accentColor: string;
  learnersCount?: string;
  guru?: string;
  editorialTag?: string;
  duration?: string;
  category: "classical" | "folk";
  comingSoon?: boolean;
  lessons: Lesson[];
}

export const danceStyles: DanceStyle[] = [
  {
    slug: "odissi",
    name: "Odissi",
    category: "classical",
    region: "Odisha (East India)",
    tagline: "Fluid movements and sculpturesque poses from Odisha.",
    image: "/images/oddisi.png",
    accentColor: "#B42318",
    learnersCount: "12K learners",
    guru: "Guru Kelucharan Mohapatra Tradition",
    editorialTag: "ODISHA · EAST INDIA",
    duration: "24 min",
    lessons: [
      {
        title: "Introduction",
        video: "https://www.youtube.com/embed/KZkqnt56LJA",
        description:
          "An introduction to Odissi, its classical vocabulary, graceful movement quality, and temple heritage.",
        points: [
          "One of India's major classical dance traditions",
          "Known for Tribhanga and Chowka",
          "Combines movement, rhythm, gesture, and expression",
        ],
      },
      {
        title: "History",
        video: "https://www.youtube.com/embed/KZkqnt56LJA",
        description:
          "Explore the traditional background of Odissi and how its temple and classical traditions developed into the modern stage form.",
        points: [
          "Strong connection with Odisha's temple traditions",
          "Influenced by Mahari and Gotipua traditions",
          "Revived and systematized by important gurus",
        ],
      },
      {
        title: "Features",
        video: "https://www.youtube.com/embed/EkckNxN43IU",
        description:
          "Learn about the characteristic torso movement and sculptural quality that make Odissi visually distinctive.",
        points: [
          "Signature Tribhanga posture",
          "Strong Chowka stance",
          "Fluid torso movement called Chala",
          "Expressive hand gestures and Abhinaya",
        ],
      },
      {
        title: "Core Lessons",
        video: "https://www.youtube.com/embed/vc3SlpwZI3I",
        description:
          "Begin with Chowka, one of the fundamental stances of Odissi. The referenced tutorial specifically teaches Chowka steps 1 and 2.",
        points: [
          "Namaskar and basic preparation",
          "Chowka foundation",
          "Basic weight distribution and posture",
        ],
        ordered: true,
      },
      {
        title: "Teaching Structure",
        video: "https://www.youtube.com/embed/fT0NAnd2ops",
        description:
          "Understand how foundational Odissi movement develops through repeated practice, posture work, torso movement, and rhythmic combinations.",
        points: [
          "Begin with posture and basic positions",
          "Practice Chowka and Tribhanga",
          "Develop torso control",
          "Progress toward rhythmic combinations",
        ],
      },
      {
        title: "Practice & Tips",
        video: "https://www.youtube.com/embed/qHNu-HPXEDA",
        description:
          "Use focused repetition to improve posture, balance, rhythm, and control while learning Odissi fundamentals.",
        points: [
          "Practice basic positions consistently",
          "Use a mirror to check alignment",
          "Record yourself to review posture",
          "Warm up before intensive practice",
        ],
      },
      {
        title: "Lesson 1: Namaskar & Chowka",
        video: "https://www.youtube.com/embed/vc3SlpwZI3I",
        description:
          "Start with Chowka, the powerful square stance that forms one of the foundations of Odissi technique.",
      },
      {
        title: "Lesson 2: Tribhanga & Bhangis",
        video: "https://www.youtube.com/embed/EkckNxN43IU",
        description:
          "Study the characteristic curved body line of Odissi and develop control of the torso and classical postures.",
      },
      {
        title: "Lesson 3: Mudras & Hasta",
        video: "https://www.youtube.com/embed/IsvN6gRUfd8",
        description:
          "Learn how hand gestures and Hasta vocabulary support communication and storytelling in Indian classical dance.",
      },
      {
        title: "Lesson 4: Abhinaya & Expression",
        video: "https://www.youtube.com/embed/dBwPDrel58o",
        description:
          "Explore expressive storytelling through facial expression, gesture, and emotional interpretation.",
      },
      {
        title: "Lesson 5: Odissi Repertoire",
        video: "https://www.youtube.com/embed/smRbddlmQWM",
        description:
          "Understand the broad structure of an Odissi recital and the different types of pieces presented in performance.",
        points: [
          "Mangalacharan: Invocatory opening",
          "Pallavi: Pure dance and rhythmic development",
          "Abhinaya: Expressive storytelling",
          "Moksha: Concluding spiritual piece",
        ],
        ordered: true,
      },
    ],
  },

  {
    slug: "bharatanatyam",
    name: "Bharatanatyam",
    category: "classical",
    region: "Tamil Nadu (South India)",
    tagline: "Graceful hand gestures and storytelling from Tamil Nadu.",
    image: "/images/bharatanatyam.png",
    accentColor: "#B42318",
    learnersCount: "15K learners",
    guru: "Kalakshetra & Rukmini Devi Lineage",
    editorialTag: "TAMIL NADU · SOUTH INDIA",
    duration: "28 min",
    lessons: [
      {
        title: "Introduction",
        video: "https://www.youtube.com/embed/ecDRZAhoS5w",
        description:
          "An introduction to Bharatanatyam fundamentals, including Adavus, rhythm, expression, hand gestures, and classical technique.",
        points: [
          "Classical dance tradition of Tamil Nadu",
          "Built around Adavus and Hastas",
          "Combines Nritta, Nritya, and Natya",
        ],
      },
      {
        title: "History",
        video: "https://www.youtube.com/embed/boHOgU1rd0g",
        description:
          "Explore the historical development of Bharatanatyam from temple traditions into its modern stage form.",
        points: [
          "Strong historical connection with Tamil Nadu",
          "Developed from earlier Sadir traditions",
          "Modern form was shaped by influential artists and gurus",
        ],
      },
      {
        title: "Features",
        video: "https://www.youtube.com/embed/ecDRZAhoS5w",
        description:
          "Learn the major technical characteristics of Bharatanatyam, including geometric posture, Adavus, Mudras, rhythm, and expression.",
        points: [
          "Firm and geometric body positions",
          "Aramandi-based posture",
          "Intricate Adavu patterns",
          "Expressive eyes, face, and hand gestures",
        ],
      },
      {
        title: "Core Lessons",
        video: "https://www.youtube.com/embed/ecDRZAhoS5w",
        description:
          "Build the core Bharatanatyam vocabulary through beginner-friendly Adavu practice and foundational technique.",
        points: [
          "Basic Adavus",
          "Hand gestures",
          "Body alignment",
          "Rhythm and Tala",
        ],
        ordered: true,
      },
      {
        title: "Teaching Structure",
        video: "https://www.youtube.com/embed/IdMi2JIyLjs",
        description:
          "A beginner-oriented Bharatanatyam lesson demonstrating structured practice and the progression of basic technique.",
        points: [
          "Step-by-step movement practice",
          "Repeated rhythmic drills",
          "Posture and alignment correction",
          "Gradual repertoire development",
        ],
      },
      {
        title: "Practice & Tips",
        video: "https://www.youtube.com/embed/ecDRZAhoS5w",
        description:
          "Use structured beginner practice to improve Adavu technique, posture, rhythm, and coordination.",
        points: [
          "Practice consistently",
          "Maintain correct Aramandi",
          "Use a mirror for alignment",
          "Increase speed only after technique is stable",
        ],
      },
      {
        title: "Lesson 1: Alarippu",
        video: "https://www.youtube.com/embed/OoDeVI0Gu1c",
        description:
          "Study Alarippu, the rhythmic opening item traditionally used to prepare the dancer's body and establish rhythm.",
      },
      {
        title: "Lesson 2: Jatiswaram",
        video: "https://www.youtube.com/embed/ecDRZAhoS5w",
        description:
          "Understand the role of pure dance, rhythm, and melodic patterns in the Jatiswaram section of the Bharatanatyam repertoire.",
      },
      {
        title: "Lesson 3: Varnam",
        video: "https://www.youtube.com/embed/-c9k-GMH1mQ",
        description:
          "Explore Varnam, the central and most elaborate section of the Margam, combining complex rhythmic movement with expressive Abhinaya.",
      },
      {
        title: "Lesson 4: Padam",
        video: "https://www.youtube.com/embed/f4GcmwFF2OQ",
        description:
          "Study Padam, an expressive Bharatanatyam form focused strongly on Abhinaya and interpretation of poetic meaning.",
      },
      {
        title: "Lesson 5: Tillana",
        video: "https://www.youtube.com/embed/3EZm2O1GZtA",
        description:
          "Explore Tillana, a lively concluding item characterized by rhythmic patterns, energetic movement, and precise footwork.",
      },
    ],
  },

  {
    slug: "kathak",
    name: "Kathak",
    category: "classical",
    region: "North India",
    tagline: "Spins and intricate footwork from North India.",
    image: "/images/kathak.png",
    accentColor: "#B42318",
    learnersCount: "10K learners",
    guru: "Lucknow & Jaipur Gharana Tradition",
    editorialTag: "NORTH INDIA",
    duration: "20 min",
    lessons: [
      {
        title: "Introduction",
        video: "https://www.youtube.com/embed/OCtLd3KQ-3Q",
        description:
          "An introduction to Kathak, its storytelling tradition, rhythmic footwork, spins, and expressive movement.",
        points: [
          "Classical dance tradition of North India",
          "Combines storytelling and rhythm",
          "Known for Tatkar and Chakkars",
        ],
      },
      {
        title: "History",
        video: "https://www.youtube.com/embed/OCtLd3KQ-3Q",
        description:
          "Learn about the broad historical development of Kathak and the traditions that shaped its modern practice.",
        points: [
          "Connected with traditional storytelling",
          "Developed through temple and court traditions",
          "Modern practice is represented by different Gharanas",
        ],
      },
      {
        title: "Features",
        video: "https://www.youtube.com/embed/UBYqv21c0Yk",
        description:
          "Explore the characteristic footwork, spins, rhythm, and expressive vocabulary of Kathak.",
        points: [
          "Tatkar footwork",
          "Chakkars and controlled spins",
          "Abhinaya and storytelling",
          "Complex rhythmic patterns",
        ],
      },
      {
        title: "Core Lessons",
        video: "https://www.youtube.com/embed/OCtLd3KQ-3Q",
        description:
          "Build the foundational Kathak vocabulary through footwork, rhythm, posture, and basic movement combinations.",
        points: [
          "Tatkar fundamentals",
          "Rhythmic coordination",
          "Basic spins",
          "Introduction to compositions",
        ],
        ordered: true,
      },
      {
        title: "Teaching Structure",
        video: "https://www.youtube.com/embed/UBYqv21c0Yk",
        description:
          "Develop Kathak technique progressively through footwork drills, rhythm exercises, posture, and expressive movement.",
        points: [
          "Warm up with Tatkar",
          "Develop rhythm with bols",
          "Practice controlled turns",
          "Progress toward compositions",
        ],
      },
      {
        title: "Practice & Tips",
        video: "https://www.youtube.com/embed/OCtLd3KQ-3Q",
        description:
          "Improve Kathak fundamentals through slow, controlled practice before increasing speed and complexity.",
        points: [
          "Start spins slowly",
          "Keep the upper body controlled",
          "Practice with a steady rhythm",
          "Focus on clean footwork",
        ],
      },
      {
        title: "Lesson 1: Tatkar & Keechad",
        video: "https://www.youtube.com/embed/OCtLd3KQ-3Q",
        description:
          "Build the rhythmic footwork foundation of Kathak through repeated Tatkar patterns and controlled weight transfer.",
      },
      {
        title: "Lesson 2: Kayda & Gat",
        video: "https://www.youtube.com/embed/UBYqv21c0Yk",
        description:
          "Learn how Kathak compositions combine rhythmic structure with movement and storytelling through Gat.",
      },
      {
        title: "Lesson 3: Toda & Tihai",
        video: "https://www.youtube.com/embed/OCtLd3KQ-3Q",
        description:
          "Understand short rhythmic compositions and the structure of Tihai, where a phrase is repeated three times to resolve with the beat.",
      },
      {
        title: "Lesson 4: Chakradhara & Parans",
        video: "https://www.youtube.com/embed/UBYqv21c0Yk",
        description:
          "Explore advanced rhythmic ideas, spins, and composition structures used in Kathak performance.",
      },
      {
        title: "Lesson 5: Layakari & Paran",
        video: "https://www.youtube.com/embed/OCtLd3KQ-3Q",
        description:
          "Develop an understanding of rhythmic variation and controlled changes of tempo in Kathak.",
      },
    ],
  },

  {
    slug: "kuchipudi",
    name: "Kuchipudi",
    category: "classical",
    region: "Andhra Pradesh (South India)",
    tagline:
      "Fast rhythms and dramatic storytelling from Andhra Pradesh.",
    image: "/images/kuchipudi.jpg",
    accentColor: "#B42318",
    learnersCount: "8K learners",
    guru: "Vempati Chinna Satyam Lineage",
    editorialTag: "ANDHRA PRADESH · SOUTH INDIA",
    duration: "22 min",
    lessons: [
      {
        title: "Introduction",
        video: "https://www.youtube.com/embed/AVVHNQNSzqM",
        description:
          "A beginner-friendly introduction to Kuchipudi with emphasis on its basic movement vocabulary and Adavus.",
        points: [
          "Classical dance tradition of Andhra Pradesh",
          "Combines dance, drama, and expression",
          "Known for dynamic movement and storytelling",
        ],
      },
      {
        title: "History",
        video: "https://www.youtube.com/embed/hId516d4EFA",
        description:
          "Explore the historical and theatrical traditions behind Kuchipudi and its development as a classical dance form.",
        points: [
          "Strong connection with Andhra Pradesh",
          "Developed as a dance-drama tradition",
          "Associated with Siddhendra Yogi",
        ],
      },
      {
        title: "Features",
        video: "https://www.youtube.com/embed/hId516d4EFA",
        description:
          "Learn about the distinctive movement, expression, rhythm, and dramatic elements of Kuchipudi.",
        points: [
          "Dynamic footwork",
          "Expressive storytelling",
          "Jathis and Adavus",
          "Tarangam tradition",
        ],
      },
      {
        title: "Core Lessons",
        video: "https://www.youtube.com/embed/AVVHNQNSzqM",
        description:
          "Build a foundation with beginner Kuchipudi Adavus and basic rhythmic movement.",
        points: [
          "Basic Adavus",
          "Posture and balance",
          "Rhythm and footwork",
          "Movement coordination",
        ],
        ordered: true,
      },
      {
        title: "Teaching Structure",
        video: "https://www.youtube.com/embed/mHMsF3iayt0",
        description:
          "Develop Kuchipudi technique progressively through rhythm, posture, balance, expression, and repertoire practice.",
        points: [
          "Begin with basic movement",
          "Develop rhythmic coordination",
          "Practice expression",
          "Progress toward repertoire",
        ],
      },
      {
        title: "Practice & Tips",
        video: "https://www.youtube.com/embed/AVVHNQNSzqM",
        description:
          "Use beginner Adavu drills to build balance, rhythm, coordination, and movement confidence.",
        points: [
          "Practice Adavus regularly",
          "Maintain stable posture",
          "Work on rhythm gradually",
          "Record practice for self-correction",
        ],
      },
      {
        title: "Lesson 1: Kaki Talam",
        video: "https://www.youtube.com/embed/AVVHNQNSzqM",
        description:
          "Begin developing the rhythmic coordination and basic movement control needed for Kuchipudi practice.",
      },
      {
        title: "Lesson 2: Adavus",
        video: "https://www.youtube.com/embed/AVVHNQNSzqM",
        description:
          "Learn foundational Kuchipudi Adavus through step-by-step beginner practice.",
      },
      {
        title: "Lesson 3: Jathis",
        video: "https://www.youtube.com/embed/AVVHNQNSzqM",
        description:
          "Develop rhythmic combinations and coordination through foundational Kuchipudi movement patterns.",
      },
      {
        title: "Lesson 4: Tarangam",
        video: "https://www.youtube.com/embed/mHMsF3iayt0",
        description:
          "Explore Tarangam, the famous Kuchipudi performance tradition involving balance, rhythm, and controlled movement.",
      },
      {
        title: "Lesson 5: Moksham",
        video: "https://www.youtube.com/embed/mHMsF3iayt0",
        description:
          "Understand Moksham as a concluding devotional element of the Kuchipudi repertoire.",
      },
    ],
  },

  {
    slug: "kathakali",
    name: "Kathakali",
    region: "Kerala (South India)",
    tagline: "Elaborate makeup, storytelling, and martial arts elements.",
    image: "/images/kathakali.jpg",
    accentColor: "#B42318",
    editorialTag: "KERALA · SOUTH INDIA",
    category: "classical",
    comingSoon: true,
    lessons: [],
  },

  {
    slug: "manipuri",
    name: "Manipuri",
    region: "Manipur (Northeast India)",
    tagline: "Graceful movements celebrating divine love.",
    image: "/images/manipuri.jpg",
    accentColor: "#B42318",
    editorialTag: "MANIPUR · NORTHEAST INDIA",
    category: "classical",
    comingSoon: true,
    lessons: [],
  },

  {
    slug: "mohiniyattam",
    name: "Mohiniyattam",
    region: "Kerala (South India)",
    tagline: "The dance of the enchantress with flowing grace.",
    image: "/images/mohiniyattam.jpg",
    accentColor: "#B42318",
    editorialTag: "KERALA · SOUTH INDIA",
    category: "classical",
    comingSoon: true,
    lessons: [],
  },

  {
    slug: "sattriya",
    name: "Sattriya",
    region: "Assam (Northeast India)",
    tagline: "Devotional dance from the monasteries of Assam.",
    image: "/images/sattriya.jpg",
    accentColor: "#B42318",
    editorialTag: "ASSAM · NORTHEAST INDIA",
    category: "classical",
    comingSoon: true,
    lessons: [],
  },

  {
    slug: "garba",
    name: "Garba",
    region: "Gujarat (West India)",
    tagline: "Vibrant circles and rhythmic claps of devotion.",
    image: "/images/garba.jpg",
    accentColor: "#B42318",
    editorialTag: "GUJARAT · WEST INDIA",
    category: "folk",
    comingSoon: true,
    lessons: [],
  },

  {
    slug: "bhangra",
    name: "Bhangra",
    region: "Punjab (North India)",
    tagline: "High-energy harvest celebration.",
    image: "/images/bhangra.jpg",
    accentColor: "#B42318",
    editorialTag: "PUNJAB · NORTH INDIA",
    category: "folk",
    comingSoon: true,
    lessons: [],
  },

  {
    slug: "chhau",
    name: "Chhau",
    region: "Jharkhand (East India)",
    tagline: "Martial arts meets masked storytelling.",
    image: "/images/chhau.jpg",
    accentColor: "#B42318",
    editorialTag: "JHARKHAND · EAST INDIA",
    category: "folk",
    comingSoon: true,
    lessons: [],
  },
];

export function getDanceBySlug(
  slug: string,
): DanceStyle | undefined {
  return danceStyles.find(
    (d) => d.slug === slug,
  );
}