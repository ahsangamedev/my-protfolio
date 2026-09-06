const SECTIONS = ["home", "about", "projects", "skills", "resume", "contact"];
const PROJECT_LINKS = [
  { key: "demo", label: "Demo" },
  { key: "github", label: "Code", variant: "btn-ghost" },
  { key: "video", label: "Video", variant: "btn-ghost" },
];

let portfolioData = null;
let character = null;
let navWalker = null;
let heroPlane = null;
let lastScrollY = 0;
let scrollDirection = 1;
let allProjects = [];
let activeProjectFilter = "All";

async function init() {
  try {
    const res = await fetch("data/portfolio.json");
    portfolioData = await res.json();
  } catch {
    console.error("Could not load portfolio.json — use a local server.");
    return;
  }

  renderContent(portfolioData);
  setupNav();
  setupBackToTop();
  setupCharacterRail();
  setupScrollSpy();

  const canvas = document.getElementById("character-canvas");
  character = new PixelCharacter(canvas);

  const navCanvas = document.getElementById("nav-walker-canvas");
  if (navCanvas) {
    navWalker = new NavWalker(navCanvas);
  }

  const heroPlaneCanvas = document.getElementById("hero-plane-canvas");
  if (heroPlaneCanvas) {
    heroPlane = new HeroPlane(heroPlaneCanvas);
  }

  requestAnimationFrame(gameLoop);
}

function renderContent(data) {
  const { profile, projects, skills, resume, social } = data;

  document.title = `${profile.name} · Game Developer`;
  setText("nav-name", profile.shortName || profile.name.split(" ")[0]);
  setText("hero-name", profile.name);
  setText("hero-tagline", profile.tagline);
  setText("hero-bio", profile.bio);
  setText("footer-name", profile.name);

  const avatar = document.getElementById("hero-avatar");
  avatar.src = profile.avatar;
  avatar.onerror = () => { avatar.src = "assets/images/profile/placeholder.svg"; };

  const resumeBtn = document.getElementById("hero-resume-btn");
  resumeBtn.href = resume.file;

  const releasedProjects = projects.filter((project) => project.status === "Released").length;
  document.getElementById("hero-stats").innerHTML = `
    <div class="stat"><span class="stat-value">${releasedProjects}</span><span class="stat-label">Shipped Game</span></div>
    <div class="stat"><span class="stat-value">${skills.reduce((n, c) => n + c.items.length, 0)}</span><span class="stat-label">Core Skills</span></div>
    <div class="stat"><span class="stat-value">Open</span><span class="stat-label">Availability</span></div>
  `;

  document.getElementById("about-content").innerHTML = `
    <div class="about-card">
      <h3>${profile.title}</h3>
      <p>${profile.bio}</p>
      <ul class="about-details">
        <li><strong>Location</strong> ${profile.location}</li>
        <li><strong>Email</strong> <a href="mailto:${profile.email}">${profile.email}</a></li>
      </ul>
    </div>
    <div class="about-highlights">
      <div class="highlight-card">
        <span class="highlight-icon">🎮</span>
        <h4>Gameplay Systems</h4>
        <p>Player controllers, combat, AI, and physics-driven mechanics in Unity.</p>
      </div>
      <div class="highlight-card">
        <span class="highlight-icon">🎨</span>
        <h4>Polish & UX</h4>
        <p>Juice, animations, UI flows, and feel that make games satisfying to play.</p>
      </div>
      <div class="highlight-card">
        <span class="highlight-icon">🚀</span>
        <h4>Ship-Ready Code</h4>
        <p>Clean C# architecture, version control, and builds across platforms.</p>
      </div>
    </div>
  `;

  renderProjects(projects);

  document.getElementById("skills-content").innerHTML = skills
    .map(
      (cat) => `
      <div class="skill-card">
        <h3>${cat.category}</h3>
        ${cat.items
          .map(
            (s) => `
          <div class="skill-row">
            <div class="skill-row-header">
              <span>${s.name}</span>
              <span>${s.level}%</span>
            </div>
            <div class="skill-bar"><div class="skill-fill" style="width:0" data-level="${s.level}"></div></div>
          </div>
        `
          )
          .join("")}
      </div>
    `
    )
    .join("");

  document.getElementById("resume-content").innerHTML = `
    <div class="resume-top">
      <p>${resume.summary}</p>
      <div class="resume-actions">
        <a href="${resume.file}" class="btn btn-primary" target="_blank" rel="noopener">Download PDF</a>
        <a href="${resume.file}" class="btn btn-ghost" target="_blank" rel="noopener">View Online</a>
      </div>
    </div>
    <div class="timeline">
      ${resume.experience
        .map(
          (job) => `
        <div class="timeline-item">
          <div class="timeline-marker"></div>
          <div class="timeline-body">
            <span class="timeline-period">${job.period}</span>
            <h3>${job.role}</h3>
            <p class="timeline-company">${job.company}</p>
            <p>${job.description}</p>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;

  document.getElementById("contact-content").innerHTML = `
    <div class="contact-intro">
      <h3>Open to opportunities</h3>
      <p>Whether it's a full-time role, contract work, or a cool jam project — I'd love to hear from you.</p>
      <div class="contact-actions">
        <a href="mailto:${profile.email}" class="btn btn-primary">Email Me</a>
        <button type="button" class="btn btn-ghost copy-email" id="copy-email" data-email="${profile.email}">Copy Email</button>
      </div>
      <p class="copy-feedback" id="copy-feedback" aria-live="polite"></p>
    </div>
    <div class="social-links">
      ${social.map((s) => renderSocialCard(s)).join("")}
    </div>
  `;

  setupCopyEmail();
}

function renderProjects(projects) {
  allProjects = projects;
  activeProjectFilter = "All";
  updateProjectList();
}

function updateProjectList() {
  const filteredProjects = activeProjectFilter === "All"
    ? allProjects
    : allProjects.filter((project) => project.tags.includes(activeProjectFilter));
  const grid = document.getElementById("projects-content");
  const footer = document.getElementById("projects-footer");

  grid.innerHTML = filteredProjects.length
    ? filteredProjects.map((project, index) => renderProjectCard(project, index)).join("")
    : `<p class="project-empty">No projects match this filter yet.</p>`;

  if (footer) {
    footer.innerHTML = `<p class="projects-note">Select a tag to explore the work. Prototype projects are actively being developed.</p>`;
  }

  renderProjectControls(filteredProjects.length);
}

function renderProjectControls(visibleCount) {
  const controls = document.getElementById("projects-controls");
  if (!controls) return;

  const filters = ["All", ...new Set(allProjects.flatMap((project) => project.tags))];
  controls.innerHTML = `
    <p class="projects-summary" aria-live="polite">Showing ${visibleCount} of ${allProjects.length} projects</p>
    <div class="project-filters" role="group" aria-label="Filter projects by skill">
      ${filters.map((filter) => `
        <button class="filter-chip${filter === activeProjectFilter ? " active" : ""}" type="button" data-filter="${filter}" aria-pressed="${filter === activeProjectFilter}">${filter}</button>
      `).join("")}
    </div>
  `;

  controls.querySelectorAll(".filter-chip").forEach((button) => {
    button.addEventListener("click", () => {
      activeProjectFilter = button.dataset.filter;
      updateProjectList();
    });
  });
}

function renderProjectCard(project, index) {
  const featuredClass = index === 0 ? " project-card--featured" : "";
  const status = project.status || "Project";

  return `
    <article class="project-card${featuredClass}">
      <div class="project-image-wrap">
        <img src="${project.image}" alt="${project.title}" loading="lazy" onerror="this.src='assets/images/projects/placeholder.svg'" />
        <span class="project-status project-status--${status.toLowerCase().replaceAll(" ", "-")}">${status}</span>
      </div>
      <div class="project-body">
        <p class="project-kicker">${index === 0 ? "Featured project" : "Game project"}</p>
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        <div class="project-actions">${renderProjectActions(project.links)}</div>
        <div class="tags">${project.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
      </div>
    </article>
  `;
}

function renderProjectActions(links = {}) {
  const availableLinks = PROJECT_LINKS.filter(({ key }) => links[key]?.trim());
  if (!availableLinks.length) {
    return `<p class="project-unavailable">Private build — updates coming soon.</p>`;
  }

  return availableLinks.map(({ key, label, variant = "" }) => {
    const url = links[key]?.trim();
    const classes = ["btn", "btn-sm", variant].filter(Boolean).join(" ");
    return `<a href="${url}" target="_blank" rel="noopener" class="${classes}">${label}</a>`;
  }).join("");
}

function renderSocialCard(social) {
  const iconSrc = social.icon || "assets/images/icons/default.svg";
  const fallback = "assets/images/icons/default.svg";

  return `
    <a href="${social.url}" class="social-card" target="_blank" rel="noopener">
      <img
        class="social-icon"
        src="${iconSrc}"
        alt="${social.name} icon"
        width="32"
        height="32"
        loading="lazy"
        onerror="this.onerror=null;this.src='${fallback}'"
      />
      <span class="social-name">${social.name}</span>
      <span class="social-arrow">→</span>
    </a>
  `;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setupCopyEmail() {
  const button = document.getElementById("copy-email");
  const feedback = document.getElementById("copy-feedback");
  if (!button || !feedback) return;

  button.addEventListener("click", async () => {
    const email = button.dataset.email;
    const originalLabel = button.textContent;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
      } else {
        const helper = document.createElement("textarea");
        helper.value = email;
        helper.setAttribute("readonly", "");
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.select();
        document.execCommand("copy");
        helper.remove();
      }
      button.textContent = "Email copied!";
      feedback.textContent = "Email address copied to your clipboard.";
    } catch {
      feedback.textContent = "Copy wasn't available. Please use the Email Me button instead.";
    }

    window.setTimeout(() => {
      button.textContent = originalLabel;
    }, 2200);
  });
}

function setupNav() {
  const links = document.querySelectorAll(".nav-link");
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const id = link.getAttribute("data-section");
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
        nav.classList.remove("open");
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  });

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    document.body.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", open);
  });

  document.addEventListener("click", (e) => {
    if (!nav.classList.contains("open")) return;
    if (nav.contains(e.target) || toggle.contains(e.target)) return;
    nav.classList.remove("open");
    document.body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      nav.classList.remove("open");
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

function setupCharacterRail() {
  const container = document.getElementById("rail-checkpoints");
  SECTIONS.forEach((id, i) => {
    const dot = document.createElement("div");
    dot.className = "rail-dot";
    dot.dataset.section = id;
    dot.style.top = `${(i / (SECTIONS.length - 1)) * 100}%`;
    container.appendChild(dot);
  });
}

function setupScrollSpy() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          document.querySelectorAll(".nav-link").forEach((link) => {
            const isActive = link.dataset.section === id;
            link.classList.toggle("active", isActive);
            if (isActive) {
              link.setAttribute("aria-current", "page");
            } else {
              link.removeAttribute("aria-current");
            }
          });
          document.querySelectorAll(".rail-dot").forEach((dot) => {
            dot.classList.toggle("active", dot.dataset.section === id);
          });
        }
      });
    },
    { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
  );

  SECTIONS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });

  const skillsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll(".skill-fill").forEach((bar) => {
            bar.style.width = `${bar.dataset.level}%`;
          });
        }
      });
    },
    { threshold: 0.3 }
  );

  const skillsSection = document.getElementById("skills");
  if (skillsSection) skillsObserver.observe(skillsSection);

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function setupBackToTop() {
  const button = document.getElementById("back-to-top");
  if (!button) return;

  button.addEventListener("click", () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  });
}

function onScroll() {
  const scrollY = window.scrollY;
  scrollDirection = scrollY > lastScrollY ? 1 : -1;
  lastScrollY = scrollY;

  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? scrollY / docHeight : 0;

  const progressBar = document.getElementById("rail-progress");
  if (progressBar) progressBar.style.height = `${progress * 100}%`;

  const mobileFill = document.getElementById("mobile-scroll-fill");
  if (mobileFill) mobileFill.style.width = `${progress * 100}%`;

  const backToTop = document.getElementById("back-to-top");
  if (backToTop) {
    const isVisible = scrollY > 560;
    backToTop.classList.toggle("is-visible", isVisible);
    backToTop.tabIndex = isVisible ? 0 : -1;
  }

  updateCharacterPosition(progress);
}

function updateCharacterPosition(progress) {
  if (!character) return;

  const rail = document.querySelector(".rail-track");
  const canvas = document.getElementById("character-canvas");
  if (!rail || !canvas) return;

  const padding = 20;
  const walkable = rail.offsetHeight - padding * 2;
  const targetY = padding + progress * walkable;

  character.setTargetY(targetY);
  character.setFacingRight(scrollDirection >= 0);
  canvas.style.top = `${targetY}px`;
}

function handleResize() {
  onScroll();
  if (navWalker) navWalker.resetPosition();
  if (heroPlane) heroPlane.resize();
}

window.addEventListener("resize", handleResize);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", handleResize);
}

let lastTime = 0;
function gameLoop(time) {
  const dt = time - lastTime;
  lastTime = time;

  if (character) {
    character.update(dt);
    character.draw();
  }

  if (navWalker) {
    navWalker.update(dt);
    navWalker.draw();
  }

  if (heroPlane) {
    heroPlane.update(dt);
    heroPlane.draw();
  }

  requestAnimationFrame(gameLoop);
}

init();
