/**
 * Utilidades para filtrar entrada de texto en inputs
 */

export interface NumberFilterOptions {
  allowDecimals?: boolean;
  maxDecimals?: number;
  allowNegative?: boolean;
}

export interface InputFilterOptions extends NumberFilterOptions {
  type: 'letters' | 'numbers' | 'alphanumeric' | 'custom';
  customPattern?: RegExp;
}

/**
 * Filtra la entrada de texto según el tipo especificado
 * @param value - Valor actual del input
 * @param options - Opciones de filtrado
 * @returns Valor filtrado
 */
export function filterInput(value: string, options: InputFilterOptions): string {
  switch (options.type) {
    case 'letters':
      return filterLetters(value);
    case 'numbers':
      return filterNumbers(value, options);
    case 'alphanumeric':
      return filterAlphanumeric(value);
    case 'custom':
      return options.customPattern ? filterCustom(value, options.customPattern) : value;
    default:
      return value;
  }
}

/**
 * Filtra solo letras (incluyendo espacios y caracteres especiales comunes)
 */
export function filterLetters(value: string): string {
  // Permite letras, espacios, guiones, apóstrofes y caracteres acentuados
  return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-']/g, '');
}

/**
 * Filtra solo números con opciones para decimales
 */
export function filterNumbers(value: string, options: NumberFilterOptions = {}): string {
  const { allowDecimals = true, maxDecimals = 2, allowNegative = false } = options;

  // Primero filtrar caracteres permitidos
  let filtered = value.replace(/[^0-9.,\-]/g, '');

  // Manejar negativos
  if (!allowNegative) {
    filtered = filtered.replace(/-/g, '');
  } else {
    // Solo permitir un guión al inicio
    filtered = filtered.replace(/(?!^)-/g, '');
  }

  // Manejar decimales
  if (allowDecimals) {
    // Reemplazar comas por puntos para consistencia
    filtered = filtered.replace(/,/g, '.');

    // Solo permitir un punto decimal
    const parts = filtered.split('.');
    if (parts.length > 2) {
      filtered = parts[0] + '.' + parts.slice(1).join('');
    }

    // Limitar decimales si se especifica
    if (parts.length === 2 && parts[1].length > maxDecimals) {
      filtered = parts[0] + '.' + parts[1].substring(0, maxDecimals);
    }
  } else {
    // No permitir decimales
    filtered = filtered.replace(/[.,]/g, '');
  }

  return filtered;
}

/**
 * Filtra caracteres alfanuméricos (letras y números)
 */
export function filterAlphanumeric(value: string): string {
  return value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '');
}

/**
 * Filtra usando un patrón regex personalizado
 */
export function filterCustom(value: string, pattern: RegExp): string {
  const matches = value.match(pattern);
  return matches ? matches.join('') : '';
}

/**
 * Hook personalizado para usar con inputs React
 * @param options - Opciones de filtrado
 * @returns Función para manejar onChange
 */
export function useInputFilter(options: InputFilterOptions) {
  return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const filteredValue = filterInput(e.target.value, options);
    if (filteredValue !== e.target.value) {
      e.target.value = filteredValue;
    }
    return filteredValue;
  };
}

/**
 * Función para validar si un valor cumple con las reglas de filtrado
 */
export function validateInput(value: string, options: InputFilterOptions): boolean {
  const filtered = filterInput(value, options);
  return filtered === value;
}

/**
 * Funciones de filtrado específicas para casos comunes
 */
export const InputFilters = {
  // Solo letras
  lettersOnly: (value: string) => filterLetters(value),

  // Solo números enteros
  integersOnly: (value: string) => filterNumbers(value, { allowDecimals: false }),

  // Números con decimales (máximo configurable, por defecto 2)
  currency: (value: string, options?: { maxDecimals?: number }) => filterNumbers(value, {
    allowDecimals: true,
    maxDecimals: options?.maxDecimals ?? 2
  }),

  // Números con decimales (máximo 3, para porcentajes)
  percentage: (value: string) => filterNumbers(value, { allowDecimals: true, maxDecimals: 3 }),

  // Solo números positivos
  positiveNumbers: (value: string) => filterNumbers(value, { allowDecimals: true, allowNegative: false }),

  // Código alfanumérico (para códigos de producto, etc.)
  alphanumericCode: (value: string) => filterAlphanumeric(value),

  // Nombre (letras con espacios y caracteres especiales)
  name: (value: string) => filterLetters(value),

  // Teléfono (solo números, guiones y paréntesis)
  phone: (value: string) => value.replace(/[^0-9\-\(\)\+\s]/g, ''),

  // Email básico (letras, números, @, ., -, _)
  email: (value: string) => value.replace(/[^a-zA-Z0-9@.\-_]/g, ''),
} as const;