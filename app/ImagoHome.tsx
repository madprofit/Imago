"use client";

import Image from "next/image";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type ContactFields = {
  name: string;
  email: string;
  organization: string;
  message: string;
};

type ContactFieldName = keyof ContactFields;

type BrandImageProps = {
  src: string;
  alt: string;
  available: boolean;
  className?: string;
};

const initialFields: ContactFields = {
  name: "",
  email: "",
  organization: "",
  message: ""
};

function BrandImage({
  src,
  alt,
  available,
  className
}: BrandImageProps) {
  if (!available) return null;

  return (
    <Image
      className={className}
      src={src}
      alt={alt}
      fill
      unoptimized
      onError={() => {
        console.error(`Brand asset failed to render: ${src}`);
      }}
    />
  );
}

function ContactForm() {
  const [fields, setFields] = useState(initialFields);
  const [errors, setErrors] = useState<Partial<ContactFields>>({});
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  const updateField = (field: ContactFieldName, value: string) => {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSent(false);
    setFormError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Partial<ContactFields> = {};

    if (!fields.name.trim()) nextErrors.name = "Please enter your name.";
    if (!fields.email.trim()) {
      nextErrors.email = "Please enter your email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      nextErrors.email = "Enter an email address in the right format.";
    }
    if (!fields.organization.trim()) {
      nextErrors.organization = "Please enter your organization.";
    }
    if (!fields.message.trim()) {
      nextErrors.message = "Please tell us what's changing.";
    }

    setErrors(nextErrors);
    setSent(false);
    setFormError("");
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields)
      });
      const result: unknown = await response.json();
      if (
        typeof result !== "object" ||
        result === null ||
        !("message" in result) ||
        typeof result.message !== "string"
      ) {
        throw new Error("The contact service returned an unexpected response.");
      }

      if (!response.ok) {
        setFormError(result.message);
        return;
      }

      setFields(initialFields);
      setSent(true);
    } catch (error) {
      console.error("Contact form submission failed:", error);
      setFormError(
        "Your message could not be sent. Please email hope@imagomarketing.com instead."
      );
    } finally {
      setPending(false);
    }
  };

  const fieldClass = (field: ContactFieldName) =>
    errors[field] ? "form-control has-error" : "form-control";

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="name">Name</label>
          <input
            className={fieldClass("name")}
            id="name"
            name="name"
            autoComplete="name"
            maxLength={100}
            value={fields.name}
            onChange={(event) => updateField("name", event.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && <span className="field-error" id="name-error">{errors.name}</span>}
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            className={fieldClass("email")}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            value={fields.email}
            onChange={(event) => updateField("email", event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && <span className="field-error" id="email-error">{errors.email}</span>}
        </div>
        <div className="field field-wide">
          <label htmlFor="organization">Organization</label>
          <input
            className={fieldClass("organization")}
            id="organization"
            name="organization"
            autoComplete="organization"
            maxLength={150}
            value={fields.organization}
            onChange={(event) => updateField("organization", event.target.value)}
            aria-invalid={Boolean(errors.organization)}
            aria-describedby={
              errors.organization ? "organization-error" : undefined
            }
          />
          {errors.organization && (
            <span className="field-error" id="organization-error">
              {errors.organization}
            </span>
          )}
        </div>
        <div className="field field-wide">
          <label htmlFor="message">What&apos;s changing?</label>
          <textarea
            className={fieldClass("message")}
            id="message"
            name="message"
            rows={5}
            maxLength={5000}
            value={fields.message}
            onChange={(event) => updateField("message", event.target.value)}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "message-error" : undefined}
          />
          {errors.message && (
            <span className="field-error" id="message-error">
              {errors.message}
            </span>
          )}
        </div>
      </div>
      <div className="form-submit-row">
        <button className="button button-primary" type="submit" disabled={pending}>
          {pending ? "Sending..." : "Send message"}
        </button>
        <p
          className={formError ? "form-feedback has-error" : "form-feedback"}
          aria-live="polite"
          role={formError ? "alert" : undefined}
        >
          {formError ||
            (sent &&
              "Thanks. A principal will be in touch within one business day.")}
        </p>
      </div>
    </form>
  );
}

type HomeProps = {
  logoWhiteAvailable: boolean;
  logoColorAvailable: boolean;
  wordmarkWhiteAvailable: boolean;
  butterflyScriptAvailable: boolean;
};

export default function Home({
  logoWhiteAvailable,
  logoColorAvailable,
  wordmarkWhiteAvailable,
  butterflyScriptAvailable
}: HomeProps) {
  const [heroActive, setHeroActive] = useState(true);
  const heroRef = useRef<HTMLElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const observer = new IntersectionObserver(([entry]) => {
      setHeroActive(entry.isIntersecting);
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useGSAP(
    () => {
      const motion = gsap.matchMedia();
      motion.add("(prefers-reduced-motion: no-preference)", () => {
        const intro = gsap.timeline({ defaults: { ease: "power2.out" } });
        intro
          .fromTo(
            ".nav-inner",
            { autoAlpha: 0, y: -8 },
            { autoAlpha: 1, y: 0, duration: 0.55 }
          )
          .fromTo(
            ".hero-kicker",
            { autoAlpha: 0, y: 18 },
            { autoAlpha: 1, y: 0, duration: 0.55 },
            "-=0.16"
          )
          .fromTo(
            ".hero-title",
            { autoAlpha: 0, y: 22 },
            { autoAlpha: 1, y: 0, duration: 0.7 },
            "-=0.24"
          )
          .fromTo(
            ".hero-lead",
            { autoAlpha: 0, y: 18 },
            { autoAlpha: 1, y: 0, duration: 0.6 },
            "-=0.34"
          )
          .fromTo(
            ".hero-actions .button",
            { autoAlpha: 0, y: 12 },
            { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.1 },
            "-=0.28"
          );

        const reveal = (
          targets: string,
          trigger: string,
          stagger = 0
        ) => {
          gsap.fromTo(
            targets,
            { autoAlpha: 0, y: 24 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.75,
              stagger,
              ease: "power2.out",
              scrollTrigger: {
                trigger,
                start: "top 82%",
                once: true
              }
            }
          );
        };

        reveal(".about-layout > *", ".about-layout", 0.14);
        reveal(".how-heading", ".how-heading");
        reveal(".step-card", ".steps-grid", 0.12);
        reveal(".contact-heading", ".contact-heading");
        reveal(".contact-layout > *", ".contact-layout", 0.14);
        reveal(".footer-inner > *", ".site-footer", 0.1);
      });

      return () => motion.revert();
    },
    { scope: pageRef }
  );

  return (
    <div ref={pageRef}>
      <header className={heroActive ? "site-nav" : "site-nav nav-solid"}>
        <div className="nav-inner">
          <a className="brand-link" href="#top" aria-label="IMAGO Marketing home">
            <BrandImage
              className="nav-logo"
              src={heroActive ? "/imago-logo-white.svg" : "/imago-logo.svg.svg"}
              alt="IMAGO Marketing"
              available={heroActive ? logoWhiteAvailable : logoColorAvailable}
            />
          </a>
          <nav className="nav-links" aria-label="Main navigation">
            <a href="#about">About</a>
            <a href="#how">How we work</a>
            <a href="#contact">Contact</a>
          </nav>
          <a
            className={heroActive ? "button nav-cta nav-cta-hero" : "button button-primary nav-cta"}
            href="#contact"
          >
            Talk to a principal
          </a>
        </div>
      </header>

      <main id="top">
        <section
          className="hero-section hero-track"
          aria-label="Principal-led marketing and PR"
          data-butterfly-track
          ref={heroRef}
        >
          <div className="hero-stage">
            <div className="hero-panel">
              <canvas
                className="butterfly-canvas"
                data-butterfly
                data-artwork="/IMAGO_butterfly.svg"
                data-offset="92"
                data-background="#265ae3"
                data-deep="#0c329d"
                data-zoom="3"
                data-mobile-zoom="3"
                aria-hidden="true"
              />
              <div className="hero-scrim" />
              <div className="film-grain" />
              <div className="hero-copy">
                <p className="hero-kicker">Principal-led marketing &amp; PR</p>
                <h1 className="hero-title" aria-label="IMAGO">
                  <BrandImage
                    src="/imago-wordmark-white.svg"
                    alt="IMAGO"
                    available={wordmarkWhiteAvailable}
                  />
                </h1>
                <p className="hero-lead">
                  Clear marketing and PR direction for organizations at a turning
                  point. You work with a senior principal from the first
                  conversation to the last.
                </p>
                <div className="hero-actions">
                  <a className="button button-hero-primary" href="#contact">
                    Talk to a principal
                  </a>
                  <a className="button button-hero-secondary" href="#how">
                    See how we work
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="content-section about-section" id="about" aria-label="About IMAGO">
          <div className="section-shell about-layout">
            <div className="section-heading">
              <p className="eyebrow">About IMAGO</p>
              <h2>Direction for organizations ready to change shape.</h2>
            </div>
            <div className="about-copy">
              <p>
                IMAGO works with established organizations at a turning point
                — when the next chapter calls for a clearer story, sharper
                priorities, or a different way forward.
              </p>
              <p>
                Every engagement is led by a senior principal, from the first
                conversation through delivery. No hand-offs to junior teams.
              </p>
            </div>
          </div>
        </section>

        <section className="content-section how-section" id="how" aria-label="How we work">
          <div className="section-shell">
            <div className="section-heading how-heading">
              <p className="eyebrow">How we work</p>
              <h2>Three steps. One principal.</h2>
            </div>
            <div className="steps-grid">
              <article className="step-card">
                <span className="step-number">01</span>
                <h3>Listen</h3>
                <p>
                  Understand the organization, its audiences and the moment
                  it&apos;s in.
                </p>
              </article>
              <article className="step-card">
                <span className="step-number">02</span>
                <h3>Decide</h3>
                <p>
                  Agree on what to say, to whom, and in what order.
                </p>
              </article>
              <article className="step-card">
                <span className="step-number">03</span>
                <h3>Deliver</h3>
                <p>
                  The principal leads the marketing and PR work through to
                  results.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="content-section contact-section" id="contact" aria-label="Contact IMAGO">
          <div className="section-shell">
            <div className="section-heading contact-heading">
              <p className="eyebrow">Contact</p>
              <h2>Start with a conversation.</h2>
              <p className="section-lead">
                Tell us where your organization is headed. A principal will
                reply within one business day.
              </p>
            </div>
            <div className="contact-layout">
              <ContactForm />
              <aside className="contact-details" aria-label="Direct contact details">
                <div className="contact-detail">
                  <p className="detail-label">Email</p>
                  <a href="mailto:hope@imagomarketing.com">hope@imagomarketing.com</a>
                </div>
                <div className="contact-detail">
                  <p className="detail-label">Phone</p>
                  <a href="tel:+12108629533">210-862-9533</a>
                </div>
                <div className="contact-detail">
                  <p className="detail-label">Location</p>
                  <p>San Antonio, TX</p>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <a className="footer-brand" href="#top" aria-label="IMAGO Marketing home">
            <BrandImage
              src="/imago-logo.svg.svg"
              alt="IMAGO Marketing"
              available={logoColorAvailable}
            />
          </a>
          <p>© {new Date().getFullYear()} IMAGO Marketing</p>
          <a href="mailto:hope@imagomarketing.com">hope@imagomarketing.com</a>
        </div>
      </footer>
      {butterflyScriptAvailable && (
        <Script src="/butterfly-loop.js" strategy="afterInteractive" />
      )}
    </div>
  );
}
