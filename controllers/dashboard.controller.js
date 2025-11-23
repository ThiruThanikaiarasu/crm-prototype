const { ERROR_CODES } = require("../constants/error.constant")
const { setResponseBody } = require("../utils/responseFormatter.util")

const getDashboardContent = async (request, response) => {
    try {
        return response.status(201).send(
                    setResponseBody(
                        'Data fetched Successfully',
                        ERROR_CODES.SUCCESS,
                        null,
                        {
                            cards: [
                                { title: "Card 1", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
                            ]
                        }
                    ),
                )
    } catch (error) {
        console.log(error)
        response
            .status(500)
            .send(
                setResponseBody(
                    error.message,
                    ERROR_CODES.SERVER_ERROR,
                    'server_error',
                    null
                )
            )
    }
}

const getAdminDashboard = async (request, response) => {
    try {
        return response.status(201).send(
                    setResponseBody(
                        'Data fetched Successfully',
                        ERROR_CODES.SUCCESS,
                        null,
                        {
                            cards: [
                                { title: "Card 1", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
                                { title: "Card 2", description: "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
                            ]
                        }
                    ),
                )
    } catch (error) {
        response
            .status(500)
            .send(
                setResponseBody(
                    error.message,
                    ERROR_CODES.SERVER_ERROR,
                    'server_error',
                    null
                )
            )
    }
}

const getSuperAdminDashboard = async (request, response) => {
    try {
        return response.status(201).send(
                    setResponseBody(
                        'Data fetched Successfully',
                        ERROR_CODES.SUCCESS,
                        null,
                        {
                            cards: [
                                { title: "Card 1", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
                                { title: "Card 2", description: "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
                                { title: "Card 3", description: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris." }
                            ]
                        }
                    ),
                )
    } catch (error) {
        response
            .status(500)
            .send(
                setResponseBody(
                    error.message,
                    ERROR_CODES.SERVER_ERROR,
                    'server_error',
                    null
                )
            )
    }
}

module.exports = {
    getDashboardContent,
    getAdminDashboard,
    getSuperAdminDashboard
}
