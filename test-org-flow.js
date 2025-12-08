const BASE_URL = 'http://127.0.0.1:3500/api/v1'

const testFlow = async () => {
    try {
        const domain = `test-org-refactor-${Date.now()}.com`
        console.log(`Testing with domain: ${domain}`)

        // 1. Verify Organization (Should not exist)
        console.log('\n--- 1. Verify Organization (Expect False) ---')
        try {
            const verifyRes = await fetch(`${BASE_URL}/organizations/verify?domain=${domain}`)
            const json = await verifyRes.json()
            console.log('Result Full:', json)
            // Access nested data if using setResponseBody
            const exists = json.data ? json.data.exists : json.exists
            console.log('Exists Value:', exists)
        } catch (e) {
            console.error('Verify Failed:', e.message)
        }

        // 2. Create Organization
        console.log('\n--- 2. Create Organization ---')
        const orgData = {
            title: 'Refactored Org',
            domain: domain,
            admin: {
                firstName: 'Refactor',
                lastName: 'Admin',
                email: `refactor-${Date.now()}@${domain}`,
                password: 'password123'
            }
        }

        try {
            const createRes = await fetch(`${BASE_URL}/organizations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orgData)
            })
            const json = await createRes.json()
            console.log('Create Result Status:', createRes.status)

            if (createRes.ok && json.data) {
                console.log('Organization ID:', json.data.organization._id)
                console.log('Admin ID:', json.data.admin._id)
            } else {
                console.log('Create Failed Data:', json)
            }
        } catch (e) {
            console.error('Create Failed:', e.message)
            return;
        }

        // 3. Verify Organization (Should exist now)
        console.log('\n--- 3. Verify Organization (Expect True) ---')
        try {
            const verifyRes2 = await fetch(`${BASE_URL}/organizations/verify?domain=${domain}`)
            const json2 = await verifyRes2.json()
            console.log('Result Full:', json2)
            const exists = json2.data ? json2.data.exists : json2.exists
            console.log('Exists Value:', exists)
        } catch (e) {
            console.error('Verify 2 Failed:', e.message)
        }

    } catch (error) {
        console.error('Test Flow Error:', error)
    }
}

testFlow()
