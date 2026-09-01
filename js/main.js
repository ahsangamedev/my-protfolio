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
let projectsPreviewCount = 3;

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

  document.getElementById("hero-stats").innerHTML = `
    <div class="stat"><span class="stat-value">${projects.length}</span><span class="stat-label">Projects</span></div>
    <div class="stat"><span class="stat-value">${skills.reduce((n, c) => n + c.items.length, 0)}</span><span class="stat-label">Skills</span></div>
    <div class="stat"><span class="stat-value">${resume.experience.length}+</span><span class="stat-label">Years Exp.</span></div>
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

  renderProjects(projects, data.settings?.projectsPreviewCount ?? 3);

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
      <a href="mailto:${profile.email}" class="btn btn-primary">${profile.email}</a>
    </div>
    <div class="social-links">
      ${social.map((s) => renderSocialCard(s)).join("")}
    </div>
  `;
}

function renderProjects(projects, previewCount) {
  projectsPreviewCount = previewCount;
  const grid = document.getElementById("projects-content");
  grid.innerHTML = projects
    .map((project, index) => renderProjectCard(project, index, previewCount))
    .join("");

  renderProjectsFooter(projects.length, false);
}

function renderProjectCard(project, index, previewCount) {
  const hiddenClass = index >= previewCount ? " project-card--hidden" : "";

  return `
    <article class="project-card${hiddenClass}" data-project-index="${index}">
      <div class="project-image-wrap">
        <img src="${project.image}" alt="${project.title}" loading="lazy" onerror="this.src='assets/images/projects/placeholder.svg'" />
      </div>
      <div class="project-body">
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        <div class="project-actions">${renderProjectActions(project.links)}</div>
        <div class="tags">${project.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
      </div>
    </article>
  `;
}

function renderProjectActions(links = {}) {
  return PROJECT_LINKS.map(({ key, label, variant = "" }) => {
    const url = links[key]?.trim();
    const classes = ["btn", "btn-sm", variant].filter(Boolean).join(" ");

    if (url) {
      return `<a href="${url}" target="_blank" rel="noopener" class="${classes}">${label}</a>`;
    }

    return `<span class="${classes} btn-disabled" aria-disabled="true">${label}</span>`;
  }).join("");
}

function expandProjects() {
  document.querySelectorAll(".project-card--hidden").forEach((card) => {
    card.classList.remove("project-card--hidden");
  });
}

function collapseProjects() {
  document.querySelectorAll(".project-card").forEach((card) => {
    const index = Number(card.dataset.projectIndex);
    if (index >= projectsPreviewCount) {
      card.classList.add("project-card--hidden");
    }
  });
}

function renderProjectsFooter(totalProjects, expanded) {
  const footer = document.getElementById("projects-footer");
  if (!footer) return;

  footer.innerHTML = "";

  if (totalProjects <= projectsPreviewCount) return;

  const hiddenCount = totalProjects - projectsPreviewCount;
  const button = document.createElement("button");
  button.type = "button";

  if (expanded) {
    button.className = "btn btn-ghost projects-see-less";
    button.textContent = "See Less";
    button.addEventListener("click", () => {
      collapseProjects();
      renderProjectsFooter(totalProjects, false);
      onScroll();
    });
  } else {
    button.className = "btn btn-primary projects-see-more";
    button.textContent = `See More (${hiddenCount})`;
    button.addEventListener("click", () => {
      expandProjects();
      renderProjectsFooter(totalProjects, true);
      onScroll();
    });
  }

  footer.appendChild(button);
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
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  });

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });

  document.addEventListener("click", (e) => {
    if (!nav.classList.contains("open")) return;
    if (nav.contains(e.target) || toggle.contains(e.target)) return;
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      nav.classList.remove("open");
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
            link.classList.toggle("active", link.dataset.section === id);
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
