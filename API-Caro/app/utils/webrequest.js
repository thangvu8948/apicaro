const request = require('request');

let GET = (options,params) => {

    const queryString = Object.keys(params).map(key => key + '=' + params[key]).join('&');
    options.url = options.url + '?' + queryString;

    return new Promise((resolve, reject) => {
        request.get(options, function (err, response, body) {
            // in addition to parsing the value, deal with possible errors
            if (err) return reject(err);
            try {
                // JSON.parse() can throw an exception if not valid JSON
                resolve(JSON.parse(body));
            } catch (e) {
                reject(e);
            }
        })
    })
  
}

let POST = (options, params) => {
    options.body = JSON.stringify(params);
    return new Promise((resolve, reject) => {
        request.post(options, function (err, response, body) {
            // in addition to parsing the value, deal with possible errors
            if (err) return reject(err);
            try {
                // JSON.parse() can throw an exception if not valid JSON
                resolve(JSON.parse(body));
            } catch (e) {
                reject(e);
            }
        })
    })

}

module.exports = {
    GET: GET,
    POST: POST,
};