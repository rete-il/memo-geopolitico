// Shared by the public pages, local settings and publication validation.
export const identityDefinitions = [
  { key: 'responsible', label: 'Responsable del sitio', description: 'Nombre completo o razón social de quien está a cargo del sitio.' },
  { key: 'country', label: 'País', description: 'País en el que está establecido el responsable del sitio.' },
  { key: 'address', label: 'Domicilio de contacto', description: 'Dirección destinada a recibir comunicaciones relacionadas con el sitio.' },
  { key: 'hostingProvider', label: 'Alojamiento web', description: 'Servicio que almacena los archivos del sitio y los entrega al navegador cuando se visita una página.' },
  { key: 'mailProvider', label: 'Servicio de correo', description: 'Proveedor que gestiona los buzones y el envío y la recepción de los mensajes de correo.' },
  { key: 'retention', label: 'Conservación de datos', description: 'Plazos y criterios para guardar y eliminar los mensajes, las direcciones de correo y los registros técnicos. Pueden variar según el tipo de dato y el servicio.' },
];
