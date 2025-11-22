const { validationResult } = require("express-validator");
const { findUserByEmail, registerUser } = require("../services/auth.service");
const { generateAndSetTokens } = require("../services/token.service");
const { setResponseBody } = require("../utils/responseFormatter.util");
const bcrypt = require('bcryptjs')

const signup = async (request, response) => {
    console.log("entered controller")
    const { firstName, lastName, email, password, role } = request.body;

    const tenantId = "abcd"

    try {
        const errors = validationResult(request);
        if (!errors.isEmpty()) {
            return response.status(400).send(
                setResponseBody(errors.array()[0].msg, "validation_error", null)
            );
        }

        const existingUser = await findUserByEmail(email, tenantId);
        if (existingUser) {
            return response.status(409).send(
                setResponseBody("Email already exists", "email_exists", null)
            );
        }

        const createdUser = await registerUser({
            firstName,
            lastName,
            email,
            password,
            role,
            tenantId
        });

        await generateAndSetTokens(response, createdUser.tenantId, createdUser._id, createdUser.role)

        return response
                .status(201)
                .send(
                    setResponseBody(
                        "User registered successfully",
                        null,
                        {
                            email: createdUser.email,
                            userId: createdUser._id,
                        }
                    )
                )



    } catch (error) {
        response.status(500).send(setResponseBody(error.message, "server_error", null))
    }
}

const login = async (request, response) => {
    const { email, password, tenantId } = request.body;

    try {
        const errors = validationResult(request);
        if (!errors.isEmpty()) {
            return response.status(400).send(
                setResponseBody(errors.array()[0].msg, "validation_error", null)
            );
        }

        const existingUser = await findUserByEmail(email, tenantId);
        if (!existingUser) {
            return response.status(404).send(
                setResponseBody("Invalid email address", "invalid_email", null)
            );
        }

        const validPassword = await bcrypt.compare(password, existingUser.password);
        if (!validPassword) {
            return response.status(401).send(
                setResponseBody("Invalid password", "invalid_password", null)
            );
        }

        // const accessToken = generateAccessToken({
        //     tenantId,
        //     userId: existingUser._id,
        //     role: existingUser.role
        // });

        // const refreshToken = generateRefreshToken({
        //     userId: existingUser._id
        // });

        // await storeRefreshToken(tenantId, {
        //     user: existingUser._id,
        //     token: refreshToken,
        // });

        // setTokenCookie(response, "SessionID", accessToken);

        generateAndSetTokens(response, tenantId, existingUser._id, existingUser.role)

        const userProfile = await fetchUserProfileData(existingUser._id);

        return response.status(200).send(
            setResponseBody("Logged in Successfully", null, {
                accessToken,
                refreshToken,
                profilePicture: userProfile?.profilePicture || null,
                firstName: existingUser.firstName,
                lastName: existingUser.lastName,
                email: existingUser.email,
                role: existingUser.role
            })
        );
    } catch (error) {
        response.status(500).send(setResponseBody(error.message, "server_error", null))
    }
}

module.exports = {
    signup,
    login
}