const fs = require('fs')
const path = require('path')

describe('Route Parameter Guard', () => {
    it('should fail on route param segments missing ":" prefix', () => {
        const routesDir = path.join(__dirname, '../../routes')
        const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'))

        const issues = []

        files.forEach(file => {
            const filePath = path.join(routesDir, file)
            const content = fs.readFileSync(filePath, 'utf-8')

            // Match router.get/post/put/delete with route path strings
            // Look for patterns like '/leads:id' without ':' prefix before param name
            // Pattern: quote followed by path segment, then identifier without preceding ':'
            const routeMatches = content.match(/router\.(get|post|put|delete|patch)\(\s*['"`]([^'"`]+)['"`]/g)

            if (routeMatches) {
                routeMatches.forEach(match => {
                    const pathMatch = match.match(/['"`]([^'"`]+)['"`]/)
                    if (pathMatch) {
                        const routePath = pathMatch[1]

                        // Check for patterns like '/something:id' (missing ':' before param)
                        // This regex looks for a path segment followed directly by a colon and identifier
                        // without a slash and colon (e.g., '/leads:id' instead of '/leads/:id')
                        const missingColonPattern = /\/[a-zA-Z0-9-]+:[a-zA-Z0-9-_]+/

                        if (missingColonPattern.test(routePath)) {
                            issues.push({
                                file,
                                path: routePath,
                                message: `Route path missing ':' prefix before parameter: ${routePath}`
                            })
                        }
                    }
                })
            }
        })

        if (issues.length > 0) {
            const issuesList = issues.map(i => `  ${i.file}: ${i.message}`).join('\n')
            throw new Error(`Found route parameter issues:\n${issuesList}`)
        }
    })
})
