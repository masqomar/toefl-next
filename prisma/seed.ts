import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...\n");

  // Clean existing data (order matters for foreign keys)
  await prisma.result.deleteMany();
  await prisma.userAnswer.deleteMany();
  await prisma.examSession.deleteMany();
  await prisma.voucherRedemption.deleteMany();
  await prisma.examAccess.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.questionBank.deleteMany();
  await prisma.examSection.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("🗑️ Cleaned existing data\n");

  // =====================
  // Create Users
  // =====================
  const hashedPassword = await bcrypt.hash("password123", 10);

  const superAdmin = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "superadmin@example.com",
      password: hashedPassword,
      role: "SUPER_ADMIN",
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "user@example.com",
      password: hashedPassword,
      role: "USER",
    },
  });

  const janeUser = await prisma.user.create({
    data: {
      name: "Jane Smith",
      email: "jane@example.com",
      password: hashedPassword,
      role: "USER",
    },
  });

  console.log("✅ Created users");
  console.log(`   - ${superAdmin.email} (${superAdmin.role})`);
  console.log(`   - ${admin.email} (${admin.role})`);
  console.log(`   - ${regularUser.email} (${regularUser.role})`);
  console.log(`   - ${janeUser.email} (${janeUser.role})\n`);

  // =====================
  // Create Sample Exam
  // =====================
  const sampleExam = await prisma.exam.create({
    data: {
      title: "TOEFL ITP Sample Test",
      description: "Full-length practice test with all three sections. This test simulates the actual TOEFL ITP exam experience.",
      thumbnail: "/images/toefl-sample.jpg",
      type: "FREE",
      price: 0,
      status: true,
    },
  });

  console.log(`✅ Created exam: ${sampleExam.title}`);

  // =====================
  // Section 1: Listening Comprehension (40 questions, 30 min)
  // =====================
  const listeningSection = await prisma.examSection.create({
    data: {
      examId: sampleExam.id,
      title: "Listening Comprehension",
      sectionType: "LISTENING",
      duration: 30, // minutes
      orderNumber: 1,
    },
  });

  // Create 10 sample listening questions
  const listeningQuestions = [
    {
      questionNumber: 1,
      questionText: "What will the woman probably do next?",
      passageText: "W: I can't find my notes from the lecture yesterday. M: Didn't you take any? The professor was explaining the assignment for next week. W: No, I was too busy trying to understand what he was saying.",
      optionA: "Review her notes",
      optionB: "Go to the library",
      optionC: "Ask the professor about the assignment",
      optionD: "Skip the next class",
      correctAnswer: "C",
      explanation: "The woman doesn't have her notes and didn't take any during the lecture. She will likely need to ask the professor about the assignment mentioned.",
    },
    {
      questionNumber: 2,
      questionText: "What are the speakers mainly discussing?",
      passageText: "M: Did you hear about the new student exchange program? W: Yes, they're accepting applications for next semester. Students can study abroad for up to a year.",
      optionA: "A graduation ceremony",
      optionB: "A student exchange program",
      optionC: "A scholarship opportunity",
      optionD: "A university tour",
      correctAnswer: "B",
      explanation: "The speakers are discussing a new student exchange program that allows students to study abroad.",
    },
    {
      questionNumber: 3,
      questionText: "Where does this conversation most likely take place?",
      passageText: "M: Two tickets for the 8 o'clock show, please. W: I'm sorry, that showing is sold out. Would you like the 10 o'clock instead?",
      optionA: "At a movie theater",
      optionB: "At a restaurant",
      optionC: "At a hotel",
      optionD: "At a train station",
      correctAnswer: "A",
      explanation: "The mention of 'tickets' and 'showings' suggests this conversation takes place at a movie theater.",
    },
    {
      questionNumber: 4,
      questionText: "What does the man imply about the book?",
      passageText: "W: This book is really interesting. Have you read it? M: I've tried, but it's quite challenging. The vocabulary is quite advanced.",
      optionA: "The book is too easy",
      optionB: "The book is boring",
      optionC: "The book is difficult to read",
      optionD: "The book is outdated",
      correctAnswer: "C",
      explanation: "The man says he tried to read it but found it challenging due to advanced vocabulary, indicating the book is difficult.",
    },
    {
      questionNumber: 5,
      questionText: "Why is the woman concerned?",
      passageText: "M: The weather forecast says it might rain all weekend. W: That would be terrible. We were planning a camping trip.",
      optionA: "She forgot to check the weather",
      optionB: "Her camping trip might be ruined",
      optionC: "She doesn't like the outdoors",
      optionD: "Her car is not working",
      correctAnswer: "B",
      explanation: "The woman is concerned because the rain forecast might ruin her planned camping trip.",
    },
    {
      questionNumber: 6,
      questionText: "What can be inferred about the man?",
      passageText: "W: You look tired. Did you stay up all night? M: I had to finish my research paper. It's due tomorrow morning.",
      optionA: "He enjoys staying up late",
      optionB: "He has good time management",
      optionC: "He procrastinates on his work",
      optionD: "He doesn't need sleep",
      correctAnswer: "C",
      explanation: "The man stayed up all night to finish a paper due tomorrow, suggesting he procrastinated on his work.",
    },
    {
      questionNumber: 7,
      questionText: "What will the students probably do in class?",
      passageText: "M: Professor, for today's assignment, do we need to bring our textbooks? W: No, just your notes and a pen. We'll be doing a group discussion.",
      optionA: "Take a quiz",
      optionB: "Have a group discussion",
      optionC: "Watch a video",
      optionD: "Write an exam",
      correctAnswer: "B",
      explanation: "The professor explicitly mentions they will be doing a group discussion in class.",
    },
    {
      questionNumber: 8,
      questionText: "What is the man's attitude toward the project?",
      passageText: "W: The research project is taking longer than expected. M: That's okay. Good research takes time. We want to make sure it's done right.",
      optionA: "Impatient",
      optionB: "Indifferent",
      optionC: "Supportive and patient",
      optionD: "Worried about the deadline",
      correctAnswer: "C",
      explanation: "The man shows a supportive attitude, suggesting that good research takes time and they want quality results.",
    },
    {
      questionNumber: 9,
      questionText: "What happened to the woman's computer?",
      passageText: "M: You look frustrated. What's wrong? W: My computer crashed and I lost all my work. I didn't save a backup.",
      optionA: "It was stolen",
      optionB: "It crashed and lost data",
      optionC: "It won't turn on",
      optionD: "The screen is broken",
      correctAnswer: "B",
      explanation: "The woman explicitly states her computer crashed and she lost all her work because she didn't save a backup.",
    },
    {
      questionNumber: 10,
      questionText: "What does the professor suggest the student do?",
      passageText: "S: I'm having trouble understanding this chapter. P: I'd recommend visiting the tutoring center. They have free study sessions every week.",
      optionA: "Drop the class",
      optionB: "Read the chapter again",
      optionC: "Visit the tutoring center",
      optionD: "Ask a friend for help",
      correctAnswer: "C",
      explanation: "The professor specifically recommends the student visit the tutoring center for help.",
    },
  ];

  for (const q of listeningQuestions) {
    await prisma.questionBank.create({
      data: {
        sectionId: listeningSection.id,
        ...q,
      },
    });
  }

  console.log(`   - ${listeningSection.title}: ${listeningQuestions.length} questions`);

  // =====================
  // Section 2: Structure & Written Expression (25 questions, 25 min)
  // =====================
  const structureSection = await prisma.examSection.create({
    data: {
      examId: sampleExam.id,
      title: "Structure & Written Expression",
      sectionType: "STRUCTURE",
      duration: 25,
      orderNumber: 2,
    },
  });

  const structureQuestions = [
    {
      questionNumber: 1,
      questionText: "_____ the first astronaut to walk on the moon was Neil Armstrong.",
      optionA: "That",
      optionB: "It was",
      optionC: "He was",
      optionD: "Who was",
      correctAnswer: "B",
      explanation: "'It was' correctly introduces the appositive phrase describing Neil Armstrong.",
    },
    {
      questionNumber: 2,
      questionText: "The Amazon River in South America is one of _____ in the world.",
      optionA: "the longest rivers",
      optionB: "longest rivers",
      optionC: "the longer rivers",
      optionD: "as long as rivers",
      correctAnswer: "A",
      explanation: "Superlative form 'one of the longest' is required to compare with multiple items.",
    },
    {
      questionNumber: 3,
      questionText: "Photosynthesis is the process _____ plants convert sunlight into energy.",
      optionA: "which",
      optionB: "by which",
      optionC: "that",
      optionD: "in that",
      correctAnswer: "B",
      explanation: "'By which' is the correct relative pronoun to describe the method of conversion.",
    },
    {
      questionNumber: 4,
      questionText: "The library _____ by thousands of students every day.",
      optionA: "is used",
      optionB: "uses",
      optionC: "is using",
      optionD: "used",
      correctAnswer: "A",
      explanation: "Passive voice 'is used' correctly shows the library as the object of the action.",
    },
    {
      questionNumber: 5,
      questionText: "She studied very hard; _____ she passed all her exams.",
      optionA: "however",
      optionB: "therefore",
      optionC: "although",
      optionD: "but",
      correctAnswer: "B",
      explanation: "'Therefore' correctly shows cause and effect relationship.",
    },
    {
      questionNumber: 6,
      questionText: "The professor asked us _____ the assignment by Friday.",
      optionA: "completing",
      optionB: "to complete",
      optionC: "complete",
      optionD: "completed",
      correctAnswer: "B",
      explanation: "Infinitive 'to complete' follows the verb 'asked' correctly.",
    },
    {
      questionNumber: 7,
      questionText: "Neither the students nor the teacher _____ happy about the cancellation.",
      optionA: "were",
      optionB: "was",
      optionC: "are",
      optionD: "is",
      correctAnswer: "A",
      explanation: "Subject-verb agreement: with 'neither...nor', verb agrees with the nearest subject (teacher = singular), but 'teacher' is followed by plural in this context, requiring 'were'.",
    },
    {
      questionNumber: 8,
      questionText: "_____ experiencing technical difficulties, the website is currently unavailable.",
      optionA: "Because of",
      optionB: "Due to",
      optionC: "Owing",
      optionD: "Being",
      correctAnswer: "D",
      explanation: "'Being' correctly forms a participial phrase to show reason.",
    },
    {
      questionNumber: 9,
      questionText: "The more you practice, _____ you become at playing the piano.",
      optionA: "the better",
      optionB: "better",
      optionC: "the best",
      optionD: "best",
      correctAnswer: "A",
      explanation: "Correct comparative structure 'the more...the better'.",
    },
    {
      questionNumber: 10,
      questionText: "I would have gone to the concert _____ I had known about it earlier.",
      optionA: "if",
      optionB: "unless",
      optionC: "provided that",
      optionD: "as long as",
      correctAnswer: "A",
      explanation: "'If' correctly introduces a conditional clause with past perfect.",
    },
    {
      questionNumber: 11,
      questionText: "The experiment was _____ to be repeated under different conditions.",
      optionA: "success",
      optionB: "successfully",
      optionC: "successful",
      optionD: "succeed",
      correctAnswer: "C",
      explanation: "'Successful' (adjective) modifies 'experiment', requiring the linking verb 'was'.",
    },
    {
      questionNumber: 12,
      questionText: "Between you and _____ this project will be completed on time.",
      optionA: "I",
      optionB: "me",
      optionC: "myself",
      optionD: "mine",
      correctAnswer: "B",
      explanation: "Object pronoun 'me' is correct after the preposition 'between'.",
    },
    {
      questionNumber: 13,
      questionText: "The scientist, along with her research team, _____ conducting experiments.",
      optionA: "are",
      optionB: "is",
      optionC: "were",
      optionD: "been",
      correctAnswer: "B",
      explanation: "'Is' is correct because 'along with' doesn't change the subject from singular.",
    },
    {
      questionNumber: 14,
      questionText: "Had I known about the traffic, I _____ earlier.",
      optionA: "would leave",
      optionB: "would have left",
      optionC: "left",
      optionD: "had left",
      correctAnswer: "B",
      explanation: "Past perfect conditional 'would have left' correctly follows the inverted 'Had I known'.",
    },
    {
      questionNumber: 15,
      questionText: "The theory suggests that humans _____ from apes millions of years ago.",
      optionA: "evolved",
      optionB: "have evolved",
      optionC: "had evolved",
      optionD: "are evolving",
      correctAnswer: "A",
      explanation: "Simple past 'evolved' correctly describes an event that happened in the distant past.",
    },
  ];

  for (const q of structureQuestions) {
    await prisma.questionBank.create({
      data: {
        sectionId: structureSection.id,
        ...q,
      },
    });
  }

  console.log(`   - ${structureSection.title}: ${structureQuestions.length} questions`);

  // =====================
  // Section 3: Reading Comprehension (40 questions, 55 min)
  // =====================
  const readingSection = await prisma.examSection.create({
    data: {
      examId: sampleExam.id,
      title: "Reading Comprehension",
      sectionType: "READING",
      duration: 55,
      orderNumber: 3,
    },
  });

  const readingPassage1 = `The concept of biological diversity, or biodiversity, has become increasingly important in scientific circles and public policy discussions. Biodiversity refers to the variety of life in all its forms, levels, and combinations. It includes ecosystem diversity, species diversity, and genetic diversity.

Scientists estimate that there are between 5 million and 100 million different species on Earth, although only about 1.5 million have been formally identified. The majority of these undiscovered species are believed to be insects, microorganisms, and deep-sea organisms.

The loss of biodiversity is one of the most pressing environmental problems facing our planet. Each year, thousands of species become extinct due to habitat destruction, pollution, climate change, and overexploitation of natural resources. This loss is particularly concerning because biodiversity provides essential services to human societies, including pollination of crops, water purification, climate regulation, and the development of new medicines.

Conservation efforts focus on protecting endangered species, preserving habitats, and establishing protected areas such as national parks and wildlife reserves. Many scientists argue that public education and sustainable development practices are equally important for long-term biodiversity conservation.`;

  const readingQuestions1 = [
    {
      questionNumber: 1,
      questionText: "What is the main topic of the passage?",
      passageText: readingPassage1,
      optionA: "The history of species classification",
      optionB: "The importance and loss of biodiversity",
      optionC: "The development of national parks",
      optionD: "The study of microorganisms",
      correctAnswer: "B",
      explanation: "The passage primarily discusses biodiversity, its importance, and the threats to it.",
    },
    {
      questionNumber: 2,
      questionText: "According to the passage, how many species have been formally identified?",
      passageText: readingPassage1,
      optionA: "About 5 million",
      optionB: "About 100 million",
      optionC: "About 1.5 million",
      optionD: "None have been formally identified",
      correctAnswer: "C",
      explanation: "The passage states that only about 1.5 million species have been formally identified out of 5-100 million estimated.",
    },
    {
      questionNumber: 3,
      questionText: "The word 'extinct' in paragraph 2 is closest in meaning to:",
      passageText: readingPassage1,
      optionA: "Endangered",
      optionB: "Diverse",
      optionC: "No longer existing",
      optionD: "Hidden",
      correctAnswer: "C",
      explanation: "In context, 'extinct' refers to species that no longer exist, having died out completely.",
    },
    {
      questionNumber: 4,
      questionText: "Which of the following is NOT mentioned as a cause of biodiversity loss?",
      passageText: readingPassage1,
      optionA: "Habitat destruction",
      optionB: "Pollution",
      optionC: "Overpopulation",
      optionD: "Climate change",
      correctAnswer: "C",
      explanation: "The passage mentions habitat destruction, pollution, climate change, and overexploitation, but not overpopulation.",
    },
    {
      questionNumber: 5,
      questionText: "What does the author suggest is necessary for long-term biodiversity conservation?",
      passageText: readingPassage1,
      optionA: "Limiting scientific research",
      optionB: "Public education and sustainable development",
      optionC: "Eliminating all human interaction with nature",
      optionD: "Focusing only on endangered species",
      correctAnswer: "B",
      explanation: "The author states that public education and sustainable development practices are equally important.",
    },
  ];

  for (const q of readingQuestions1) {
    await prisma.questionBank.create({
      data: {
        sectionId: readingSection.id,
        ...q,
      },
    });
  }

  console.log(`   - ${readingSection.title}: ${readingQuestions1.length} questions`);

  // =====================
  // Create Exam Access for sample exam
  // =====================
  await prisma.examAccess.create({
    data: {
      userId: regularUser.id,
      examId: sampleExam.id,
      accessType: "FREE",
      isActive: true,
    },
  });

  await prisma.examAccess.create({
    data: {
      userId: janeUser.id,
      examId: sampleExam.id,
      accessType: "FREE",
      isActive: true,
    },
  });

  console.log("\n✅ Created exam access for users\n");

  // =====================
  // Summary
  // =====================
  const totalQuestions = listeningQuestions.length + structureQuestions.length + readingQuestions1.length;

  console.log("═══════════════════════════════════════════");
  console.log("✨ Seed completed successfully!");
  console.log("═══════════════════════════════════════════");
  console.log(`\n📚 Sample Exam: ${sampleExam.title}`);
  console.log(`   - Total Sections: 3`);
  console.log(`   - Total Questions: ${totalQuestions}`);
  console.log(`   - Listening: ${listeningQuestions.length} questions`);
  console.log(`   - Structure: ${structureQuestions.length} questions`);
  console.log(`   - Reading: ${readingQuestions1.length} questions`);
  console.log("\n🔑 All user passwords: password123");
  console.log("\n📧 Test accounts:");
  console.log("   - user@example.com (USER)");
  console.log("   - admin@example.com (ADMIN)");
  console.log("   - superadmin@example.com (SUPER_ADMIN)");
  console.log("");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
