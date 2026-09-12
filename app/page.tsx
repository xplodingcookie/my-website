"use client";
import { motion, Variants } from "framer-motion";
import PolyHero from "./components/PolyHero";
import Experience from "./components/Experience";
import Section from "./components/Section";
import ProjectEvidence from "./components/ProjectEvidence";
import Education from "./components/Education";
import Timeline from "./components/Timeline";
import Magnetic from "./components/Magnetic";
import AboutPortrait from "./components/AboutPortrait";
import { AiOutlineMail } from "react-icons/ai";
import { FaLinkedin } from "react-icons/fa";
import { FaGithub } from "react-icons/fa";
import FeaturedProject from "./components/FeaturedProject";

const fadeInUp: Variants = {
  hidden: { opacity: 1, y: 0 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const SOCIALS = [
  {
    href: "mailto:lidc2504@gmail.com",
    label: "Email me",
    icon: AiOutlineMail,
    external: false,
  },
  {
    href: "https://www.linkedin.com/in/dongchi-li",
    label: "LinkedIn profile",
    icon: FaLinkedin,
    external: true,
  },
  {
    href: "https://github.com/xplodingcookie",
    label: "GitHub profile",
    icon: FaGithub,
    external: true,
  },
];

export default function Home() {
  return (
    <>
      <PolyHero />

      {/* About */}
      <Section id="about" title="About Me" index="01">
        <div className="about-layout">
          <div className="about-copy">
            <motion.p variants={fadeInUp} className="about-lead">
              A data scientist turned<br className="desktop-break" /> <span className="accent-text">software engineer.</span>
            </motion.p>
            <motion.p variants={fadeInUp} className="about-description">
              I’m Dong Li. I work across full-stack data science, integration, and web design.
              I enjoy turning data into insights and building clean, interactive web apps
              using tools like Python, JavaScript, and React.
            </motion.p>
            <div className="about-intersection"><span>Mathematics</span><span className="intersection-symbol" aria-label="and">×</span><span>Computer Science</span></div>
            <p className="about-note">Currently at Phoebe Solutions, building web tools for hospital staff.</p>
          </div>
          <div className="portrait-composition"><AboutPortrait /><span className="portrait-caption">The human behind the code.</span></div>
        </div>
      </Section>

      {/* Experience */}
      <Section id="experience" title="Experience" index="02">
        <Timeline>
          <Experience
            title="Software Engineer / Data Scientist"
            company="Phoebe Solutions"
            period="2025 - Present"
            location="Melbourne, Australia"
            description="Built and deployed Phoebe Integrations, Applications and Products. Used by thousands of hospital staff."
            evidence={[
              { label: "Problem", text: "Healthcare integration, optimisation workflows, and internal data that needed to reach client-side analytics." },
              { label: "Ownership", text: "The new webPAS add-in, from development through deployment; front-end and back-end features for the Phoebe optimisation engine." },
              { label: "Engineering", text: "Built a RESTful API to extract and process internal database data for client-side analytics, alongside new optimisation tools and workflows." },
              { label: "Outcome", text: "A deployed add-in used by thousands of hospital staff, and internal data made available for analytics across platforms." },
            ]}
            highlights={["API Development", "Full-Stack Web Apps", "Machine Learning"]}
            logoUrl="/phoebe_logo.png"
          />
          <Experience
            title="Integration Consultant"
            company="Interweave Integrations"
            period="2024"
            location="Melbourne, Australia"
            description="Helping connect legacy healthcare systems with modern infrastructure."
            evidence={[
              { label: "Problem", text: "Establishing the infrastructure for healthcare integrations across legacy systems and modern architectures." },
              { label: "Ownership", text: "Contributed to the Microsoft infrastructure setup and early DevOps processes; assisted with WebPAS integration code review." },
              { label: "Engineering", text: "Worked across infrastructure foundations and integration components, supporting the team's initial setup." },
              { label: "Outcome", text: "Contributed to the technical foundation for the company's healthcare integration work." },
            ]}
            highlights={["Integration", "Data Analytics", "Visualization"]}
            logoUrl="/interweave_integration_logo.png"
          />
        </Timeline>
      </Section>

      {/* Projects */}
      <Section id="projects" title="Featured Projects" index="03">
        <div className="project-sequence">
          <FeaturedProject />
          <ProjectEvidence />
        </div>
      </Section>

      {/* Education */}
      <Section id="education" title="Education" index="04">
        <Timeline>
          <Education
            degree="Bachelor of Science – Data Science"
            school="University of Melbourne"
            period="2022 - 2024"
            grade=""
            details="Specialised in machine learning, statistical analysis, and data visualisation. Completed projects in predictive modelling, natural language processing, and big data analytics."
            highlights={["Machine Learning", "Statistical Analysis", "Data Visualisation", "NLP", "Big Data Analytics"]}
            logoUrl="/UoMlogo.png"
          />
          <Education
            degree="Exchange – Applied Mathematics"
            school="University of British Columbia"
            period="2023"
            grade=""
            details="Completed coursework in the Faculty of Mathematics, with a focus on linear programming, applied linear algebra, and statistical inference."
            highlights={["Linear Programming", "Applied Linear Algebra", "Statistical Inference"]}
            logoUrl="/UBClogo.png"
          />
        </Timeline>
      </Section>

      {/* Contact */}
      <Section id="contact" title="Come say hi!" index="05" centered>
        <motion.p variants={fadeInUp} className="contact-description">
          Wanna grab milk tea, talk maths, or show me what you’re building? Reach out! ✌️
        </motion.p>
        <motion.div variants={fadeInUp} className="contact-socials">
          {SOCIALS.map(({ href, label, icon: Icon, external }) => (
            <Magnetic key={href} strength={0.3}>
              <a
                href={href}
                aria-label={label}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="social-link"
              >
                <Icon aria-hidden="true" /><span>{label.replace(" profile", "").replace(" me", "")}</span><span aria-hidden="true">↗</span>
              </a>
            </Magnetic>
          ))}
        </motion.div>
        <motion.a variants={fadeInUp} href="mailto:lidc2504@gmail.com" className="contact-email link-underline">lidc2504@gmail.com <span aria-hidden="true">↗</span></motion.a>

      </Section>
    </>
  );
}
