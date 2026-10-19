export class AppError extends Error {
    constructor(statusCode, code, message, options = {}) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        if (options.cause) {
            this.cause = options.cause;
        }
    }
}

export const notFoundHandler = (req, res, next) => {
    next(new AppError(
        404,
        "ROUTE_NOT_FOUND",
        "We couldn't find that page or service. Check the URL and try again."
    ));
};

export const errorHandler = (error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    let statusCode = Number.isInteger(error.statusCode)
        ? error.statusCode
        : Number.isInteger(error.status)
            ? error.status
            : 500;
    let code = error.code || "INTERNAL_ERROR";
    let message = error.isOperational
        ? error.message
        : "Something went wrong on our side. Please try again.";

    if (
        error.type === "entity.parse.failed"
        || (error instanceof SyntaxError && error.status === 400)
    ) {
        statusCode = 400;
        code = "INVALID_JSON";
        message = "The request body isn't valid JSON. Please check it and try again.";
    } else if (error.name === "ValidationError") {
        statusCode = 400;
        code = "INVALID_INPUT";
        message = "Some of the information provided is invalid. Please check your input.";
    } else if (error.name === "CastError") {
        statusCode = 400;
        code = "INVALID_ID";
        message = "The requested record identifier is invalid.";
    } else if (error.code === 11000) {
        statusCode = 409;
        code = "ALREADY_EXISTS";
        message = "This information is already in use. Please use a different value.";
    } else if (error.code === "auth/too-many-requests") {
        statusCode = 429;
        code = "TOO_MANY_SIGN_IN_ATTEMPTS";
        message = "There have been too many sign-in attempts. Please wait a moment and try again.";
    } else if ([
        "auth/argument-error",
        "auth/id-token-expired",
        "auth/invalid-credential",
        "auth/invalid-id-token",
        "auth/user-disabled",
        "auth/user-not-found",
    ].includes(error.code)) {
        statusCode = 401;
        code = "AUTHENTICATION_FAILED";
        message = "Your sign-in could not be verified. Please sign in again.";
    }

    if (statusCode >= 500 || !error.isOperational) {
        console.error("[request-error]", {
            method: req.method,
            path: req.path,
            code,
            error: error.message,
            stack: error.stack,
            cause: error.cause?.message,
            causeStack: error.cause?.stack,
        });
    } else {
        console.warn("[request-error]", {
            method: req.method,
            path: req.path,
            code,
            message,
        });
    }

    return res.status(statusCode).json({
        success: false,
        code,
        message,
        error: {
            code,
            message,
        },
    });
};
