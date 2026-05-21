export const SUPER_ADMIN_BADGE = 'SUPER ADMIN';

export const SUPER_ADMIN_NAV = {
  dashboard: 'Dashboard',
  users: 'Usuarios',
  tickets: 'Tickets',
} as const;

export const STATS_LABELS = {
  title: 'Estadísticas',
  totalUsers: 'Total de usuarios registrados',
  paidUsers: 'Usuarios con plan activo de pago',
} as const;

export const USERS_LABELS = {
  title: 'Usuarios registrados',
  colEmail: 'Email',
  colPlan: 'Plan',
  colProfile: 'Perfil',
  colLinks: 'Links',
  colCreatedAt: 'Creación',
  colUpdatedAt: 'Modificación',
  viewProfile: 'Ver perfil',
  noUsername: '—',
  empty: 'No hay usuarios registrados.',
  loading: 'Cargando usuarios...',
  loadMore: 'Cargar más',
  exportEmails: 'Exportar correos',
  showing: (visible: number, total: number) => `Mostrando ${visible} de ${total}`,
} as const;

export const EMAIL_EXPORT_LABELS = {
  title: 'Exportar correos',
  copy: 'Copiar contactos',
  copied: '¡Copiado!',
  page: (current: number, total: number) => `Página ${current} de ${total}`,
  prev: 'Anterior',
  next: 'Siguiente',
  close: 'Cerrar',
  hint: 'Lista de correos separados por coma',
} as const;

export const TICKETS_LABELS = {
  title: 'Tickets de soporte',
  colUser: 'Usuario',
  colType: 'Tipo',
  colTitle: 'Título',
  colStatus: 'Estado',
  colDate: 'Fecha',
  filterAll: 'Todos los tipos',
  filterError: 'Error',
  filterSuggestion: 'Sugerencia',
  filterEmailPlaceholder: 'Buscar por email...',
  sortNewest: 'Más recientes',
  sortOldest: 'Más antiguos',
  empty: 'No hay tickets.',
  loading: 'Cargando tickets...',
} as const;

export const MODAL_LABELS = {
  close: 'Cerrar',
  loadingDetail: 'Cargando detalle...',
  reportedBy: 'Reportado por',
  createdAt: 'Creado',
  device: 'Dispositivo',
  screenshot: 'Ver captura',
  whatsapp: 'WhatsApp',
  changeStatus: 'Cambiar estado',
} as const;

export const FORBIDDEN_MESSAGE = 'No tienes acceso a esta sección.';
export const LOADING_TEXT = 'Cargando...';
