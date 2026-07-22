import { useId, useState } from "react";
import "./styles.css";

export interface PontoBarChart {
  rotulo: string;
  valor: number;
}

interface BarChartProps {
  titulo: string;
  subtitulo?: string;
  dados: PontoBarChart[];
  formatarValor?: (valor: number) => string;
}

const LARGURA = 800;
const ALTURA = 300;
const MARGEM = { topo: 32, direita: 8, baixo: 28, esquerda: 56 };

function arredondarParaCima(valor: number): number {
  if (valor <= 0) return 1;

  const magnitude = 10 ** Math.floor(Math.log10(valor));
  const normalizado = valor / magnitude;

  let alvo = 10;
  if (normalizado <= 1) alvo = 1;
  else if (normalizado <= 2) alvo = 2;
  else if (normalizado <= 5) alvo = 5;

  return alvo * magnitude;
}

function formatarPadrao(valor: number): string {
  return valor.toLocaleString("pt-BR");
}

export function BarChart({ titulo, subtitulo, dados, formatarValor = formatarPadrao }: BarChartProps) {
  const idBase = useId();
  const [indiceAtivo, setIndiceAtivo] = useState<number | null>(null);
  const [mostrarTabela, setMostrarTabela] = useState(false);

  const larguraPlot = LARGURA - MARGEM.esquerda - MARGEM.direita;
  const alturaPlot = ALTURA - MARGEM.topo - MARGEM.baixo;

  const valorMaximoBruto = Math.max(...dados.map((d) => d.valor), 0);
  const valorMaximoEixo = arredondarParaCima(valorMaximoBruto || 1);
  const indiceMaximo = dados.reduce(
    (melhor, atual, i) => (atual.valor > dados[melhor].valor ? i : melhor),
    0
  );
  const temDados = dados.length > 0 && valorMaximoBruto > 0;

  const larguraBanda = dados.length > 0 ? larguraPlot / dados.length : larguraPlot;
  const larguraBarra = Math.min(24, larguraBanda * 0.6);

  const LIMITE_ROTULOS_X = 10;
  const passoRotulo = Math.max(1, Math.ceil(dados.length / LIMITE_ROTULOS_X));

  function y(valor: number) {
    return MARGEM.topo + alturaPlot - (valor / valorMaximoEixo) * alturaPlot;
  }

  function caminhoBarra(x: number, valorBarra: number): string {
    const raio = 4;
    const topo = y(valorBarra);
    const base = MARGEM.topo + alturaPlot;
    const alturaBarra = base - topo;

    if (alturaBarra <= 0) return "";

    if (alturaBarra < raio) {
      return `M ${x},${base} L ${x},${topo} L ${x + larguraBarra},${topo} L ${x + larguraBarra},${base} Z`;
    }

    return `
      M ${x},${base}
      L ${x},${topo + raio}
      Q ${x},${topo} ${x + raio},${topo}
      L ${x + larguraBarra - raio},${topo}
      Q ${x + larguraBarra},${topo} ${x + larguraBarra},${topo + raio}
      L ${x + larguraBarra},${base}
      Z
    `;
  }

  const ticksEixoY = [0, valorMaximoEixo / 2, valorMaximoEixo];

  return (
    <div className="bar-chart-card">
      <div className="bar-chart-cabecalho">
        <div>
          <h3>{titulo}</h3>
          {subtitulo && <p>{subtitulo}</p>}
        </div>
        <button
          type="button"
          className="bar-chart-toggle-tabela"
          onClick={() => setMostrarTabela((atual) => !atual)}
        >
          {mostrarTabela ? "Ver gráfico" : "Ver como tabela"}
        </button>
      </div>

      {mostrarTabela ? (
        <table className="bar-chart-tabela">
          <thead>
            <tr>
              <th>Período</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((ponto) => (
              <tr key={ponto.rotulo}>
                <td>{ponto.rotulo}</td>
                <td>{formatarValor(ponto.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : !temDados ? (
        <p className="bar-chart-vazio">Sem dados neste período.</p>
      ) : (
        <div className="bar-chart-svg-wrapper">
          <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="bar-chart-svg" role="img" aria-label={titulo}>
            {ticksEixoY.map((tick) => (
              <g key={tick}>
                <line
                  x1={MARGEM.esquerda}
                  x2={LARGURA - MARGEM.direita}
                  y1={y(tick)}
                  y2={y(tick)}
                  className="bar-chart-grid"
                />
                <text x={MARGEM.esquerda - 8} y={y(tick)} className="bar-chart-eixo-y" textAnchor="end" dy="0.32em">
                  {formatarValor(Math.round(tick))}
                </text>
              </g>
            ))}

            {dados.map((ponto, indice) => {
              const xBanda = MARGEM.esquerda + indice * larguraBanda;
              const xBarra = xBanda + (larguraBanda - larguraBarra) / 2;
              const ativo = indiceAtivo === indice;

              return (
                <g key={`${idBase}-${ponto.rotulo}`}>
                  <rect
                    x={xBanda}
                    y={MARGEM.topo}
                    width={larguraBanda}
                    height={alturaPlot}
                    fill="transparent"
                    tabIndex={0}
                    role="button"
                    aria-label={`${ponto.rotulo}: ${formatarValor(ponto.valor)}`}
                    onMouseEnter={() => setIndiceAtivo(indice)}
                    onMouseLeave={() => setIndiceAtivo(null)}
                    onFocus={() => setIndiceAtivo(indice)}
                    onBlur={() => setIndiceAtivo(null)}
                    className="bar-chart-hit"
                  />
                  <path
                    d={caminhoBarra(xBarra, ponto.valor)}
                    className={ativo ? "bar-chart-barra ativo" : "bar-chart-barra"}
                    pointerEvents="none"
                  />
                  {indice === indiceMaximo && (
                    <text
                      x={xBarra + larguraBarra / 2}
                      y={y(ponto.valor) - 8}
                      textAnchor="middle"
                      className="bar-chart-rotulo-valor"
                    >
                      {formatarValor(ponto.valor)}
                    </text>
                  )}
                  {(indice % passoRotulo === 0 || indice === dados.length - 1) && (
                    <text
                      x={xBanda + larguraBanda / 2}
                      y={ALTURA - MARGEM.baixo + 18}
                      textAnchor="middle"
                      className="bar-chart-eixo-x"
                    >
                      {ponto.rotulo}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {indiceAtivo !== null && (
            <div
              className="bar-chart-tooltip"
              style={{
                left: `${((MARGEM.esquerda + indiceAtivo * larguraBanda + larguraBanda / 2) / LARGURA) * 100}%`,
                top: `${(y(dados[indiceAtivo].valor) / ALTURA) * 100}%`,
              }}
            >
              <strong>{formatarValor(dados[indiceAtivo].valor)}</strong>
              <span>{dados[indiceAtivo].rotulo}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
