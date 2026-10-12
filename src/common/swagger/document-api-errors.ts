import { OpenAPIObject } from '@nestjs/swagger';

const ERROR_SCHEMA = {
  $ref: '#/components/schemas/ApiErrorResponseDto',
};

const ERROR_DESCRIPTIONS: Record<string, string> = {
  '400':
    'Solicitud inválida, validación fallida o parámetro con formato incorrecto.',
  '401': 'Falta el JWT o no es válido.',
  '403': 'El usuario autenticado no tiene permiso para esta operación.',
  '404': 'No se encontró el recurso solicitado.',
  '409': 'La operación entra en conflicto con el estado actual del recurso.',
  '500': 'Error interno inesperado al procesar la solicitud.',
};

export function documentApiErrors(document: OpenAPIObject): OpenAPIObject {
  for (const path of Object.values(document.paths)) {
    for (const operation of Object.values(path ?? {})) {
      if (
        !operation ||
        typeof operation !== 'object' ||
        !('responses' in operation)
      ) {
        continue;
      }

      const responses = operation.responses;
      responses['500'] ??= {
        description: ERROR_DESCRIPTIONS['500'],
      };

      for (const [statusCode, description] of Object.entries(
        ERROR_DESCRIPTIONS,
      )) {
        const response = responses[statusCode];
        if (!response || '$ref' in response) {
          continue;
        }

        response.description ||= description;
        response.content ??= {};
        response.content['application/json'] = {
          schema: ERROR_SCHEMA,
          example: errorExample(statusCode),
        };
      }
    }
  }

  return document;
}

function errorExample(statusCode: string) {
  const examples: Record<string, object> = {
    '400': {
      statusCode: 400,
      message: ['rating must not be greater than 5'],
      error: 'Bad Request',
    },
    '401': {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
    '403': {
      statusCode: 403,
      message: 'No tienes permiso para realizar esta operación.',
      error: 'Forbidden',
    },
    '404': {
      statusCode: 404,
      message: 'Recurso no encontrado.',
      error: 'Not Found',
    },
    '409': {
      statusCode: 409,
      message: 'La operación no es válida para el estado actual del recurso.',
      error: 'Conflict',
    },
    '500': {
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    },
  };

  return examples[statusCode];
}
