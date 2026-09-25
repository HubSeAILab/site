import fs from "node:fs";

const [publicationFile, mainFile] = process.argv.slice(2);

if (!publicationFile || !mainFile) {
  console.error(
    "Uso: node scripts/process-publication.mjs <publicacao> <arquivo-principal>"
  );
  process.exit(1);
}

const allowedFields = new Set([
  "image",
  "description",
  "title",
  "start_date",
  "end_date"
]);

const publicationFields = [
  "image",
  "description",
  "title",
  "start_date",
  "end_date"
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function parseDate(value) {
  const match = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(value);

  if (!match) {
    throw new Error(
      `A data "${value}" deve estar no formato YYYY/MM/DD.`
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`A data "${value}" não é válida.`);
  }

  return { year, month, day };
}

function formatDate(year, month, day) {
  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0")
  ].join("/");
}

function addMonths(value, months) {
  const { year, month, day } = parseDate(value);
  const targetMonthIndex = month - 1 + months;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const targetMonth = (targetMonthIndex % 12) + 1;
  const lastDayOfTargetMonth = new Date(
    Date.UTC(targetYear, targetMonth, 0)
  ).getUTCDate();
  const targetDay = Math.min(day, lastDayOfTargetMonth);

  return formatDate(targetYear, targetMonth, targetDay);
}

function isSamePublication(left, right) {
  return publicationFields.every(
    (field) => left[field] === right[field]
  );
}

const publication = readJson(publicationFile);

if (
  !publication ||
  Array.isArray(publication) ||
  typeof publication !== "object"
) {
  throw new Error("A publicação precisa ser um objeto JSON.");
}

for (const key of Object.keys(publication)) {
  if (!allowedFields.has(key)) {
    throw new Error(
      `O campo "${key}" não é permitido na publicação.`
    );
  }
}

for (const field of ["image", "description", "title", "start_date"]) {
  if (
    typeof publication[field] !== "string" ||
    publication[field].trim() === ""
  ) {
    throw new Error(`O campo "${field}" é obrigatório.`);
  }
}

const expectedEndDate = addMonths(publication.start_date, 6);

if ("end_date" in publication) {
  if (publication.end_date !== expectedEndDate) {
    throw new Error(
      `O campo "end_date" já existe, mas o valor esperado é "${expectedEndDate}".`
    );
  }
} else {
  // Este é o único campo adicionado pela Action.
  publication.end_date = expectedEndDate;
}

writeJson(publicationFile, publication);

const main = fs.existsSync(mainFile)
  ? readJson(mainFile)
  : { projetos: [] };

if (
  !main ||
  Array.isArray(main) ||
  typeof main !== "object" ||
  !Array.isArray(main.projetos)
) {
  throw new Error(
    `O arquivo principal precisa ter o formato { "projetos": [] }.`
  );
}

const existingIndex = main.projetos.findIndex(
  (item) =>
    item &&
    item.image === publication.image &&
    item.title === publication.title &&
    item.start_date === publication.start_date
);

if (existingIndex === -1) {
  main.projetos.push(publication);
  writeJson(mainFile, main);

  console.log(
    `Publicação adicionada ao arquivo principal: ${publication.title}`
  );
} else if (!isSamePublication(main.projetos[existingIndex], publication)) {
  throw new Error(
    "Já existe uma publicação com a mesma imagem, título e start_date, mas com dados diferentes."
  );
} else {
  console.log(
    `Publicação já existe no arquivo principal: ${publication.title}`
  );
}
