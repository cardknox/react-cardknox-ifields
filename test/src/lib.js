export const logError = (message, error) => {
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

function roundTo(number, decimals) {
    return Number(number).toFixed(decimals);
}
export const  roundToNumber = (number, decimals) => {
    return Number(roundTo(number, decimals));
}
