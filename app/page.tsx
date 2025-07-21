"use client";
import { motion, Variants } from "framer-motion";
import PolyHero from "./components/PolyHero";
import Section from "./components/Section";
import Project from "./components/Project";
import Education from "./components/Education";

export default function Home() {
  return (
    <>
      <PolyHero />
      {/* About */}
      <Section id="about" title="About Me">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}>
          I&apos;m Dong Li - a data scientist turned software engineer with experience in full-stack data science, integration, and web design. I enjoy turning data into insights and building clean, interactive web apps using tools like Python, Javascript, and React.
        </motion.p>
      </Section>

      {/* Projects */}
      <Section id="projects" title="Featured Projects">
        <Project
          name="Interactive Linear Programming"
          description="A visual Simplex method playground built with Next.js, React-Three-Fiber & GLSL shaders."
          link="/linear-programming"
          image="/linear_programming.webp"
          target="_self"
        />
        <Project
          name="Taxi Revenue Optimisation"
          description="A data-driven analysis using machine learning to help taxi drivers maximise daily revenue by predicting fare amounts and identifying profitable zones."
          link="/Optimising_Daily_Revenue_Dong_Li.pdf"
          image="/taxi_pic.png"
        />
      </Section>

      {/* Education */}
      <Section id="education" title="Education">
        <motion.div 
          variants={stagger(0.15)} 
          initial="hidden" 
          whileInView="show" 
          viewport={{ once: true, margin: "-100px" }}
          className="space-y-8"
        >
          <Education 
            degree="Bachelor of Science - Data Science"
            school="University of Melbourne"
            period="2022-2024"
            grade=""
            details="Specialized in machine learning, statistical analysis, and data visualization. Completed projects in predictive modeling, natural language processing, and big data analytics."
            highlights={["Machine Learning", "Statistical Analysis", "Data Visualization", "NLP", "Big Data Analytics"]}
            logoUrl="/UoMlogo.png"
          />
          <Education 
            degree="Exchange - Applied Mathematics"
            school="University of British Columbia"
            period="2018-2021"
            grade=""
            details="Completed coursework in the Faculty of Mathematics, with a focus on linear programming, applied linear algebra, and statistical inference."
            highlights={[
              "Linear Programming",
              "Applied Linear Algebra",
              "Statistical Inference"
            ]}
            logoUrl="/UBClogo.png"
          />
        </motion.div>
      </Section>


      {/* Contact */}
      <Section id="contact" title="Come reach out!">
        <p className="mb-6">Want to grab bubble tea or just want to say hi? Reach out! ✌️</p>
        <a
          href="mailto:lidc2504@gmail.com"
          className="inline-block rounded-full bg-neutral-900 px-6 py-3 text-white font-medium shadow-md hover:shadow-lg transition-shadow"
        >
          Email Me
        </a>
      </Section>
    </>
  );
}

const stagger = (staggerTime = 0.2): Variants => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: staggerTime,
    },
  },
});