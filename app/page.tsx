"use client";
import { motion, Variants } from "framer-motion";
import PolyHero from "./components/PolyHero";
import Experience from "./components/Experience";
import Section from "./components/Section";
import Project from "./components/Project";
import Education from "./components/Education";
import Timeline from "./components/Timeline";
import Magnetic from "./components/Magnetic";
import AboutPortrait from "./components/AboutPortrait";
import { AiOutlineMail } from "react-icons/ai";
import { FaLinkedin } from "react-icons/fa";
import { FaGithub } from "react-icons/fa";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
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
        <div className="grid md:grid-cols-[3fr_2fr] gap-10 md:gap-6 items-center">
          <motion.p variants={fadeInUp} className="text-lg max-w-prose">
            I&apos;m Dong Li - a data scientist turned software engineer with experience in
            full-stack data science, integration, and web design. I enjoy turning data into
            insights and building clean, interactive web apps using tools like Python,
            Javascript, and React.
          </motion.p>
          <AboutPortrait />
        </div>
      </Section>

      {/* Experience */}
      <Section id="experience" title="Experience" index="02">
        <Timeline>
          <Experience
            title="Data Scientist / Software Engineer"
            company="Phoebe Solutions"
            period="2025 - Present"
            location="Melbourne, Australia"
            description="Continuously developed both front-end and back-end features for the Phoebe optimisation engine, adding new tools and improving workflows. Independently developed and deployed the new version of the webPAS add-in, now used by thousands of hospital staff. Built a RESTful API to extract and process data from internal databases for client-side analytics, enabling data-driven decision-making across platforms."
            highlights={["API Development", "Full-Stack Web Apps", "Machine Learning"]}
            logoUrl="/phoebe_logo.png"
          />
          <Experience
            title="Integration Consultant"
            company="Interweave Integrations"
            period="2024"
            location="Melbourne, Australia"
            description="Contributed to the foundational setup of Interweave Integrations' Microsoft infrastructure, supported early DevOps processes, and assisted with code review for components of a WebPAS integration. Played a small but impactful role in enabling the company’s mission to deliver intelligent, robust healthcare integration solutions that bridge legacy systems and modern architectures."
            highlights={["Integration", "Data Analytics", "Visualization"]}
            logoUrl="/interweave_integration_logo.png"
          />
        </Timeline>
      </Section>

      {/* Projects */}
      <Section id="projects" title="Featured Projects" index="03">
        <div className="space-y-10 sm:space-y-14">
          <Project
            index="01"
            name="Interactive Linear Programming"
            description="A visual Simplex method playground built with Next.js, React-Three-Fiber & GLSL shaders."
            link="/linear-programming"
            image="/linear_programming.webp"
            target="_self"
          />
          <Project
            index="02"
            reverse
            name="Taxi Revenue Optimisation"
            description="A data-driven analysis using machine learning to help taxi drivers maximise daily revenue by predicting fare amounts and identifying profitable zones."
            link="/Optimising_Daily_Revenue_Dong_Li.pdf"
            image="/taxi_pic.png"
            imageFit="contain"
          />
          <Project
            index="03"
            name="Website Source Code, Github & More"
            description="My github with uni projects, personal projects and unfinished dreams :P"
            link="https://github.com/xplodingcookie/my-website"
            image="/website_banner.png"
          />
        </div>
      </Section>

      {/* Education */}
      <Section id="education" title="Education" index="04">
        <Timeline>
          <Education
            degree="Bachelor of Science - Data Science"
            school="University of Melbourne"
            period="2022 - 2024"
            grade=""
            details="Specialized in machine learning, statistical analysis, and data visualization. Completed projects in predictive modeling, natural language processing, and big data analytics."
            highlights={["Machine Learning", "Statistical Analysis", "Data Visualization", "NLP", "Big Data Analytics"]}
            logoUrl="/UoMlogo.png"
          />
          <Education
            degree="Exchange - Applied Mathematics"
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
      <Section id="contact" title="Come reach out!" index="05" centered>
        <motion.p variants={fadeInUp} className="mb-4 text-lg sm:text-xl text-neutral-600">
          Wanna grab milk tea or just wanna say hi? Reach out! ✌️
        </motion.p>
        <motion.div variants={fadeInUp} className="flex gap-4 items-center justify-center">
          {SOCIALS.map(({ href, label, icon: Icon, external }) => (
            <Magnetic key={href} strength={0.3}>
              <a
                href={href}
                aria-label={label}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-800 hover:bg-indigo-500 transition-colors duration-300 shadow-md"
              >
                <Icon className="text-white text-xl" aria-hidden="true" />
              </a>
            </Magnetic>
          ))}
        </motion.div>
        <motion.p variants={fadeInUp} className="text-sm text-neutral-500">
          or drop a line at{" "}
          <a href="mailto:lidc2504@gmail.com" className="link-underline font-medium text-indigo-600">
            lidc2504@gmail.com
          </a>
        </motion.p>
      </Section>
    </>
  );
}
