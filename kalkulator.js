// ===== Beallitasok =====
const YEARS = [
  "6. \u00e9vfolyam (\u00e9v v\u00e9ge)",
  "7. \u00e9vfolyam (\u00e9v v\u00e9ge)",
  "8. \u00e9vfolyam (f\u00e9l\u00e9v)"
];
const YEARS_SHORT = ["6. \u00e9v v\u00e9ge", "7. \u00e9v v\u00e9ge", "8. f\u00e9l\u00e9v"]; // telefonos nezethez

// substitutes: evenkent (6., 7., 8.) melyik targy valtja ki felmentes eseten, es milyen sullyal
const SUBJECTS = [
  { name: "Magyar nyelvtan", weight: 1 },
  { name: "Magyar irodalom", weight: 1 },
  { name: "T\u00f6rt\u00e9nelem",      weight: 1 },
  {
    name: "Idegen nyelv", weight: 1,
    substitutes: [
      { name: "Digit\u00e1lis kult\u00fara", weight: 1 },
      { name: "Digit\u00e1lis kult\u00fara", weight: 1 },
      { name: "Digit\u00e1lis kult\u00fara", weight: 1 }
    ]
  },
  {
    name: "Matematika", weight: 2,
    substitutes: [
      { name: "Term\u00e9szet\u00ADtudom\u00e1ny", weight: 1 },
      { name: "Fizika",           weight: 1 },   // 7. evtol matek felmentesnel fizika
      { name: "Fizika",           weight: 1 }
    ]
  }
];

const MIN_GRADE = 1;
const MAX_GRADE = 5;
const MAX_POINTS = 90; // a kiirt maximum mindig 90, felmentestol fuggetlenul

// ===== Tablazat felepitese =====
function buildTable() {
  const head = document.getElementById("table-head");
  const body = document.getElementById("table-body");

  let headHtml = "<tr><th>Tant\u00e1rgy</th>";
  YEARS.forEach(year => { headHtml += `<th>${year}</th>`; });
  headHtml += "</tr>";
  head.innerHTML = headHtml;

  let bodyHtml = "";
  SUBJECTS.forEach((subject, s) => {
    bodyHtml += `<tr><td>${subject.name}</td>`;

    YEARS.forEach((year, y) => {
      bodyHtml += `<td id="cell-${s}-${y}" data-year="${YEARS_SHORT[y]}">`;

      if (subject.substitutes) {
        // A cellaban mindig latszik, melyik targy jegyet kell beirni
        bodyHtml += `<span class="cell-subject" id="label-${s}-${y}">${subject.name}</span>`;
      }

      bodyHtml += `<input type="text" class="grade" data-s="${s}" data-y="${y}"
                     inputmode="numeric" maxlength="1" autocomplete="off" placeholder="1\u20135"
                     aria-label="${subject.name}, ${year}">`;

      if (subject.substitutes) {
        bodyHtml += `<br><label class="exempt">
                       <input type="checkbox" class="exempt-box" data-s="${s}" data-y="${y}">
                       Felmentett
                     </label>`;
      }
      bodyHtml += "</td>";
    });
    bodyHtml += "</tr>";
  });
  body.innerHTML = bodyHtml;

  // Jegy mezok: csak egy 1-5 kozotti szamjegy irhato be
  document.querySelectorAll(".grade").forEach(input => {
    input.addEventListener("input", () => {
      const allowed = input.value.replace(/[^1-5]/g, "");
      input.value = allowed.slice(-1);
      input.classList.remove("invalid");
    });
  });

  // Felmentett pipa: onnantol minden kesobbi evre is ervenyes
  document.querySelectorAll(".exempt-box").forEach(box => {
    box.addEventListener("change", () => {
      const s = Number(box.dataset.s);
      const y = Number(box.dataset.y);

      YEARS.forEach((year, other) => {
        // Bepipalas: ez es minden kesobbi ev felmentett
        // Kivetel: ez es minden korabbi ev ujra a rendes targy
        const affected = box.checked ? other >= y : other <= y;
        if (affected) setExempt(s, other, box.checked);
      });
    });
  });
}

// Egy cella atallitasa rendes / helyettesito targyra
function setExempt(s, y, exempt) {
  const box = document.querySelector(`.exempt-box[data-s="${s}"][data-y="${y}"]`);
  if (box.checked === exempt && box.dataset.applied === String(exempt)) return;

  box.checked = exempt;
  box.dataset.applied = String(exempt);

  const subject = SUBJECTS[s];
  const label = document.getElementById(`label-${s}-${y}`);
  label.textContent = exempt ? subject.substitutes[y].name : subject.name;

  document.getElementById(`cell-${s}-${y}`).classList.toggle("is-exempt", exempt);

  // Targyvaltaskor a regi jegy torlodik, hogy ujra kelljen irni a megfelelo targyet
  const grade = document.querySelector(`.grade[data-s="${s}"][data-y="${y}"]`);
  grade.value = "";
  grade.classList.remove("invalid");
}

// ===== Segedfuggvenyek =====
function isExempt(s, y) {
  const box = document.querySelector(`.exempt-box[data-s="${s}"][data-y="${y}"]`);
  return box ? box.checked : false;
}

function readGrade(input) {
  if (input.value.trim() === "") return NaN;
  return Number(input.value);
}

function isValidGrade(value) {
  return Number.isInteger(value) && value >= MIN_GRADE && value <= MAX_GRADE;
}

// ===== Szamolas =====
function calculate(event) {
  event.preventDefault();

  const errorBox = document.getElementById("error");
  const resultBox = document.getElementById("result");

  let total = 0;
  const yearTotals = YEARS.map(() => 0);
  const substitutionsUsed = [];
  let hasError = false;

  document.querySelectorAll(".grade").forEach(input => {
    input.classList.remove("invalid");

    const s = Number(input.dataset.s);
    const y = Number(input.dataset.y);
    const grade = readGrade(input);

    if (!isValidGrade(grade)) {
      input.classList.add("invalid");
      hasError = true;
      return;
    }

    const subject = SUBJECTS[s];
    let weight = subject.weight;

    if (isExempt(s, y)) {
      const sub = subject.substitutes[y];
      weight = sub.weight;
      substitutionsUsed.push(`${YEARS[y]}: ${subject.name} helyett ${sub.name}`);
    }

    const points = grade * weight;
    total += points;
    yearTotals[y] += points;
  });

  if (hasError) {
    errorBox.textContent = `Minden mez\u0151be ${MIN_GRADE} \u00e9s ${MAX_GRADE} k\u00f6z\u00f6tti jegyet kell \u00edrni. A hi\u00e1nyz\u00f3 mez\u0151ket pirossal jel\u00f6lt\u00fck.`;
    errorBox.hidden = false;
    resultBox.hidden = true;
    return;
  }
  errorBox.hidden = true;

  const percent = Math.min(100, (total / MAX_POINTS) * 100);

  let html = "<h2>El\u00e9rt pontsz\u00e1m</h2>";
  html += `<div class="score"><span class="points">${total}</span><span class="max">/ ${MAX_POINTS} pont</span></div>`;
  html += `<div class="bar"><div></div></div>`;
  html += `<div class="years">`;
  YEARS.forEach((year, y) => {
    html += `<div><span>${year}</span><strong>${yearTotals[y]} pont</strong></div>`;
  });
  html += "</div>";

  if (substitutionsUsed.length > 0) {
    html += `<div class="subs"><strong>Felment\u00e9s miatt besz\u00e1m\u00edtott t\u00e1rgyak:</strong><ul>`;
    substitutionsUsed.forEach(line => { html += `<li>${line}</li>`; });
    html += "</ul></div>";
  }

  resultBox.innerHTML = html;
  resultBox.hidden = false;

  // Sav animalasa es gorgetes az eredmenyhez
  requestAnimationFrame(() => {
    resultBox.querySelector(".bar div").style.width = `${percent}%`;
  });
  resultBox.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ===== Torles =====
function resetForm() {
  buildTable();
  document.getElementById("error").hidden = true;
  document.getElementById("result").hidden = true;
}

// ===== Inditas =====
buildTable();
document.getElementById("calc-form").addEventListener("submit", calculate);
document.getElementById("reset-btn").addEventListener("click", resetForm);
