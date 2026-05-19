import { DeviceType, TicketStatus, TicketType } from '@/dtos/user.dto';

// ---------------------------------------------------------------------------
// Wizard step labels
// ---------------------------------------------------------------------------

export const SUPPORT_STEPS = {
  SELECT_TYPE: 'select_type',
  FILL_FORM: 'fill_form',
  SUCCESS: 'success',
} as const;

export type SupportStep = (typeof SUPPORT_STEPS)[keyof typeof SUPPORT_STEPS];

// ---------------------------------------------------------------------------
// Ticket type labels and descriptions
// ---------------------------------------------------------------------------

export const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  error: 'Reportar un error',
  suggestion: 'Enviar una sugerencia',
};

export const TICKET_TYPE_DESCRIPTIONS: Record<TicketType, string> = {
  error: '¿Algo no funciona bien? Cuéntanos qué pasó para ayudarte a solucionarlo.',
  suggestion: '¿Tienes una idea para mejorar la plataforma? ¡Nos encantaría escucharte!',
};

export const TICKET_TYPE_ICONS: Record<TicketType, string> = {
  error: '🐛',
  suggestion: '💡',
};

// ---------------------------------------------------------------------------
// Ticket status labels and colors
// ---------------------------------------------------------------------------

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Abierto',
  closed: 'Cerrado',
  solved: 'Resuelto',
  cancelled: 'Cancelado',
};

export const TICKET_STATUS_COLORS: Record<TicketStatus, string> = {
  open: 'bg-blue-100 text-blue-800',
  closed: 'bg-muted text-muted-foreground',
  solved: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

// ---------------------------------------------------------------------------
// Device type options (for error reports)
// ---------------------------------------------------------------------------

export interface DeviceOption {
  value: DeviceType;
  label: string;
}

export const DEVICE_TYPE_OPTIONS: DeviceOption[] = [
  { value: 'ios', label: 'Teléfono iPhone (iOS)' },
  { value: 'android', label: 'Teléfono Android' },
  { value: 'windows', label: 'Computadora Windows' },
  { value: 'mac', label: 'MacBook / Mac' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'other', label: 'Otro (especificar)' },
];

// ---------------------------------------------------------------------------
// Form field labels and help text
// ---------------------------------------------------------------------------

export const FORM_LABELS = {
  title: 'Título',
  titlePlaceholder: 'Describe brevemente el problema',
  titleHelp: 'Un título claro nos ayuda a entender y priorizar tu reporte.',

  description: 'Descripción',
  descriptionPlaceholderError: '¿Qué estabas haciendo cuando ocurrió el error? ¿Qué viste?',
  descriptionPlaceholderSuggestion: '¿Qué mejora propones? ¿Cómo imaginas que funcionaría?',
  descriptionHelp: 'Cuantos más detalles compartas, más rápido podemos ayudarte.',

  deviceType: 'Dispositivo que usabas',
  deviceTypeHelp: 'Selecciona el dispositivo desde el que ocurrió el error.',
  deviceOther: 'Especifica el dispositivo',
  deviceOtherPlaceholder: 'Ej. Smart TV, Chromebook, etc.',

  screenshot: 'Adjuntar captura de pantalla (opcional)',
  screenshotHelp: 'Una imagen del problema nos ayuda a entenderlo más rápido.',

  whatsappPhone: 'Número de WhatsApp para contacto (opcional)',
  whatsappPhonePlaceholder: '+58 412 000 0000',
  whatsappPhoneHelp: 'Solo te contactaremos si necesitamos más información.',
} as const;

// ---------------------------------------------------------------------------
// Button and action labels
// ---------------------------------------------------------------------------

export const ACTION_LABELS = {
  createNewTicket: 'Nuevo ticket',
  sendReport: 'Enviar reporte',
  sendSuggestion: 'Enviar sugerencia',
  back: 'Volver',
  viewDetail: 'Ver detalle',
  addComment: 'Agregar comentario',
  sendComment: 'Enviar',
  close: 'Cerrar',
  changeStatus: 'Cambiar estado',
} as const;

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export const MESSAGES = {
  successTitle: '¡Ticket enviado!',
  successDescriptionError: 'Recibimos tu reporte de error. Lo revisaremos a la brevedad.',
  successDescriptionSuggestion: '¡Gracias por tu sugerencia! La tendremos en cuenta.',

  emptyTickets: 'No tienes tickets activos.',
  emptyTicketsHint: 'Usa el botón de arriba para reportar un error o enviar una sugerencia.',

  openTicketLimit: (type: TicketType) =>
    type === 'error'
      ? 'Ya tienes un reporte de error abierto. Ciérralo antes de abrir uno nuevo.'
      : 'Ya tienes una sugerencia abierta. Ciérrala antes de enviar una nueva.',

  commentsDisabled: 'Los comentarios están desactivados. Solo puedes comentar en tickets abiertos.',

  commentPlaceholder: 'Escribe tu comentario aquí...',

  loading: 'Cargando...',
  sending: 'Enviando...',
} as const;

// ---------------------------------------------------------------------------
// Section heading
// ---------------------------------------------------------------------------

export const SECTION_TITLE = 'Soporte y sugerencias';
export const SECTION_DESCRIPTION =
  'Reporta errores o comparte ideas para mejorar la plataforma.';
