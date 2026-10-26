const fs = require('fs');
const path = require('path');

describe('Docs & Contract — Archive single-item aligned', () => {
  test('OpenAPI fragment and Swagger docs include the single-item path', () => {
    const implRoot = path.resolve(__dirname, '../..');
    const swaggerPath = path.join(implRoot, 'docs', 'swagger', 'archive.swagger.js');
    const fragmentPath = path.join(
      implRoot,
      'specs',
      '001-evolve-5eadac030bdd49c18ab15eac',
      'contracts',
      'archive.getArchivedLead.openapi.yaml'
    );

    const swaggerText = fs.readFileSync(swaggerPath, 'utf8');
    const fragmentText = fs.readFileSync(fragmentPath, 'utf8');

    expect(fragmentText).toContain('/archive/leads/{id}');
    expect(swaggerText).toContain('/archive/leads/{id}');

    expect(swaggerText).toMatch(/\/api\/v1\/archive\/leads\/{id}/);
  });
});
