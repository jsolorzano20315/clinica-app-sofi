export const formatearTelefono = (telefono: string): string => {
  return telefono.replace(/\D/g, '')
}

export const telefonoValido = (telefono: string): boolean => {
  const limpio = formatearTelefono(telefono)

  return limpio.length >= 8
}