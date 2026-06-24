export const DIRECT_PRIMARY_API_URL = 'https://app.apivieiracred.com.br/webhook/ranking'
export const PRIMARY_API_URL = import.meta.env.PROD ? '/api/ranking' : DIRECT_PRIMARY_API_URL
export const WORLD_CUP_GAMES_API_URL = '/api/worldcup-games'
export const ROTATION_INTERVAL = 30000
export const WORLD_CUP_GAMES_POLL_INTERVAL = 30000
export const WORLD_CUP_API_RETRY_COUNT = 2
export const WORLD_CUP_API_RETRY_DELAY_MS = 900
export const GOAL_MODAL_DURATION = 7000
export const SPOTLIGHT_DURATION = 5000

export const GOAL_FIREWORK_PARTICLES = Array.from({ length: 18 }, (_, index) => ({
  id: `goal-spark-${index}`,
  angle: index * 20,
  distance: 104 + ((index % 4) * 26),
}))

export const PORTABILIDADE_PRODUCTS = ['PORTABILIDADE']
export const NOVO_PRODUCTS = ['NOVO']
export const CLT_PRODUCTS = ['CLT']

export const SPOTLIGHT_LABELS = {
  vendedores: 'Vendedores',
  portabilidade: 'Portabilidade',
  novo: 'Novo',
  clt: 'CLT',
}

export const IMAGE_FIELD_CANDIDATES = [
  'imagem_perfil_url',
  'imagem_perfil',
  'imagemPerfil',
  'imagem',
  'foto',
  'avatar',
  'profile_image',
]
