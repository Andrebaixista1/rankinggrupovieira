// Bases de consulta do Nova Europa 5. Maciça/Entrantes/RVX são bases SQL próprias
// (sem quota = ilimitadas); Quali IN100 vem da API Qualibanking (com quota).
export const EUROPA5_BASES = [
  { key: 'macica', nome: 'Maciça', desc: 'consultas ilimitadas', ilimitado: true },
  { key: 'entrantes', nome: 'Entrantes', desc: 'leads em entrada', ilimitado: true },
  { key: 'rvx', nome: 'RVX', desc: 'contratos e saldos', ilimitado: true },
  { key: 'in100', nome: 'Quali IN100', desc: 'benefícios INSS', ilimitado: false },
]

function toNum(value) {
  const n = Number(String(value ?? '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

// Recebe o array bruto do /webhook/api/saldo e devolve um resumo seguro (sem dados
// sensíveis): capacidade por base + volume agregado de consultas processadas.
export function aggregateSaldo(rawArray) {
  const arr = Array.isArray(rawArray) ? rawArray : []
  let totalUsados = 0
  let totalCapacidade = 0
  const in100 = { total: 0, usados: 0 }

  arr.forEach((r) => {
    const total = toNum(r.Total ?? r.total)
    const usados = toNum(r.Usados ?? r.usados)
    totalUsados += usados
    totalCapacidade += total
    const ident = `${r.tabela || ''} ${r.Banco || ''}`.toLowerCase()
    if (ident.includes('quali') || ident.includes('in100')) {
      in100.total += total
      in100.usados += usados
    }
  })

  const bases = EUROPA5_BASES.map((b) => {
    if (b.key === 'in100') {
      const capacidade = in100.total || 200000
      return { ...b, capacidade, usados: in100.usados, disponivel: capacidade - in100.usados }
    }
    return { ...b, capacidade: null, usados: null, disponivel: null }
  })

  return {
    bases,
    volume: {
      consultas_realizadas: totalUsados,
      capacidade_total: totalCapacidade,
    },
  }
}
