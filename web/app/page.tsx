"use client";

import Link from "next/link";
import { Archivo, Space_Grotesk } from "next/font/google";
import { FormEvent, useEffect, useRef, useState } from "react";
import styles from "./landing.module.css";

const headingFont = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-agency-heading",
});

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-agency-body",
});

const sectionIds = ["work", "team", "contact"] as const;
type SectionId = (typeof sectionIds)[number];

type FormValues = {
  name: string;
  email: string;
  project: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

type SubmitState = "idle" | "success" | "error";
type ThemeMode = "light" | "dark";

const caseStudies = [
  {
    id: "01",
    title: "Noise to Narrative",
    category: "Brand System",
    summary:
      "We rebuilt a music startup identity in 21 days with a modular visual language and an interaction-first storytelling site.",
    metrics: "+230% pre-launch waitlist",
    tags: ["Identity", "WebGL Motion", "Campaign Film"],
    palette: "pink",
  },
  {
    id: "02",
    title: "Concrete Pulse",
    category: "Digital Experience",
    summary:
      "A brutalist portfolio ecosystem for an architecture collective with kinetic typography and tactile transitions.",
    metrics: "4m 28s avg session time",
    tags: ["Portfolio", "3D Layout", "Editorial UX"],
    palette: "cyan",
  },
  {
    id: "03",
    title: "Future Relics",
    category: "Product + Campaign",
    summary:
      "Launch platform for a limited drop fashion line, combining archival storytelling, social clips, and adaptive commerce.",
    metrics: "92% stock sold in 36h",
    tags: ["Art Direction", "Launch Funnel", "Content Ops"],
    palette: "acid",
  },
] as const;

const teamMembers = [
  {
    name: "Ari Vega",
    role: "Creative Director",
    bio: "Turns raw ideas into visual systems with cultural edge.",
  },
  {
    name: "Nico Yoon",
    role: "Motion Lead",
    bio: "Builds transitions that feel cinematic, not ornamental.",
  },
  {
    name: "Lena Ortiz",
    role: "Strategy + Story",
    bio: "Finds the narrative tension that makes brands unforgettable.",
  },
  {
    name: "Mika Stone",
    role: "Experience Engineer",
    bio: "Bridges design intent and performance-grade implementation.",
  },
] as const;

const valuePillars = [
  "Strategy before visuals",
  "Motion with narrative meaning",
  "Bold systems, maintainable execution",
] as const;

function validateField(name: keyof FormValues, value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    if (name === "name") return "Please enter your name.";
    if (name === "email") return "Please enter your email.";
    return "Please describe your project.";
  }

  if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Use a valid email format, for example team@brand.com.";
  }

  if (name === "project" && trimmed.length < 24) {
    return "Add a little more detail (at least 24 characters).";
  }

  return "";
}

function validateAll(values: FormValues): FormErrors {
  const nextErrors: FormErrors = {};

  (Object.keys(values) as Array<keyof FormValues>).forEach((field) => {
    const message = validateField(field, values[field]);
    if (message) {
      nextErrors[field] = message;
    }
  });

  return nextErrors;
}

export default function Home() {
  const pageRef = useRef<HTMLElement | null>(null);
  const inputRefs = {
    name: useRef<HTMLInputElement | null>(null),
    email: useRef<HTMLInputElement | null>(null),
    project: useRef<HTMLTextAreaElement | null>(null),
  };

  const [activeSection, setActiveSection] = useState<SectionId>("work");
  const [values, setValues] = useState<FormValues>({
    name: "",
    email: "",
    project: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    let frame = 0;

    const updateScrollVariables = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(window.scrollY / maxScroll, 1) : 0;

      page.style.setProperty("--scroll-progress", progress.toFixed(4));
      page.style.setProperty("--parallax-shift", `${Math.round(window.scrollY * 0.14)}px`);
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateScrollVariables);
    };

    updateScrollVariables();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    const revealTargets = Array.from(page.querySelectorAll<HTMLElement>("[data-reveal]"));
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.revealed = "true";
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -12% 0px",
      },
    );

    revealTargets.forEach((node) => revealObserver.observe(node));

    const sectionTargets = sectionIds
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node));

    const navObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          const id = visible[0].target.id as SectionId;
          setActiveSection(id);
        }
      },
      {
        threshold: [0.35, 0.55, 0.8],
        rootMargin: "-15% 0px -45% 0px",
      },
    );

    sectionTargets.forEach((node) => navObserver.observe(node));

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      revealTargets.forEach((node) => revealObserver.unobserve(node));
      revealObserver.disconnect();
      sectionTargets.forEach((node) => navObserver.unobserve(node));
      navObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const savedMode = window.localStorage.getItem("riot-frame-theme");
    if (savedMode === "light" || savedMode === "dark") {
      setThemeMode(savedMode);
      return;
    }

    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setThemeMode("dark");
    }
  }, []);

  const toggleTheme = () => {
    setThemeMode((prev) => {
      const next: ThemeMode = prev === "dark" ? "light" : "dark";
      window.localStorage.setItem("riot-frame-theme", next);
      return next;
    });
  };

  const handleChange = (field: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    if (submitState !== "idle") {
      setSubmitState("idle");
    }
  };

  const handleBlur = (field: keyof FormValues) => {
    const message = validateField(field, values[field]);
    if (message || errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: message }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateAll(values);

    setErrors(nextErrors);

    const firstErrorField = (Object.keys(nextErrors)[0] as keyof FormValues | undefined) ?? null;
    if (firstErrorField) {
      inputRefs[firstErrorField].current?.focus();
      setSubmitState("error");
      return;
    }

    setIsSubmitting(true);
    setSubmitState("idle");

    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      setSubmitState("success");
      setValues({ name: "", email: "", project: "" });
      setErrors({});
    } catch {
      setSubmitState("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>

      <main
        id="main-content"
        ref={pageRef}
        className={`${headingFont.variable} ${bodyFont.variable} ${styles.page} ${
          themeMode === "dark" ? styles.darkTheme : ""
        }`}
      >
        <div className={styles.scrollProgress} aria-hidden="true" />
        <div className={styles.backgroundNoise} aria-hidden="true" />

        <header className={styles.topbar}>
          <p className={styles.brand}>RIOT/FRAME</p>
          <div className={styles.topbarActions}>
            <nav aria-label="Primary navigation">
              <ul className={styles.navList}>
                <li>
                  <a
                    href="#work"
                    aria-current={activeSection === "work" ? "page" : undefined}
                    className={activeSection === "work" ? styles.activeLink : ""}
                  >
                    Work
                  </a>
                </li>
                <li>
                  <a
                    href="#team"
                    aria-current={activeSection === "team" ? "page" : undefined}
                    className={activeSection === "team" ? styles.activeLink : ""}
                  >
                    Team
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    aria-current={activeSection === "contact" ? "page" : undefined}
                    className={activeSection === "contact" ? styles.activeLink : ""}
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </nav>
            <button
              type="button"
              className={styles.themeToggle}
              aria-pressed={themeMode === "dark"}
              aria-label={`Switch to ${themeMode === "dark" ? "light" : "dark"} mode`}
              onClick={toggleTheme}
            >
              {themeMode === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </header>

        <section className={styles.hero} data-reveal aria-labelledby="hero-title">
          <div className={styles.heroHeadline}>
            <p className={styles.kicker}>Creative Agency Portfolio</p>
            <h1 id="hero-title">
              WE BUILD
              <br />
              BRANDS THAT
              <br />
              REFUSE TO BLEND IN.
            </h1>
            <p className={styles.heroCopy}>
              Brutalist composition. Motion-first storytelling. Strategy and execution for ambitious
              teams that want cultural impact, not generic polish.
            </p>
            <div className={styles.trustStrip} aria-label="Trusted by">
              <span>NOVA LABS</span>
              <span>MONO TYPE</span>
              <span>RADIUS CULT</span>
              <span>SHIFT STUDIO</span>
            </div>
          </div>

          <aside className={styles.heroPanel} aria-label="Agency highlights">
            <h2>What You Get</h2>
            <ul>
              <li>Brand strategy and positioning sprint</li>
              <li>Motion system with reusable interaction rules</li>
              <li>Web experience optimized for conversion and speed</li>
            </ul>
            <dl className={styles.metrics}>
              <div>
                <dt>19</dt>
                <dd>Launches in 2025</dd>
              </div>
              <div>
                <dt>07</dt>
                <dd>Global creative awards</dd>
              </div>
              <div>
                <dt>96%</dt>
                <dd>Client retention</dd>
              </div>
            </dl>
            <div className={styles.heroActions}>
              <a href="#work" className={styles.primaryCta}>
                Explore Case Studies
              </a>
              <Link href="/pricing" className={styles.secondaryCta}>
                View Services
              </Link>
            </div>
          </aside>
        </section>

        <section className={styles.marquee} aria-label="Agency capabilities ticker">
          <div className={styles.marqueeTrack}>
            <span>BRAND STRATEGY</span>
            <span>DIGITAL CAMPAIGNS</span>
            <span>MOTION SYSTEMS</span>
            <span>EXPERIMENTAL WEB</span>
            <span>CONTENT ENGINEERING</span>
            <span>BRAND STRATEGY</span>
            <span>DIGITAL CAMPAIGNS</span>
            <span>MOTION SYSTEMS</span>
          </div>
        </section>

        <section id="work" className={styles.section} data-reveal aria-labelledby="work-title">
          <div className={styles.sectionHeader}>
            <p className={styles.sectionIndex}>[ 01 ]</p>
            <h2 id="work-title">Case Study Previews</h2>
          </div>

          <div className={styles.caseGrid}>
            {caseStudies.map((study, index) => (
              <article
                key={study.id}
                className={`${styles.caseCard} ${styles[study.palette]} ${index === 0 ? styles.caseFeatured : ""}`}
              >
                <p className={styles.caseId}>{study.id}</p>
                <p className={styles.caseCategory}>{study.category}</p>
                <h3>{study.title}</h3>
                <p>{study.summary}</p>
                <p className={styles.caseMetric}>{study.metrics}</p>
                <ul className={styles.tagList} aria-label={`${study.title} tags`}>
                  {study.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
                <a href="#contact" className={styles.caseLink} aria-label={`Start a project like ${study.title}`}>
                  Start a project like this
                </a>
              </article>
            ))}
          </div>
        </section>

        <section id="team" className={styles.section} data-reveal aria-labelledby="team-title">
          <div className={styles.sectionHeader}>
            <p className={styles.sectionIndex}>[ 02 ]</p>
            <h2 id="team-title">The Team Behind The Chaos</h2>
          </div>

          <div className={styles.pillarRow}>
            {valuePillars.map((item) => (
              <p key={item} className={styles.pillarItem}>
                {item}
              </p>
            ))}
          </div>

          <div className={styles.teamGrid}>
            {teamMembers.map((member) => (
              <article key={member.name} className={styles.teamCard}>
                <h3>{member.name}</h3>
                <p className={styles.teamRole}>{member.role}</p>
                <p>{member.bio}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="contact" className={styles.section} data-reveal aria-labelledby="contact-title">
          <div className={styles.contactPanel}>
            <div>
              <p className={styles.sectionIndex}>[ 03 ]</p>
              <h2 id="contact-title">Let&apos;s Design Something Loud</h2>
              <p className={styles.contactCopy}>
                Tell us what you are launching, what is broken, and what must feel unmistakably yours.
                We will return with a concept sprint in 48 hours.
              </p>
              <p className={styles.contactMeta}>hello@riotframe.studio</p>
              <p className={styles.contactMeta}>Shanghai / New York / Remote</p>
            </div>

            <form className={styles.contactForm} noValidate onSubmit={handleSubmit}>
              <label htmlFor="name">
                Name <span aria-hidden="true">*</span>
              </label>
              <input
                ref={inputRefs.name}
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={values.name}
                onChange={(event) => handleChange("name", event.target.value)}
                onBlur={() => handleBlur("name")}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "name-error" : undefined}
                required
              />
              <p id="name-error" className={styles.fieldError} role={errors.name ? "alert" : undefined}>
                {errors.name}
              </p>

              <label htmlFor="email">
                Email <span aria-hidden="true">*</span>
              </label>
              <input
                ref={inputRefs.email}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={(event) => handleChange("email", event.target.value)}
                onBlur={() => handleBlur("email")}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : "email-helper"}
                required
              />
              <p id="email-helper" className={styles.fieldHint}>
                We only use this to reply to your brief.
              </p>
              <p id="email-error" className={styles.fieldError} role={errors.email ? "alert" : undefined}>
                {errors.email}
              </p>

              <label htmlFor="project">
                Project Brief <span aria-hidden="true">*</span>
              </label>
              <textarea
                ref={inputRefs.project}
                id="project"
                name="project"
                rows={5}
                placeholder="Brand overhaul, campaign launch, portfolio rebuild..."
                value={values.project}
                onChange={(event) => handleChange("project", event.target.value)}
                onBlur={() => handleBlur("project")}
                aria-invalid={Boolean(errors.project)}
                aria-describedby={errors.project ? "project-error" : "project-helper"}
                required
              />
              <p id="project-helper" className={styles.fieldHint}>
                Include goals, timeline, and target audience.
              </p>
              <p
                id="project-error"
                className={styles.fieldError}
                role={errors.project ? "alert" : undefined}
              >
                {errors.project}
              </p>

              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Brief"}
              </button>

              <p className={styles.submitStatus} role="status" aria-live="polite">
                {submitState === "success" && "Brief sent. We will reach out within 48 hours."}
                {submitState === "error" &&
                  "Please review the highlighted fields and try again."}
              </p>
            </form>
          </div>
        </section>

        <footer className={styles.footer}>
          <p>RIOT/FRAME © 2026</p>
          <Link href="/login">Client Portal</Link>
        </footer>
      </main>
    </>
  );
}
