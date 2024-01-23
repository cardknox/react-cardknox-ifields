import { each } from 'lodash';
import * as lib from '../lib';

class HttpService {
    constructor(props) {        
		this.state = props;
	}

	tryParse = (text, ...parsers) => {
		let data;
		each(parsers, parser => {
			try {
				data = parser(text);
			} catch (e) {
				//intentionally empty catch block
			}
			if (data) {
				return false;
			}
		});
		return data;
	};

	checkIfError = (response) => {
		const { data, ok } = response;
		if (!ok && (data && !data.size)) {
			const errorMessage = { response: data };
			throw errorMessage;
		}
		return response;
	};
	handleResponse = async (response) => {
		const text = await response.text();
		const data = this.tryParse(text, JSON.parse, content => this.deserialize(content));
		return { data, ok: response.ok, status: response.status };
	};

	httpRequest(url, options, body) {
		const { enableLogging } = this.state;
		const request = new Request(url, options);

		return new Promise((resolve, reject) => {
			fetch(request)
				.then(response =>
					options.isDocument
						? { data: response.blob(), ok: response.ok, status: response.status }
						: this.handleResponse(response, options)
				)
				.then(response => this.checkIfError(response))
				.then(response => {
					lib.logDebug(enableLogging, `url: ${url}`,`request: ${JSON.stringify(body)}`, `response: ${JSON.stringify(response)}`);
					return resolve(response.data);
				})
				.catch(ex => {
					if (options.skipLogging) {
						resolve();
					} else {
						const response = ex && ex.response;
						lib.logError(enableLogging, `url: ${url};\nrequest: ${body}`, response);
						reject(ex);
					}
				});
		});
	}

	async post(url, body, options = {}) {
		this.initializeHeaders(options, options.isJson);
		options.method = 'POST';
		options.body = body ? options.isJson ? JSON.stringify(body) : this.serialize(body) : undefined;
		return await this.httpRequest(url, options, body);
	}

	async get(url, options = {}, isJson = false) {
		if (!options.isDocument) {
			this.initializeHeaders(options, isJson);
		}
		options.method = 'GET';

		return await this.httpRequest(url, options);
	}

	initializeHeaders(options, isJson = false) {
		const hasContentType = options.headers && !!options.headers.get('Content-Type');

		options.headers = options.headers || new Headers();

		if (isJson && !hasContentType) {
			options.headers.set('Content-Type', 'application/json');
		} else if (!hasContentType) {
			options.headers.set('Content-Type', 'application/x-www-form-urlencoded');
		}
	}

	serialize(content) {
		if (!content) {
			return;
		}

		const data = [];

		for (let key in content) {
			if (has(content, key)) {
				if (content[key] === undefined) {
					continue;
				}
				data.push(encodeURIComponent(key) + '=' + encodeURIComponent(content[key]));
			}
		}

		return data.join('&');
	}

	deserialize(content) {
		let data = {};
		content.replace(/\+/g, ' ').replace(/([^=&]+)=([^&]*)/g, function(m, key, value) {
			data[decodeURIComponent(key)] = decodeURIComponent(value);
		});
		return data;
	}
}

export default HttpService;
