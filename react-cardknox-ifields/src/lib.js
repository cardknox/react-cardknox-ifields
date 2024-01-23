export const logError = (enableLogging, message, error) => {
    if (!enableLogging) return;
    
    const request = [];
    if (message) request.push(message);
    if (error) {
        if (typeof(error) === "string") {
            request.push(error);        
        } else if (typeof(error.message) === "string") {
            request.push(error.message);
        } else {
            request.push(JSON.stringify(error));
        }
    }
    console.error.apply(console.error, request);
}

export const logDebug = (enableLogging, req) => {
    if (!enableLogging) return;

    if (typeof(req) === 'string') {
        console.log(JSON.stringify(req));
    } else if (typeof(req) === 'object') {
        if (req.label && req.data) {
            console.log(req.label, JSON.stringify(req.data));
        } else {
            const data = req.label || req.data || req;
            console.log(JSON.stringify(data));
        }
    }
}

function roundTo(number, decimals) {
    return Number(number).toFixed(decimals);
}
export const  roundToNumber = (number, decimals) => {
    return Number(roundTo(number, decimals));
}
