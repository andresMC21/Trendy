import { OpenAPIObject } from '@nestjs/swagger';
import { documentApiErrors } from './document-api-errors';

describe('documentApiErrors', () => {
  it('adds the shared error schema to documented errors and a 500 response to every operation', () => {
    const document: OpenAPIObject = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0' },
      paths: {
        '/resource': {
          get: {
            responses: {
              '400': { description: 'Invalid request' },
              '401': { description: 'Unauthorized' },
              '200': { description: 'Success' },
            },
          },
          delete: {
            responses: {
              '204': { description: 'Deleted' },
            },
          },
        },
      },
      components: {
        schemas: {
          ApiErrorResponseDto: { type: 'object' },
        },
      },
    };

    const result = documentApiErrors(document);
    const getResponses = result.paths['/resource']?.get?.responses;
    const deleteResponses = result.paths['/resource']?.delete?.responses;

    expect(getResponses?.['400']?.content?.['application/json']).toMatchObject({
      schema: { $ref: '#/components/schemas/ApiErrorResponseDto' },
      example: {
        statusCode: 400,
        message: ['rating must not be greater than 5'],
        error: 'Bad Request',
      },
    });
    expect(
      getResponses?.['401']?.content?.['application/json']?.schema,
    ).toEqual({
      $ref: '#/components/schemas/ApiErrorResponseDto',
    });
    expect(getResponses?.['500']?.description).toBe(
      'Error interno inesperado al procesar la solicitud.',
    );
    expect(
      deleteResponses?.['500']?.content?.['application/json']?.schema,
    ).toEqual({
      $ref: '#/components/schemas/ApiErrorResponseDto',
    });
    expect(
      deleteResponses?.['500']?.content?.['application/json']?.example,
    ).toEqual({
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
    expect(deleteResponses?.['204']?.content).toBeUndefined();
  });
});
