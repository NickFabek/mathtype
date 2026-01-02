(function (global) {
  'use strict';

  var DEFAULT_CONFIG = {
    baseFontSize: 22,
    mathFontFamily: "STIX Two Math, Cambria Math, Times New Roman, serif",
    uiFontFamily: "Avenir Next, Gill Sans, Trebuchet MS, sans-serif",
    scriptScale: 0.7,
    scriptMinSize: 8,
    fracLineThickness: 0.06,
    fracNumAlign: "center",
    fracDenomAlign: "center",
    matrixRowGap: 0.3,
    matrixColGap: 0.4,
    fencePadding: 0.1,
    operatorSpacing: 0.16,
    useOperatorSpacing: false,
    useMunderover: true,
    thinSpace: 0.1667,
    mediumSpace: 0.2222,
    thickSpace: 0.2778,
    quad: 1,
    qquad: 2,
    displayMode: true
  };

  function mergeConfig(base, override) {
    var out = {};
    var key;
    for (key in base) {
      if (Object.prototype.hasOwnProperty.call(base, key)) {
        out[key] = base[key];
      }
    }
    if (!override) {
      return out;
    }
    for (key in override) {
      if (Object.prototype.hasOwnProperty.call(override, key)) {
        out[key] = override[key];
      }
    }
    return out;
  }

  function escapeText(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  var GREEK = {
    alpha: "α",
    beta: "β",
    gamma: "γ",
    delta: "δ",
    epsilon: "ε",
    varepsilon: "ϵ",
    zeta: "ζ",
    eta: "η",
    theta: "θ",
    vartheta: "ϑ",
    iota: "ι",
    kappa: "κ",
    lambda: "λ",
    mu: "μ",
    nu: "ν",
    xi: "ξ",
    omicron: "ο",
    pi: "π",
    varpi: "ϖ",
    rho: "ρ",
    varrho: "ϱ",
    sigma: "σ",
    varsigma: "ς",
    tau: "τ",
    upsilon: "υ",
    phi: "φ",
    varphi: "ϕ",
    chi: "χ",
    psi: "ψ",
    omega: "ω",
    Gamma: "Γ",
    Delta: "Δ",
    Theta: "Θ",
    Lambda: "Λ",
    Xi: "Ξ",
    Pi: "Π",
    Sigma: "Σ",
    Upsilon: "Υ",
    Phi: "Φ",
    Psi: "Ψ",
    Omega: "Ω"
  };

  var COMMAND_SYMBOLS = {
    times: "×",
    cdot: "·",
    pm: "±",
    mp: "∓",
    div: "÷",
    le: "≤",
    leq: "≤",
    ge: "≥",
    geq: "≥",
    neq: "≠",
    approx: "≈",
    sim: "∼",
    simeq: "≃",
    equiv: "≡",
    propto: "∝",
    to: "→",
    rightarrow: "→",
    leftarrow: "←",
    leftrightarrow: "↔",
    Rightarrow: "⇒",
    Leftarrow: "⇐",
    Leftrightarrow: "⇔",
    mapsto: "↦",
    in: "∈",
    notin: "∉",
    subset: "⊂",
    subseteq: "⊆",
    superset: "⊃",
    supeseteq: "⊇",
    cap: "∩",
    cup: "∪",
    setminus: "∖",
    forall: "∀",
    exists: "∃",
    nabla: "∇",
    partial: "∂",
    infty: "∞",
    angle: "∠",
    cdots: "⋯",
    ldots: "…",
    vdots: "⋮",
    ddots: "⋱",
    perp: "⟂",
    parallel: "∥",
    mid: "∣",
    neg: "¬",
    land: "∧",
    lor: "∨",
    oplus: "⊕",
    otimes: "⊗",
    oslash: "⊘",
    circ: "∘",
    bullet: "•"
  };

  var LARGE_OPERATORS = {
    sum: "∑",
    prod: "∏",
    coprod: "∐",
    int: "∫",
    oint: "∮",
    iint: "∬",
    iiint: "∭",
    oiint: "∯",
    oiiint: "∰",
    bigcup: "⋃",
    bigcap: "⋂",
    bigsqcup: "⨆",
    bigvee: "⋁",
    bigwedge: "⋀",
    bigodot: "⨀",
    bigotimes: "⨂",
    bigoplus: "⨁"
  };

  var FUNCTION_NAMES = {
    sin: true,
    cos: true,
    tan: true,
    cot: true,
    sec: true,
    csc: true,
    arcsin: true,
    arccos: true,
    arctan: true,
    sinh: true,
    cosh: true,
    tanh: true,
    log: true,
    ln: true,
    exp: true,
    lim: true,
    max: true,
    min: true,
    sup: true,
    inf: true,
    det: true,
    gcd: true,
    lcm: true
  };

  var DELIMITERS = {
    "(": "(",
    ")": ")",
    "[": "[",
    "]": "]",
    "{": "{",
    "}": "}",
    "|": "|",
    ".": "",
    "\\{": "{",
    "\\}": "}",
    "langle": "⟨",
    "rangle": "⟩",
    "lceil": "⌈",
    "rceil": "⌉",
    "lfloor": "⌊",
    "rfloor": "⌋",
    "vert": "|",
    "Vert": "‖"
  };

  function Parser(input, config) {
    this.input = input;
    this.length = input.length;
    this.pos = 0;
    this.config = config;
  }

  Parser.prototype.eof = function () {
    return this.pos >= this.length;
  };

  Parser.prototype.peek = function () {
    return this.input[this.pos];
  };

  Parser.prototype.next = function () {
    return this.input[this.pos++];
  };

  Parser.prototype.startsWith = function (str) {
    return this.input.slice(this.pos, this.pos + str.length) === str;
  };

  Parser.prototype.skipSpaces = function () {
    while (!this.eof() && /\s/.test(this.peek())) {
      this.pos += 1;
    }
  };

  Parser.prototype.readCommand = function () {
    if (this.peek() !== "\\") {
      return null;
    }
    this.pos += 1;
    if (this.eof()) {
      return "";
    }
    var ch = this.peek();
    if (ch === "\\") {
      this.pos += 1;
      return "\\";
    }
    if (!/[A-Za-z]/.test(ch)) {
      this.pos += 1;
      return ch;
    }
    var start = this.pos;
    while (!this.eof() && /[A-Za-z]/.test(this.peek())) {
      this.pos += 1;
    }
    return this.input.slice(start, this.pos);
  };

  Parser.prototype.parse = function () {
    var expr = this.parseExpression({});
    return expr;
  };

  Parser.prototype.parseExpression = function (stop) {
    var items = [];
    while (!this.eof()) {
      if (stop.brace && this.peek() === "}") {
        break;
      }
      if (stop.ampersand && this.peek() === "&") {
        break;
      }
      if (stop.newline && this.startsWith("\\\\")) {
        break;
      }
      if (stop.right && this.startsWith("\\right")) {
        break;
      }
      if (stop.endEnv && this.startsWith("\\end")) {
        var save = this.pos;
        this.readCommand();
        var envName = this.parseGroupRaw();
        this.pos = save;
        if (envName === stop.endEnv) {
          break;
        }
      }
      var atom = this.parseAtom();
      if (!atom) {
        continue;
      }
      atom = this.parseScripts(atom);
      items.push(atom);
    }
    if (items.length === 0) {
      return { type: "row", items: [] };
    }
    if (items.length === 1) {
      return items[0];
    }
    return { type: "row", items: items };
  };

  Parser.prototype.parseAtom = function () {
    this.skipSpaces();
    if (this.eof()) {
      return null;
    }
    var ch = this.peek();
    if (ch === "{") {
      this.pos += 1;
      var expr = this.parseExpression({ brace: true });
      if (this.peek() === "}") {
        this.pos += 1;
      }
      return expr;
    }
    if (ch === "}") {
      return null;
    }
    if (ch === "^") {
      return null;
    }
    if (ch === "_") {
      return null;
    }
    if (ch === "&") {
      return null;
    }
    if (ch === "\\" && this.startsWith("\\\\")) {
      return null;
    }
    if (/[0-9]/.test(ch)) {
      return this.parseNumber();
    }
    if (/[A-Za-z]/.test(ch)) {
      return this.parseIdentifier();
    }
    if (ch === "\\") {
      return this.parseCommand();
    }
    this.pos += 1;
    return { type: "mo", text: ch };
  };

  Parser.prototype.parseNumber = function () {
    var start = this.pos;
    while (!this.eof() && /[0-9]/.test(this.peek())) {
      this.pos += 1;
    }
    if (this.peek() === ".") {
      this.pos += 1;
      while (!this.eof() && /[0-9]/.test(this.peek())) {
        this.pos += 1;
      }
    }
    return { type: "mn", text: this.input.slice(start, this.pos) };
  };

  Parser.prototype.parseIdentifier = function () {
    var start = this.pos;
    while (!this.eof() && /[A-Za-z]/.test(this.peek())) {
      this.pos += 1;
    }
    var text = this.input.slice(start, this.pos);
    return { type: "mi", text: text };
  };

  Parser.prototype.parseGroupRaw = function () {
    this.skipSpaces();
    if (this.peek() !== "{") {
      return "";
    }
    this.pos += 1;
    var depth = 1;
    var start = this.pos;
    while (!this.eof() && depth > 0) {
      var ch = this.next();
      if (ch === "{") {
        depth += 1;
      } else if (ch === "}") {
        depth -= 1;
      }
    }
    var end = this.pos - 1;
    return this.input.slice(start, end);
  };

  Parser.prototype.parseGroupText = function () {
    this.skipSpaces();
    if (this.peek() !== "{") {
      return "";
    }
    this.pos += 1;
    var depth = 1;
    var out = "";
    while (!this.eof() && depth > 0) {
      var ch = this.next();
      if (ch === "{") {
        depth += 1;
        out += ch;
      } else if (ch === "}") {
        depth -= 1;
        if (depth > 0) {
          out += ch;
        }
      } else {
        out += ch;
      }
    }
    return out;
  };

  Parser.prototype.parseRequiredGroup = function () {
    this.skipSpaces();
    if (this.peek() === "{") {
      this.pos += 1;
      var expr = this.parseExpression({ brace: true });
      if (this.peek() === "}") {
        this.pos += 1;
      }
      return expr;
    }
    return this.parseAtom();
  };

  Parser.prototype.parseOptionalBracket = function () {
    this.skipSpaces();
    if (this.peek() !== "[") {
      return null;
    }
    this.pos += 1;
    var expr = this.parseExpression({});
    if (this.peek() === "]") {
      this.pos += 1;
    }
    return expr;
  };

  Parser.prototype.parseDelimiter = function () {
    this.skipSpaces();
    if (this.eof()) {
      return "";
    }
    if (this.peek() === "\\") {
      var save = this.pos;
      var name = this.readCommand();
      if (DELIMITERS[name]) {
        return DELIMITERS[name];
      }
      if (name === "{") {
        return "{";
      }
      if (name === "}") {
        return "}";
      }
      this.pos = save;
      var ch = this.next();
      return ch;
    }
    var ch2 = this.next();
    if (DELIMITERS[ch2] !== undefined) {
      return DELIMITERS[ch2];
    }
    return ch2;
  };

  Parser.prototype.parseScripts = function (base) {
    this.skipSpaces();
    var sub = null;
    var sup = null;
    while (!this.eof()) {
      var ch = this.peek();
      if (ch !== "_" && ch !== "^") {
        break;
      }
      this.pos += 1;
      if (ch === "_") {
        sub = this.parseRequiredGroup();
      } else {
        sup = this.parseRequiredGroup();
      }
      this.skipSpaces();
    }
    if (!sub && !sup) {
      return base;
    }
    if (base.type === "operator" && base.large && this.config.useMunderover) {
      if (sub && sup) {
        return { type: "munderover", base: base, under: sub, over: sup };
      }
      if (sub) {
        return { type: "munder", base: base, under: sub };
      }
      return { type: "mover", base: base, over: sup };
    }
    if (sub && sup) {
      return { type: "subsup", base: base, sub: sub, sup: sup };
    }
    if (sub) {
      return { type: "sub", base: base, sub: sub };
    }
    return { type: "sup", base: base, sup: sup };
  };

  Parser.prototype.parseCommand = function () {
    var name = this.readCommand();
    if (!name) {
      return null;
    }
    if (name === "frac" || name === "dfrac" || name === "tfrac") {
      var numerator = this.parseRequiredGroup();
      var denominator = this.parseRequiredGroup();
      var node = { type: "frac", num: numerator, den: denominator };
      if (name === "dfrac") {
        node.displayStyle = true;
      }
      if (name === "tfrac") {
        node.displayStyle = false;
      }
      return node;
    }
    if (name === "sqrt") {
      var root = this.parseOptionalBracket();
      var body = this.parseRequiredGroup();
      if (root) {
        return { type: "root", body: body, root: root };
      }
      return { type: "sqrt", body: body };
    }
    if (name === "left") {
      var open = this.parseDelimiter();
      var inner = this.parseExpression({ right: true });
      if (this.startsWith("\\right")) {
        this.readCommand();
      }
      var close = this.parseDelimiter();
      return { type: "fenced", open: open, close: close, body: inner };
    }
    if (name === "right") {
      return null;
    }
    if (name === "begin") {
      var env = this.parseGroupRaw();
      return this.parseEnvironment(env);
    }
    if (name === "end") {
      return null;
    }
    if (name === "text") {
      var text = this.parseGroupText();
      return { type: "mtext", text: text };
    }
    if (name === "operatorname") {
      var opText = this.parseGroupText();
      return { type: "operatorname", text: opText };
    }
    if (name === "mathrm" || name === "mathbf" || name === "mathit" || name === "mathbb" || name === "mathtt" || name === "mathcal" || name === "mathfrak") {
      var variantMap = {
        mathrm: "normal",
        mathit: "italic",
        mathbb: "double-struck",
        mathbf: "bold",
        mathtt: "monospace",
        mathcal: "script",
        mathfrak: "fraktur"
      };
      var styled = this.parseRequiredGroup();
      return { type: "style", variant: variantMap[name] || "normal", body: styled };
    }
    if (name === "overline" || name === "bar" || name === "underline" || name === "vec" || name === "hat" || name === "tilde" || name === "dot" || name === "ddot") {
      var accents = {
        overline: "¯",
        bar: "¯",
        underline: "_",
        vec: "→",
        hat: "^",
        tilde: "~",
        dot: "˙",
        ddot: "¨"
      };
      var accentBody = this.parseRequiredGroup();
      var accentChar = accents[name];
      if (name === "underline") {
        return { type: "accent", position: "under", accent: accentChar, body: accentBody };
      }
      return { type: "accent", position: "over", accent: accentChar, body: accentBody };
    }
    if (name === "phantom") {
      var phantomBody = this.parseRequiredGroup();
      return { type: "phantom", body: phantomBody };
    }
    if (name === "\") {
      return { type: "newline" };
    }
    if (name === ",") {
      return { type: "space", width: this.config.thinSpace };
    }
    if (name === ":") {
      return { type: "space", width: this.config.mediumSpace };
    }
    if (name === ";") {
      return { type: "space", width: this.config.thickSpace };
    }
    if (name === "!") {
      return { type: "space", width: -this.config.thinSpace };
    }
    if (name === "quad") {
      return { type: "space", width: this.config.quad };
    }
    if (name === "qquad") {
      return { type: "space", width: this.config.qquad };
    }
    if (GREEK[name]) {
      return { type: "mi", text: GREEK[name] };
    }
    if (COMMAND_SYMBOLS[name]) {
      return { type: "mo", text: COMMAND_SYMBOLS[name] };
    }
    if (LARGE_OPERATORS[name]) {
      return { type: "operator", text: LARGE_OPERATORS[name], large: true };
    }
    if (FUNCTION_NAMES[name]) {
      return { type: "function", text: name };
    }
    if (name === "{"
      || name === "}"
      || name === "#"
      || name === "%"
      || name === "$") {
      return { type: "mo", text: name };
    }
    return { type: "mi", text: name };
  };

  Parser.prototype.parseEnvironment = function (env) {
    if (!env) {
      return { type: "row", items: [] };
    }
    if (env === "matrix" || env === "pmatrix" || env === "bmatrix" || env === "Bmatrix" || env === "vmatrix" || env === "Vmatrix" || env === "cases" || env === "aligned" || env === "array") {
      var open = "";
      var close = "";
      if (env === "pmatrix") {
        open = "(";
        close = ")";
      } else if (env === "bmatrix") {
        open = "[";
        close = "]";
      } else if (env === "Bmatrix") {
        open = "{";
        close = "}";
      } else if (env === "vmatrix") {
        open = "|";
        close = "|";
      } else if (env === "Vmatrix") {
        open = "‖";
        close = "‖";
      } else if (env === "cases") {
        open = "{";
        close = "";
      }
      if (env === "array") {
        this.parseGroupRaw();
      }
      return this.parseMatrix(env, open, close);
    }
    var content = this.parseExpression({ endEnv: env });
    if (this.startsWith("\\end")) {
      this.readCommand();
      this.parseGroupRaw();
    }
    return content;
  };

  Parser.prototype.parseMatrix = function (env, open, close) {
    var rows = [];
    var row = [];
    while (!this.eof()) {
      var cell = this.parseExpression({ ampersand: true, newline: true, endEnv: env });
      row.push(cell);
      if (this.startsWith("\\end")) {
        this.readCommand();
        this.parseGroupRaw();
        rows.push(row);
        break;
      }
      if (this.startsWith("\\\\")) {
        this.pos += 2;
        rows.push(row);
        row = [];
        continue;
      }
      if (this.peek() === "&") {
        this.pos += 1;
        continue;
      }
      if (this.eof()) {
        rows.push(row);
        break;
      }
    }
    return { type: "matrix", rows: rows, open: open, close: close };
  };

  function renderNode(node, config) {
    if (!node) {
      return "";
    }
    switch (node.type) {
      case "row":
        return "<mrow>" + node.items.map(function (child) {
          return renderNode(child, config);
        }).join("") + "</mrow>";
      case "mi":
        return "<mi>" + escapeText(node.text) + "</mi>";
      case "mn":
        return "<mn>" + escapeText(node.text) + "</mn>";
      case "mo":
        return renderMo(node.text, config);
      case "mtext":
        return "<mtext>" + escapeText(node.text) + "</mtext>";
      case "operatorname":
        return "<mi mathvariant=\"normal\">" + escapeText(node.text) + "</mi>";
      case "function":
        return "<mi mathvariant=\"normal\">" + escapeText(node.text) + "</mi>";
      case "operator":
        return renderOperator(node.text, config);
      case "frac":
        return renderFrac(node, config);
      case "sqrt":
        return "<msqrt>" + renderNode(node.body, config) + "</msqrt>";
      case "root":
        return "<mroot>" + renderNode(node.body, config) + renderNode(node.root, config) + "</mroot>";
      case "sup":
        return "<msup>" + renderNode(node.base, config) + renderNode(node.sup, config) + "</msup>";
      case "sub":
        return "<msub>" + renderNode(node.base, config) + renderNode(node.sub, config) + "</msub>";
      case "subsup":
        return "<msubsup>" + renderNode(node.base, config) + renderNode(node.sub, config) + renderNode(node.sup, config) + "</msubsup>";
      case "mover":
        return "<mover>" + renderNode(node.base, config) + renderNode(node.over, config) + "</mover>";
      case "munder":
        return "<munder>" + renderNode(node.base, config) + renderNode(node.under, config) + "</munder>";
      case "munderover":
        return "<munderover>" + renderNode(node.base, config) + renderNode(node.under, config) + renderNode(node.over, config) + "</munderover>";
      case "accent":
        return renderAccent(node, config);
      case "fenced":
        return renderFenced(node, config);
      case "matrix":
        return renderMatrix(node, config);
      case "space":
        return "<mspace width=\"" + node.width + "em\" />";
      case "style":
        return "<mstyle mathvariant=\"" + node.variant + "\">" + renderNode(node.body, config) + "</mstyle>";
      case "phantom":
        return "<mphantom>" + renderNode(node.body, config) + "</mphantom>";
      case "newline":
        return "<mspace linebreak=\"newline\" />";
      case "raw":
        return node.text || "";
      default:
        return "";
    }
  }

  function renderMo(text, config) {
    var attrs = "";
    if (config.useOperatorSpacing && /[+\-*/=<>∑∏∫]/.test(text)) {
      attrs = " lspace=\"" + config.operatorSpacing + "em\" rspace=\"" + config.operatorSpacing + "em\"";
    }
    return "<mo" + attrs + ">" + escapeText(text) + "</mo>";
  }

  function renderOperator(text, config) {
    var attrs = " largeop=\"true\" movablelimits=\"true\"";
    if (config.useOperatorSpacing) {
      attrs += " lspace=\"" + config.operatorSpacing + "em\" rspace=\"" + config.operatorSpacing + "em\"";
    }
    return "<mo" + attrs + ">" + escapeText(text) + "</mo>";
  }

  function renderFrac(node, config) {
    var attrs = " linethickness=\"" + config.fracLineThickness + "em\"";
    if (config.fracNumAlign) {
      attrs += " numalign=\"" + config.fracNumAlign + "\"";
    }
    if (config.fracDenomAlign) {
      attrs += " denomalign=\"" + config.fracDenomAlign + "\"";
    }
    var inner = "<mfrac" + attrs + ">" + renderNode(node.num, config) + renderNode(node.den, config) + "</mfrac>";
    if (node.displayStyle === true) {
      return "<mstyle displaystyle=\"true\">" + inner + "</mstyle>";
    }
    if (node.displayStyle === false) {
      return "<mstyle displaystyle=\"false\">" + inner + "</mstyle>";
    }
    return inner;
  }

  function renderAccent(node, config) {
    var accentMo = "<mo accent=\"true\">" + escapeText(node.accent) + "</mo>";
    if (node.position === "under") {
      return "<munder accentunder=\"true\">" + renderNode(node.body, config) + accentMo + "</munder>";
    }
    return "<mover accent=\"true\">" + renderNode(node.body, config) + accentMo + "</mover>";
  }

  function renderFenced(node, config) {
    var parts = [];
    if (node.open) {
      parts.push("<mo fence=\"true\" stretchy=\"true\" lspace=\"0em\" rspace=\"0em\">" + escapeText(node.open) + "</mo>");
    }
    if (config.fencePadding) {
      parts.push("<mspace width=\"" + config.fencePadding + "em\" />");
    }
    parts.push(renderNode(node.body, config));
    if (config.fencePadding) {
      parts.push("<mspace width=\"" + config.fencePadding + "em\" />");
    }
    if (node.close) {
      parts.push("<mo fence=\"true\" stretchy=\"true\" lspace=\"0em\" rspace=\"0em\">" + escapeText(node.close) + "</mo>");
    }
    return "<mrow>" + parts.join("") + "</mrow>";
  }

  function renderMatrix(node, config) {
    var rows = node.rows.map(function (row) {
      var cells = row.map(function (cell) {
        return "<mtd>" + renderNode(cell, config) + "</mtd>";
      }).join("");
      return "<mtr>" + cells + "</mtr>";
    }).join("");
    var table = "<mtable rowspacing=\"" + config.matrixRowGap + "em\" columnspacing=\"" + config.matrixColGap + "em\">" + rows + "</mtable>";
    if (!(node.open || node.close)) {
      return table;
    }
    var parts = [];
    if (node.open) {
      parts.push("<mo fence=\"true\" stretchy=\"true\" lspace=\"0em\" rspace=\"0em\">" + escapeText(node.open) + "</mo>");
    }
    if (config.fencePadding) {
      parts.push("<mspace width=\"" + config.fencePadding + "em\" />");
    }
    parts.push(table);
    if (config.fencePadding) {
      parts.push("<mspace width=\"" + config.fencePadding + "em\" />");
    }
    if (node.close) {
      parts.push("<mo fence=\"true\" stretchy=\"true\" lspace=\"0em\" rspace=\"0em\">" + escapeText(node.close) + "</mo>");
    }
    return "<mrow>" + parts.join("") + "</mrow>";
  }

  function renderMath(ast, config) {
    var content = renderNode(ast, config);
    var display = config.displayMode ? "block" : "inline";
    var attrs = "class=\"mathtype\" display=\"" + display + "\"" +
      " scriptminsize=\"" + config.scriptMinSize + "px\"" +
      " scriptsizemultiplier=\"" + config.scriptScale + "\"";
    return "<math xmlns=\"http://www.w3.org/1998/Math/MathML\" " + attrs + ">" + content + "</math>";
  }

  function renderNodeRaw(node, config) {
    if (node && node.type === "raw") {
      return node.text;
    }
    return renderNode(node, config);
  }

  var MathType = {
    defaults: DEFAULT_CONFIG,
    config: mergeConfig(DEFAULT_CONFIG, global.MathTypeConfig || {}),
    setConfig: function (cfg) {
      this.config = mergeConfig(DEFAULT_CONFIG, cfg || {});
      return this.config;
    },
    parse: function (input, cfg) {
      var config = mergeConfig(this.config, cfg || {});
      var parser = new Parser(input || "", config);
      return parser.parse();
    },
    toMathML: function (input, cfg) {
      var config = mergeConfig(this.config, cfg || {});
      var ast = this.parse(input, config);
      return renderMath(ast, config);
    },
    render: function (input, container, cfg) {
      if (!container) {
        return "";
      }
      var mathml = this.toMathML(input, cfg);
      container.innerHTML = mathml;
      return mathml;
    },
    renderAll: function (selector, cfg) {
      var config = mergeConfig(this.config, cfg || {});
      var targets = document.querySelectorAll(selector || "[data-math]");
      for (var i = 0; i < targets.length; i += 1) {
        var el = targets[i];
        var tex = el.getAttribute("data-math") || el.textContent || "";
        el.innerHTML = renderMath(this.parse(tex, config), config);
      }
    },
    renderNode: renderNodeRaw
  };

  global.MathType = MathType;
})(window);
