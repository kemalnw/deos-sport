exports.errorResponse = (err) => {
    return {
        message: err.message
    }
}

exports.successResponse = (msg, data) => {
    return {
        message: msg,
        data: data
    }
}