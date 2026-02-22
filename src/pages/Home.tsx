import { motion } from "framer-motion";
import { User, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { getAllRecords } from "@/lib/database";

const skills = {
  "Languages": ["C", "C++", "Java (Intermediate)", "Python (Intermediate)"],
  "Web Development": ["HTML", "CSS", "JavaScript", "Django"],
  "Database": ["MySQL"],
  "Tools & Platforms": ["GitHub", "VS Code", "Figma", "Canva", "MySQL"],
};

const yearData: Record<string, { title: string; description: string; image: string }[]> = {
  "1st Year": [
    { title: "First Workshop", description: "Attended a hands-on workshop on Arduino and basic electronics, marking my first step into hardware.", image: "" },
    { title: "Intro to Programming", description: "Started learning C and Python fundamentals through college coursework.", image: "" },
    { title: "College Orientation", description: "Explored various departments and clubs during the first semester.", image: "" },
    { title: "Tech Fest", description: "Participated in first college tech fest and coding competition.", image: "" },
    { title: "Project Expo", description: "Presented a basic calculator app built with Python.", image: "" },
  ],
  "2nd Year": [
    { title: "Web Development Bootcamp", description: "Built first web projects using HTML, CSS, and JavaScript.", image: "" },
    { title: "Hackathon Debut", description: "Participated in first hackathon, building a prototype in 24 hours.", image: "" },
    { title: "Database Course", description: "Learned MySQL and relational database design.", image: "" },
    { title: "GitHub Journey", description: "Started using Git and GitHub for version control.", image: "" },
    { title: "Mini Project", description: "Developed a student management system using Django.", image: "" },
  ],
  "3rd Year": [
    { title: "AI/ML Exploration", description: "Explored machine learning concepts and built a disease detection model.", image: "" },
    { title: "Internship at Altruisty", description: "Full Stack Development intern working on Django applications.", image: "" },
    { title: "Paper Publication", description: "Started research on ESP32-based smart monitoring systems.", image: "" },
    { title: "IDEATHON", description: "Won recognition at PECTEAM 2K24 ideation competition.", image: "" },
    { title: "Cloud Certification", description: "Completed AWS Cloud Practitioner and Oracle certifications.", image: "" },
  ],
  "4th Year": [
    { title: "Conference Paper", description: "Published research on ESP32-based smart air quality monitoring system.", image: "" },
    { title: "Capstone Project", description: "Developed Start or Scrap startup validation game as final year project.", image: "" },
    { title: "AI Internship", description: "Worked on AI-based interior design generator using Stable Diffusion.", image: "" },
    { title: "Portfolio Website", description: "Built this personal portfolio to showcase all projects and achievements.", image: "" },
    { title: "Placement Prep", description: "Preparing for campus placements and industry roles.", image: "" },
  ],
};

export default function HomePage() {
  const [selectedYear, setSelectedYear] = useState("1st Year");
  const [yearContentIndex, setYearContentIndex] = useState(0);
  const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
  const currentYearItems = yearData[selectedYear];

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setYearContentIndex(0);
  };

  const navigateContent = (dir: number) => {
    setYearContentIndex((prev) => {
      const next = prev + dir;
      if (next < 0) return currentYearItems.length - 1;
      if (next >= currentYearItems.length) return 0;
      return next;
    });
  };

  const handleDownloadResume = () => {
    const settings = getAllRecords("settings");
    const resume = settings.find((s) => s.key === "resumePdf");
    if (resume?.value) {
      const a = document.createElement("a");
      a.href = resume.value as string;
      a.download = "Sai_Sumanth_Resume.pdf";
      a.click();
    } else {
      alert("Resume not uploaded yet. Upload via Admin panel at /web/admin");
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="flex flex-col items-center text-center py-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-40 h-40 md:w-48 md:h-48 rounded-full border-2 border-foreground/20 flex items-center justify-center mb-6 glow-blue"
          style={{
            background: "radial-gradient(circle, hsl(230, 50%, 18%) 0%, hsl(225, 45%, 10%) 70%)",
          }}
        >
          <User className="w-16 h-16 text-muted-foreground/50" />
        </motion.div>
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-5xl font-heading font-bold text-primary glow-text mb-2"
        >
          Sai Sumanth G
        </motion.h1>
        <p className="text-muted-foreground text-lg">
          Full Stack Developer · AI Enthusiast · Builder
        </p>
      </section>

      {/* About */}
      <section>
        <div className="glass-card p-6 md:p-8">
          <h2 className="font-heading font-semibold text-lg text-foreground mb-3">About Me</h2>
          <p className="text-muted-foreground leading-relaxed">
            A passionate developer with a love for building innovative solutions. Experienced in
            Full Stack Development, Machine Learning, and Cloud technologies. Exploring the
            intersection of design and technology to create impactful products. Currently seeking
            opportunities to make a meaningful contribution in the tech industry.
          </p>
        </div>
      </section>

      {/* Skills */}
      <section>
        <h2 className="page-title mb-6">Skills</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(skills).map(([category, items]) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5"
            >
              <h3 className="font-heading font-semibold text-primary text-sm mb-3">{category}</h3>
              <div className="flex flex-wrap gap-2">
                {items.map((skill) => (
                  <span key={skill} className="glass-pill px-3 py-1 rounded-full text-xs text-foreground/80">{skill}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Resume Download */}
      <section className="flex justify-center">
        <button onClick={handleDownloadResume} className="glass-pill flex items-center gap-2 px-6 py-3 rounded-full text-primary font-medium hover:bg-primary/10 transition-colors border-primary/30">
          <Download className="w-4 h-4" />
          Download Resume
        </button>
      </section>

      {/* College Section */}
      <section>
        <div className="rounded-lg border border-border/40 p-1 bg-secondary/10">
          <div className="glass-card p-4">
            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
              {/* Left - College info + year buttons */}
              <div className="space-y-4">
                <div className="glass-card p-6 text-center">
                  <div className="w-20 h-20 rounded-full border border-muted-foreground/30 flex items-center justify-center mx-auto mb-3" style={{ background: "radial-gradient(circle, hsl(230, 40%, 18%) 0%, hsl(225, 45%, 12%) 70%)" }}>
                    <span className="text-muted-foreground font-heading font-bold text-sm">PEC</span>
                  </div>
                  <h3 className="font-heading font-bold text-foreground text-sm">PANIMALAR</h3>
                  <p className="text-primary text-xs font-heading">ENGINEERING COLLEGE</p>
                  <p className="text-muted-foreground text-xs mt-1">Anna University</p>
                </div>

                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => handleYearChange(year)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-heading font-bold uppercase transition-all ${
                      selectedYear === year
                        ? "bg-primary/20 text-primary border border-primary/40"
                        : "glass-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {year}
                    {selectedYear === year && <span className="text-primary">›</span>}
                  </button>
                ))}
              </div>

              {/* Right - Content */}
              <div className="space-y-4">
                <motion.div
                  key={`img-${selectedYear}-${yearContentIndex}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="image-placeholder w-full h-48 md:h-64 rounded-lg flex items-center justify-center overflow-hidden"
                >
                  {currentYearItems[yearContentIndex].image ? (
                    <img src={currentYearItems[yearContentIndex].image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-muted-foreground/40 text-sm">
                      {selectedYear} - Slide {yearContentIndex + 1}
                    </span>
                  )}
                </motion.div>

                <motion.div
                  key={`${selectedYear}-${yearContentIndex}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-6 text-center border-t-2 border-primary/50"
                >
                  <h3 className="font-heading font-bold text-foreground italic text-lg mb-1">
                    {currentYearItems[yearContentIndex].title}
                  </h3>
                  <p className="text-primary text-xs font-heading mb-3">— {selectedYear} —</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {currentYearItems[yearContentIndex].description}
                  </p>

                  <div className="flex justify-center gap-3 mt-5">
                    <button
                      onClick={() => navigateContent(-1)}
                      className="glass-pill w-10 h-10 rounded-lg flex items-center justify-center text-foreground hover:border-primary/50 transition-colors"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() => navigateContent(1)}
                      className="glass-pill w-10 h-10 rounded-lg flex items-center justify-center text-foreground hover:border-primary/50 transition-colors"
                    >
                      ›
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
