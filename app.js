require('./configurations/env.config')
const express = require('express')
const app = express()

const cors = require('cors')
const cookieParser = require('cookie-parser')

const authRoute = require('./routes/auth.route')
const dashboardRoute = require('./routes/dashboard.route')

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./configurations/swagger.config');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(
    cors({
        origin: process.env.CORS_ORIGIN_URL,
        credentials: true,
    }),
)
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (request, response) => {
    response.status(200).send({ message: 'Server running successfully.' })
})

app.use('/api/v1/auth', authRoute)
app.use('/api/v1/dashboard', dashboardRoute)

module.exports = app
