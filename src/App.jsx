import { useEffect, useState } from 'react'
import './App.css'

const rankings = [
  {
    id: 'vendedores',
    kicker: 'Vendas',
    title: 'Ranking TOP 10 Vendedores',
    subtitle: 'Hoje',
    description: 'Resultado do dia atual.',
    limit: 10,
    rows: [
      { name: 'Camila Prado', meta: 'SP - Zona Sul', value: 128450, badge: 'Melhor resultado do dia' },
      { name: 'Lucas Ferreira', meta: 'RJ - Centro', value: 121300 },
      { name: 'Bianca Torres', meta: 'MG - BH', value: 118980 },
      { name: 'Rafael Lima', meta: 'PR - Curitiba', value: 115240 },
      { name: 'Juliana Reis', meta: 'BA - Salvador', value: 109870 },
      { name: 'Andre Gomes', meta: 'CE - Fortaleza', value: 104560 },
      { name: 'Paula Nunes', meta: 'SC - Joinville', value: 98730 },
      { name: 'Diego Rocha', meta: 'RS - Porto Alegre', value: 93210 },
      { name: 'Nina Carvalho', meta: 'GO - Goiania', value: 89640 },
      { name: 'Bruno Martins', meta: 'PE - Recife', value: 87120 },
    ],
  },
  {
    id: 'supervisores',
    kicker: 'Operacao',
    title: 'Ranking TOP 5 Supervisores',
    subtitle: 'Hoje',
    description: 'Resultado do dia atual.',
    limit: 5,
    rows: [
      { name: 'Carla Dantas', meta: 'Equipe Norte', value: 540000, badge: 'Melhor consistencia' },
      { name: 'Marcos Farias', meta: 'Equipe Sudeste', value: 515000 },
      { name: 'Helena Castro', meta: 'Equipe Sul', value: 498000 },
      { name: 'Jonas Ribeiro', meta: 'Equipe Centro-Oeste', value: 472000 },
      { name: 'Priscila Leal', meta: 'Equipe Nordeste', value: 455000 },
    ],
  },
  {
    id: 'gerentes',
    kicker: 'Gestao',
    title: 'Ranking Gerentes',
    subtitle: 'Hoje',
    description: 'Resultado do dia atual.',
    limit: 5,
    rows: [
      { name: 'Eduardo Araujo', meta: 'Regional SP', value: 1420000, badge: 'Crescimento forte' },
      { name: 'Fernanda Melo', meta: 'Regional RJ', value: 1280000 },
      { name: 'Ricardo Brandao', meta: 'Regional Sul', value: 1120000 },
      { name: 'Sonia Barbosa', meta: 'Regional NE', value: 1050000 },
      { name: 'Thiago Alves', meta: 'Regional CO', value: 980000 },
    ],
  },
]

function App() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [cycleKey, setCycleKey] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % rankings.length)
      setCycleKey((prev) => prev + 1)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const current = rankings[activeIndex]
  const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })

  return (
    <div className="app">
      <main className="board">
        <section key={current.id} className="rank-card">
          <div className="rank-head">
            <div>
              <p className="eyebrow">{current.kicker}</p>
              <h1>{current.title}</h1>
            </div>
            <div className="rank-status">
              <img className="brand-logo" src="/logo-vieira.webp" alt="VieiraCred" />
            </div>
          </div>

          <div className={`rank-grid${current.id === 'vendedores' ? ' vendors-grid' : ''}`}>
            {current.rows.map((row, index) => {
              const next = current.rows[index + 1]
              const trendValue = next ? ((row.value - next.value) / next.value) * 100 : null
              const trendText =
                trendValue === null
                  ? null
                  : `${trendValue >= 0 ? '+' : ''}${Math.round(trendValue)}%`
              const trendClass = trendValue !== null && trendValue < 0 ? 'down' : 'up'
              const isPodium = index < 3
              const isLeader = index === 0
              return (
                <article
                  key={`${current.id}-${row.name}`}
                  className={`rank-row${isPodium ? ' podium' : ''}${isLeader ? ' leader' : ''}`}
                  style={{ '--delay': `${index * 80}ms` }}
                >
                  <div className="rank-pos">{String(index + 1).padStart(2, '0')}</div>
                  <div className="rank-main">
                    <div className="rank-name">{row.name}</div>
                    <div className="rank-meta">{row.meta}</div>
                  </div>
                  <div className="rank-metrics">
                    <div className="rank-value">{currencyFormatter.format(row.value)}</div>
                    {trendText ? (
                      <div className={`rank-trend ${trendClass}`}>{trendText}</div>
                    ) : null}
                  </div>
                  {row.badge ? <div className="rank-badge">{row.badge}</div> : null}
                </article>
              )
            })}
          </div>

          <div className="rank-footer">
            <div className="progress">
              <div key={cycleKey} className="progress-bar" />
            </div>
            <p className="footnote">
              Dados ficticios para teste. Integre com sua API Node quando estiver pronto.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
