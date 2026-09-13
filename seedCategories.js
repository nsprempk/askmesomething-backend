import dotenv from "dotenv";

import connectDB from "./config/db.js";
import Category from "./models/Category.js";

dotenv.config();

const categories = [
  {
    name: "Education",
    slug: "education",
    description: "Learning, study, homework, exams and academic questions.",
    icon: "🎓",
    order: 1,
  },
  {
    name: "Sports",
    slug: "sports",
    description: "Sports, athletes, teams, rules, records and competitions.",
    icon: "⚽",
    order: 2,
  },
  {
    name: "Religious",
    slug: "religious",
    description: "Religious texts, traditions, beliefs and spiritual topics.",
    icon: "🕉️",
    order: 3,
  },
  {
    name: "Science",
    slug: "science",
    description:
      "Physics, chemistry, biology, astronomy and scientific topics.",
    icon: "🔬",
    order: 4,
  },
  {
    name: "Technology",
    slug: "technology",
    description: "Computers, software, programming, internet and technology.",
    icon: "💻",
    order: 5,
  },
  {
    name: "Business",
    slug: "business",
    description: "Business, entrepreneurship, management and startups.",
    icon: "💼",
    order: 6,
  },
  {
    name: "General Knowledge",
    slug: "general-knowledge",
    description: "General knowledge, facts and everyday questions.",
    icon: "📚",
    order: 7,
  },
  {
    name: "Geography",
    slug: "geography",
    description: "Countries, cities, continents, maps and geographical topics.",
    icon: "🌎",
    order: 8,
  },
  {
    name: "History",
    slug: "history",
    description: "Historical events, civilizations, people and places.",
    icon: "📜",
    order: 9,
  },
  {
    name: "Mathematics",
    slug: "mathematics",
    description: "Math problems, equations, formulas and calculations.",
    icon: "🧮",
    order: 10,
  },
  {
    name: "Finance",
    slug: "finance",
    description: "Personal finance, investing, banking and financial concepts.",
    icon: "💰",
    order: 11,
  },
  {
    name: "Health",
    slug: "health",
    description: "General health, wellness, nutrition and health education.",
    icon: "🏥",
    order: 12,
  },
  {
    name: "Law",
    slug: "law",
    description: "Legal concepts, laws, rights and legal education.",
    icon: "⚖️",
    order: 13,
  },
  {
    name: "Arts & Culture",
    slug: "arts-culture",
    description: "Art, literature, music, culture and creative topics.",
    icon: "🎨",
    order: 14,
  },
  {
    name: "Artificial Intelligence",
    slug: "artificial-intelligence",
    description:
      "AI, machine learning, generative AI and related technologies.",
    icon: "🤖",
    order: 15,
  },
  {
    name: "Other",
    slug: "other",
    description: "Questions that don't fit into another category.",
    icon: "🌐",
    order: 16,
  },
];

const seedCategories = async () => {
  try {
    await connectDB();

    await Category.deleteMany();

    await Category.insertMany(categories);

    console.log("Categories seeded successfully.");
    console.log(`${categories.length} categories inserted.`);

    process.exit(0);
  } catch (error) {
    console.error("Category seeding failed:", error.message);
    process.exit(1);
  }
};

seedCategories();
