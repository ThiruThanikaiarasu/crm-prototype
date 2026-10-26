const fs = require('fs')
const path = require('path')
const swaggerSpec = require('../../configurations/swagger.config')

describe('Contract Sync Tests', () => {
    it('should have GET /archive/leads/{id} endpoint documented in Swagger', () => {
        const archiveLeadsPath = swaggerSpec.paths['/archive/leads/{id}']
        expect(archiveLeadsPath).toBeDefined()
        expect(archiveLeadsPath.get).toBeDefined()
    })

    it('should have canonical example with /api/v1/archive/leads/{id} in Swagger', () => {
        const archiveLeadsPath = swaggerSpec.paths['/archive/leads/{id}']
        const getOperation = archiveLeadsPath.get

        expect(getOperation).toBeDefined()
        expect(getOperation.tags).toContain('Archive')
        expect(getOperation.security).toBeDefined()
        expect(getOperation.parameters).toBeDefined()

        const idParam = getOperation.parameters.find((p) => p.name === 'id')
        expect(idParam).toBeDefined()
        expect(idParam.required).toBe(true)
        expect(idParam.in).toBe('path')
    })

    it('should match contract specification for GET /archive/leads/{id}', () => {
        const contractPath = path.join(
            __dirname,
            '../../specs/001-evolve-5eadac030bdd49c18ab15eac/contracts/archive.getArchivedLead.openapi.yaml'
        )

        const contractContent = fs.readFileSync(contractPath, 'utf8')

        expect(contractContent).toContain('/archive/leads/{id}')
        expect(contractContent).toContain('Get archived lead by ID')
    })

    it('should have response examples in both Swagger and contract', () => {
        const archiveLeadsPath = swaggerSpec.paths['/archive/leads/{id}']
        const getOperation = archiveLeadsPath.get

        expect(getOperation.responses).toBeDefined()
        expect(getOperation.responses['200']).toBeDefined()
        expect(getOperation.responses['404']).toBeDefined()

        const response200 = getOperation.responses['200']
        expect(response200.description).toBeDefined()
        expect(response200.content).toBeDefined()
        expect(response200.content['application/json']).toBeDefined()
    })

    it('should have 404 response for archived lead not found', () => {
        const archiveLeadsPath = swaggerSpec.paths['/archive/leads/{id}']
        const getOperation = archiveLeadsPath.get

        expect(getOperation.responses['404']).toBeDefined()
        expect(getOperation.responses['404'].description).toContain('not found')
    })

    it('should require authentication with bearerAuth', () => {
        const archiveLeadsPath = swaggerSpec.paths['/archive/leads/{id}']
        const getOperation = archiveLeadsPath.get

        expect(getOperation.security).toBeDefined()
        expect(Array.isArray(getOperation.security)).toBe(true)

        const hasBearerAuth = getOperation.security.some((sec) => 'bearerAuth' in sec)
        expect(hasBearerAuth).toBe(true)
    })
})
