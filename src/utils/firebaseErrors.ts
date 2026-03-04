const FIREBASE_ERROR_MAP: Record<string, string> = {
	// Auth - credenciales
	'auth/invalid-credential': 'Correo o contraseña incorrectos.',
	'auth/wrong-password': 'Contraseña incorrecta.',
	'auth/user-not-found': 'No existe una cuenta con ese correo.',
	'auth/invalid-email': 'El correo electrónico no es válido.',
	'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
	'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',

	// Auth - sesión / acceso
	'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
	'auth/too-many-requests': 'Demasiados intentos. Intenta de nuevo más tarde.',
	'auth/requires-recent-login':
		'Debes volver a iniciar sesión para realizar esta acción.',
	'auth/unauthorized-continue-uri': 'La URL de redirección no está autorizada.',
	'auth/operation-not-allowed': 'Este método de autenticación no está habilitado.',

	// Auth - token / sesión
	'auth/id-token-expired': 'La sesión ha expirado. Inicia sesión de nuevo.',
	'auth/id-token-revoked': 'La sesión fue revocada. Inicia sesión de nuevo.',
	'auth/session-cookie-expired': 'La sesión ha expirado.',
	'auth/session-cookie-revoked': 'La sesión fue revocada.',
	'auth/invalid-id-token': 'Token de sesión inválido.',

	// Auth - proveedor / tenant
	'auth/tenant-id-mismatch': 'El tenant no coincide con el de la solicitud.',
	'auth/invalid-tenant-id': 'El ID de tenant no es válido.',
	'auth/missing-tenant-id': 'Falta el ID de tenant.',
	'auth/multi-factor-auth-required': 'Se requiere autenticación de dos factores.',

	// Firestore / Storage - permisos
	'permission-denied': 'No tienes permisos para realizar esta acción.',
	'unauthenticated': 'Debes iniciar sesión para continuar.',

	// Red / disponibilidad
	'unavailable': 'Servicio no disponible. Intenta de nuevo.',
	'deadline-exceeded': 'La solicitud tardó demasiado. Intenta de nuevo.',
	'resource-exhausted': 'Límite de solicitudes alcanzado. Intenta más tarde.',
	'cancelled': 'La operación fue cancelada.',

	// Datos
	'not-found': 'El recurso solicitado no existe.',
	'already-exists': 'El recurso ya existe.',
	'invalid-argument': 'Los datos enviados no son válidos.',
	'failed-precondition': 'La operación no se puede completar en el estado actual.',
};

export function getFirebaseErrorMessage(err: unknown, fallback: string): string {
	if (err && typeof err === 'object' && 'code' in err) {
		const code = (err as { code: string }).code;
		if (code in FIREBASE_ERROR_MAP) {
			return FIREBASE_ERROR_MAP[code];
		}
	}
	if (err instanceof Error) {
		return err.message;
	}
	return fallback;
}
