import { has, each, startsWith } from 'lodash';

import principalService from './principalService';
import HttpServiceError from './httpServiceError';
import { fixJsonFormat } from '../utilities/fix-json-format';
import logger from '../utilities/logger';
import updateApiEndpoint from 'common/utilities/UpdateApiEndpoint';

const applicationSettings = ApplicationSettings;

class HttpService {
	constructor(principalService) {
		this.principalService = principalService;
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

	checkIfApiError = (response, url) => {
		const { data, ok } = response;
		if (
			data &&
			(!!data.xError ||
				!!data.xMessage ||
				!!data.errormessage ||
				!!data.Error ||
				(!!data.error && !startsWith(url, applicationSettings.kvaasEndpoint)))
		) {
			throw {
				isApiError: true,
				ref: data.xGatewayRefNum || data.xRefNum || data.xRecurringRefNum || data.refnum || data.RefNum,
				message: data.xError || data.xMessage || data.errormessage || data.Error || data.error,
				success: false,
				data,
			};
		}
		if (!ok && (data && !data.size)) {
			const errorMessage = { response: data };
			throw errorMessage;
		}

		return response;
	};
	handleResponse = async (response, options) => {
		const text = await response.text();
		const data = this.tryParse(text, JSON.parse, content => this.deserialize(content, options.fixBatchData));
		return { data, ok: response.ok, status: response.status };
	};

	httpRequest(url, options, deserializedBody) {
		const request = new Request(url, options);

		return new Promise((resolve, reject) => {
			fetch(request)
				.then(response =>
					options.isDocument
						? { data: response.blob(), ok: response.ok, status: response.status }
						: this.handleResponse(response, options)
				)
				.then(response => this.checkIfApiError(response, url))
				.then(response => {
					if (!options.skipLogging) {
						logger.logApiCall({
							url,
							request: deserializedBody,
							response,
						});
					}
					return resolve(response.data);
				})
				.catch(ex => {
					if (options.skipLogging) {
						resolve();
					} else {
						logger.logApiCall({
							url,
							request: deserializedBody,
							response: ex && ex.response,
						});
						if (ex && ex.isApiError) {
							reject(ex);
						} else {
							reject(
								new HttpServiceError({
									ex,
									request,
									response: ex.response,
								})
							);
						}
					}
				});
		});
	}

	async post(url, body, options = {}) {
		this.initializeHeaders(options, options.isJson);
		options.method = 'POST';
		let deserializedBody = {};
		if (options.noInit) {
			deserializedBody = body;
		} else if (body) {
			deserializedBody = await this.initializeBody(url, body, options.allowPublic);
		}

		options.body = options.isJson ? JSON.stringify(deserializedBody) : this.serialize(deserializedBody);

		return await this.httpRequest(url, options, deserializedBody);
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

		if (applicationSettings.apiOrigin) {
			options.headers.set('Origin', applicationSettings.apiOrigin);
		}
		if (applicationSettings.apiRequestedWith) {
			options.headers.set('X-Requested-With', applicationSettings.apiRequestedWith);
		}
	}

	async initializeBody(url, content, allowPublic = false) {
		let key = content.xKey;

		const principal = principalService.get();
		if (!allowPublic && !key && !startsWith(url, applicationSettings.kvaasEndpoint)) {
			if (!principal || !principal.id) {
				principalService.clear();
				window.location.reload();
			}
			key = principal.id;
		}
		if (startsWith(url, updateApiEndpoint(null))) {
			if (!content.xUserName && !allowPublic && principal) {
				content.xUserName = principal.username;
			}
			if (!content.xKey) {
				content.xKey = key;
			}
			content.xVersion = applicationSettings.apiVersion;
			content.xSoftwareName = SoftwareSettings.name;
			content.xSoftwareVersion = SoftwareSettings.version;
		} else if (
			startsWith(url, applicationSettings.recurringApiEndpoint) ||
			startsWith(url, applicationSettings.kvaasEndpoint) ||
			startsWith(url, applicationSettings.logoManagementEndpoint)
		) {
			content.softwareName = SoftwareSettings.name;
			content.softwareVersion = SoftwareSettings.version;
		} else if (startsWith(url, applicationSettings.keyManagementEndpoint)) {
			if (!content.adminKey) {
				content.adminKey = key;
			}
			content.dataVersion = applicationSettings.keyManagementApiVersion;
		} else if (startsWith(url, applicationSettings.paymentSiteApiEndpoint)) {
			content.ssoKey = key;
		}
		return content;
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

	deserialize(content, fixBatchData) {
		let data = {};
		content.replace(/\+/g, ' ').replace(/([^=&]+)=([^&]*)/g, function(m, key, value) {
			data[decodeURIComponent(key)] = decodeURIComponent(value);
		});

		if (has(data, 'xReportData')) {
			data.xReportData = fixBatchData ? fixJsonFormat(data.xReportData) : JSON.parse(data.xReportData);
		}
		return data;
	}
}

const httpService = new HttpService(principalService);

export default httpService;
