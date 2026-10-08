import * as XLSX from "xlsx";

type FormatoMatriz = "csv" | "xls" | "pdf";

export function validarFormatoMatriz(valor: unknown): FormatoMatriz {
  if (valor === "csv" || valor === "xls" || valor === "pdf") return valor;
  throw new Error("Formato inválido. Use CSV, XLS ou PDF.");
}

export function gerarArquivoMatriz(matriz: Record<string, unknown>, formato: FormatoMatriz): Promise<Buffer> | Buffer {
  if (formato === "pdf") return gerarPdf(matriz);

  const planilha = XLSX.utils.json_to_sheet([{ schema: "sysbelt-matriz-planejamento", versao: 1, matriz: JSON.stringify(matriz) }]);
  if (formato === "csv") return Buffer.from(XLSX.utils.sheet_to_csv(planilha), "utf8");
  const livro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(livro, planilha, "Matriz");
  return XLSX.write(livro, { type: "buffer", bookType: "xls" });
}

export function lerArquivoMatriz(buffer: Buffer) {
  const livro = XLSX.read(buffer, { type: "buffer" });
  const primeiraAba = livro.Sheets[livro.SheetNames[0]];
  const linhas = XLSX.utils.sheet_to_json<{ schema?: string; versao?: number; matriz?: string }>(primeiraAba, { defval: "" });
  const linha = linhas[0];
  if (!linha?.matriz) throw new Error("O arquivo não contém uma matriz de planejamentos válida.");
  return {
    schema: linha.schema || "sysbelt-matriz-planejamento",
    versao: Number(linha.versao) || 1,
    matriz: JSON.parse(linha.matriz),
  };
}

function gerarPdf(arquivo: Record<string, any>): Buffer {
  const linhas = [arquivo.matriz?.nome ?? "Matriz de planejamentos", `Exportado em ${new Date().toLocaleString("pt-BR")}`];
  for (const curriculo of arquivo.matriz?.curriculos ?? []) {
    linhas.push("", curriculo.nome, `${curriculo.modalidadeNome ?? "Sem modalidade"} | ${curriculo.publico ?? ""}`);
    for (const modulo of curriculo.modulos ?? []) {
      linhas.push(`Modulo: ${modulo.nome}`);
      for (const aula of modulo.aulas ?? []) linhas.push(`- ${aula.titulo}${aula.duracaoMinutos ? ` (${aula.duracaoMinutos} min)` : ""}`);
    }
  }

  const texto = linhas.slice(0, 55).map((linha, indice) => `BT /F1 ${indice === 0 ? 18 : 10} Tf 42 ${800 - indice * 14} Td (${escaparPdf(linha)}) Tj ET`).join("\n");
  const objetos = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(texto)} >>\nstream\n${texto}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objetos.forEach((objeto, indice) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${indice + 1} 0 obj\n${objeto}\nendobj\n`; });
  const inicioXref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`;
  return Buffer.from(pdf, "binary");
}

function escaparPdf(valor: unknown) {
  return String(valor).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\\()]/g, "\\$&");
}
