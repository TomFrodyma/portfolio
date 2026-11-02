/* Site navigation as a game chat box: type a destination, tom answers.
   Clickable links carry the load; typing is the fun layer on top. */

const ROUTES = {
  home: "/",
  work: "/work/",
  apps: "/apps/",
  story: "/story/",
  linkedin: "https://www.linkedin.com/in/tomfrodyma/",
};

const ALIASES = {
  resume: "work",
  cv: "work",
  projects: "apps",
  project: "apps",
  app: "apps",
  portfolio: "work",
  experience: "work",
  career: "work",
  job: "work",
  jobs: "work",
  quests: "work",
  about: "story",
  bio: "story",
  lore: "story",
  gaming: "apps",
  games: "apps",
  play: "apps",
  demos: "apps",
  start: "home",
  respawn: "home",
  lobby: "home",
  "?": "help",
  menu: "help",
  commands: "help",
};

const EGGS = {
  tophe: "tophe is unlocked: tophe.app",
  hi: "hi again.",
  hello: "hi again.",
  gg: "gg wp.",
  glhf: "gl hf. o7",
  "gl hf": "gl hf. o7",
  o7: "o7",
  afk: "np, the links will wait.",
  inventory: "inventory: 1x cv, 4x apps, 1x story. all equipped.",
  dance: "*tom dances*",
};

const HELP = [
  ["work", "my cv: where I worked and what I shipped"],
  ["apps", "the apps I built"],
  ["story", "how I got here"],
  ["home", "back to the start screen"],
  ["linkedin", "my LinkedIn profile"],
  ["clear", "wipe this output"],
];

const COMPLETIONS = Object.keys(ROUTES).concat(["help", "clear"]);
const KNOWN = COMPLETIONS.concat(Object.keys(ALIASES));

const PROMPT = "<you> ";

export function initTerminal() {
  const term = document.querySelector(".term");
  const out = document.getElementById("term-out");
  const form = document.getElementById("term-form");
  const input = document.getElementById("term-in");

  if (!term || !out || !form || !input) {
    return;
  }

  const history = [];
  let histIdx = 0;

  /* input grows with its content so the fake block cursor sits right after the text */
  const ctx = document.createElement("canvas").getContext("2d");
  const fit = () => {
    if (!ctx) {
      input.style.width = input.value.length + 1 + "ch";
      return;
    }
    ctx.font = getComputedStyle(input).font;
    input.style.width = Math.ceil(ctx.measureText(input.value).width) + 1 + "px";
  };
  input.addEventListener("input", fit);
  fit();

  const print = (content, cls) => {
    const div = document.createElement("div");
    div.className = "term-msg" + (cls ? " " + cls : "");
    if (typeof content === "string") {
      div.textContent = content;
    } else {
      div.appendChild(content);
    }
    out.appendChild(div);
    return div;
  };

  const echo = (raw) => {
    const f = document.createDocumentFragment();
    const prefix = document.createElement("span");
    prefix.className = "nick";
    prefix.textContent = PROMPT;
    f.appendChild(prefix);
    f.appendChild(document.createTextNode(raw));
    print(f);
  };

  /* replies come from <tom>, like the intro chat */
  const say = (content, cls) => {
    const f = document.createDocumentFragment();
    const nick = document.createElement("span");
    nick.className = "nick";
    nick.textContent = "<tom> ";
    f.appendChild(nick);
    f.appendChild(typeof content === "string" ? document.createTextNode(content) : content);
    print(f, cls);
  };

  const frag = (...parts) => {
    const f = document.createDocumentFragment();
    for (const part of parts) {
      f.appendChild(typeof part === "string" ? document.createTextNode(part) : part);
    }
    return f;
  };

  const cmdLink = (cmd) => {
    if (ROUTES[cmd]) {
      const a = document.createElement("a");
      a.href = ROUTES[cmd];
      a.textContent = cmd;
      return a;
    }
    const b = document.createElement("button");
    b.type = "button";
    b.className = "cmd-btn";
    b.dataset.cmd = cmd;
    b.textContent = cmd;
    return b;
  };

  const showHelp = () => {
    for (const [cmd, desc] of HELP) {
      const d = print(frag(cmdLink(cmd)));
      const dim = document.createElement("span");
      dim.className = "dim";
      dim.textContent = ": " + desc;
      d.appendChild(dim);
    }
    print("type one, tap one, same thing.", "dim");
  };

  const norm = (p) => p.replace(/\/+$/, "") || "/";

  const goTo = (cmd) => {
    const url = ROUTES[cmd];
    if (norm(location.pathname) === norm(url)) {
      say("you are already here.");
      return;
    }
    print("fast travelling to " + cmd + " ...", "dim");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => location.assign(url), reduce ? 0 : 300);
  };

  /* "I want to see your linkedin" goes to linkedin: a page name anywhere in
     the sentence wins over an alias, and the first one found is used */
  const findInSentence = (cmd) => {
    const words = cmd.replace(/linked\s+in/g, "linkedin").match(/[a-z]+/g) || [];
    const direct = words.find((w) => Object.hasOwn(ROUTES, w));
    if (direct) return direct;
    const alias = words.find((w) => Object.hasOwn(ALIASES, w) && Object.hasOwn(ROUTES, ALIASES[w]));
    return alias ? ALIASES[alias] : null;
  };

  const unknown = (display, cmd) => {
    const guess = KNOWN.find((c) => c.length > 1 && cmd.slice(0, 2) === c.slice(0, 2));
    if (guess) {
      const target = Object.hasOwn(ALIASES, guess) ? ALIASES[guess] : guess;
      say(frag("unknown destination: " + display + ". did you mean ", cmdLink(target), "?"));
    } else {
      say(frag("unknown destination: " + display + ". try ", cmdLink("help")));
    }
  };

  const run = (raw) => {
    let cmd = raw
      .toLowerCase()
      .trim()
      .replace(/^(open|goto|go to|go|warp to|warp)\s+/, "")
      .replace(/^\//, "")
      .replace(/\/$/, "");
    if (Object.hasOwn(EGGS, cmd)) {
      say(EGGS[cmd]);
      return;
    }
    if (cmd === "") {
      cmd = "home";
    }
    if (Object.hasOwn(ALIASES, cmd)) {
      cmd = ALIASES[cmd];
    }

    if (cmd === "help") {
      showHelp();
    } else if (cmd === "clear") {
      out.textContent = "";
      print(frag("clean slate. type a page name, or ", cmdLink("help")), "dim");
    } else if (Object.hasOwn(ROUTES, cmd)) {
      goTo(cmd);
    } else if (findInSentence(cmd)) {
      goTo(findInSentence(cmd));
    } else {
      unknown(raw.trim(), cmd);
    }
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const raw = input.value;
    input.value = "";
    if (!raw.trim()) {
      return;
    }
    history.push(raw);
    histIdx = history.length;
    fit();
    echo(raw);
    run(raw);
    input.scrollIntoView({ block: "nearest" });
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Tab" && !event.shiftKey && input.value.trim()) {
      const val = input.value.toLowerCase().trim();
      const matches = COMPLETIONS.filter((c) => c.startsWith(val));
      if (matches.length === 1 && matches[0] !== val) {
        event.preventDefault();
        input.value = matches[0];
        fit();
      }
      return;
    }
    if (event.key === "Escape") {
      input.value = "";
      fit();
      return;
    }
    if (event.key === "ArrowUp") {
      if (history.length) {
        event.preventDefault();
        histIdx = Math.max(0, histIdx - 1);
        input.value = history[histIdx];
        fit();
      }
      return;
    }
    if (event.key === "ArrowDown") {
      if (history.length) {
        event.preventDefault();
        histIdx = Math.min(history.length, histIdx + 1);
        input.value = history[histIdx] ?? "";
        fit();
      }
      return;
    }
    if (event.key === "l" && event.ctrlKey) {
      event.preventDefault();
      out.textContent = "";
    }
  });

  /* typing anywhere on the page lands in the prompt, no click needed */
  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    if (document.activeElement === input) {
      return;
    }
    const t = event.target;
    if (t instanceof HTMLElement && (t.isContentEditable || t.closest("input, textarea, select"))) {
      return;
    }
    /* printable keys only; plain space keeps its page-scroll default */
    if (event.key.length === 1 && event.key !== " ") {
      input.focus();
    }
  });

  term.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const btn = target && target.closest("[data-cmd]");
    if (btn) {
      echo(btn.dataset.cmd);
      run(btn.dataset.cmd);
      input.focus();
      input.scrollIntoView({ block: "nearest" });
      return;
    }
    if (target && target.closest("a, button, input")) {
      return;
    }
    const selection = window.getSelection && window.getSelection();
    if (selection && String(selection)) {
      return;
    }
    input.focus();
  });
}
