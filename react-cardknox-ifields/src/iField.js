
import React from "react";
import PropTypes from 'prop-types';
import {
    LOADED, TOKEN, PING, STYLE, ERROR, AUTO_SUBMIT, UPDATE, GET_TOKEN, INIT, FORMAT, SET_PLACEHOLDER, FOCUS, CLEAR_DATA,
    CARD_TYPE, SET_ACCOUNT_DATA, ENABLE_LOGGING, ENABLE_AUTO_SUBMIT, ENABLE3DS, UPDATE3DS, AMOUNT,
    MONTH, YEAR, WAIT_FOR_3DS_RESPONSE_TIMEOUT_DEFAULT, AUTO_FORMAT_DEFAULT_SEPARATOR, UPDATE_ISSUER, IFIELD_ORIGIN, IFIELDS_VERSION, CVV_TYPE
} from "./constants";

export default class IField extends React.Component {
    constructor(props) {
        super(props);
        this.iFrameRef = React.createRef();
        this.state = {
            iFrameLoaded: false,
            ifieldDataCache: {
                length: 0,
                issuer: ''
            },
            getTokenTimeoutIds: []
        };
    }
    render() {
        return (
            <iframe
                style={this.props.options.iFrameStyle}
                src={IFIELD_ORIGIN + '/ifields/' + IFIELDS_VERSION + '/ifield.htm'}
                title={this.props.type}
                ref={this.iFrameRef}>
            </iframe>
        )
    }
    componentDidMount() {
        window.addEventListener('message', this.onMessage);
        this.ping();
    }
    componentWillUnmount() {
        window.removeEventListener('message', this.onMessage);
    }
    componentDidUpdate(prevProps) {
        const { props } = this;
        const { threeDS, options } = props;
        const { threeDS: prevThreeDS, options: prevOptions } = prevProps;

        if (props.account !== prevProps.account) {
            this.setAccount(props.account);
        }

        if (threeDS.enable3DS !== prevThreeDS.enable3DS) {
            this.enable3DS(threeDS.waitForResponse, threeDS.waitForResponseTimeout);
        }

        if (threeDS.amount !== prevThreeDS.amount) {
            this.update3DS(AMOUNT, threeDS.amount);
        }

        if (threeDS.month !== prevThreeDS.month) {
            this.update3DS(MONTH, threeDS.month);
        }

        if (threeDS.year !== prevThreeDS.year) {
            this.update3DS(YEAR, threeDS.year);
        }

        if (props.issuer !== prevProps.issuer) {
            this.updateIssuer(props.issuer);
        }

        if (options.autoFormat !== prevOptions.autoFormat ||
                options.autoFormatSeparator !== prevOptions.autoFormatSeparator) {
            this.enableAutoFormat(options.autoFormatSeparator);
        }

        if (options.autoSubmit !== prevOptions.autoSubmit ||
                options.autoSubmitFormId !== prevOptions.autoSubmitFormId) {
            this.enableAutoSubmit(options.autoSubmitFormId);
        }

        if (options.enableLogging !== prevOptions.enableLogging) {
            this.enableLogging();
        }

        if (options.placeholder !== prevOptions.placeholder) {
            this.setPlaceholder(options.placeholder);
        }

        if (options.iFieldstyle !== prevOptions.iFieldstyle) {
            this.setStyle(options.iFieldstyle);
        }
    }
    //----------------------Events
    /**
     * 
     * @param {MessageEvent} e 
     */
    onMessage = (e) => {
        const data = e.data;
        if (e.source !== this.iFrameRef.current.contentWindow)
            return;
        switch (data.action) {
            case LOADED:
                this.log("Message received: ifield loaded");
                this.setState({ iFrameLoaded: true }, this.onLoad);
                break;
            case TOKEN:
                this.log("Message received: " + TOKEN);
                this.onToken(data);
                break;
            case AUTO_SUBMIT:
                this.log("Message received: " + AUTO_SUBMIT);
                this.onSubmit(data);
                break;
            case UPDATE:
                this.log("Message received: " + UPDATE);
                this.onUpdate(data);
                break;
            default:
                break;
        }
        if (this.props.threeDS.enable3DS &&
            data.eci &&
            data.eci.length &&
            this.props.type === CARD_TYPE) {
            this.log("Message received: eci");
            this.postMessage(data);
        }
    }
    onLoad = () => {
        const props = this.props;
        this.setAccount(props.account);
        if (props.threeDS.enable3DS) {
            this.enable3DS(props.threeDS.waitForResponse, props.threeDS.waitForResponseTimeout);
            this.update3DS(AMOUNT, props.threeDS.amount);
            this.update3DS(MONTH, props.threeDS.month);
            this.update3DS(YEAR, props.threeDS.year);
        }
        this.init();
        if (props.issuer)
            this.updateIssuer(props.issuer);
        if (props.options.placeholder)
            this.setPlaceholder(props.options.placeholder);
        if (props.options.enableLogging)
            this.enableLogging();
        if (props.options.autoFormat)
            this.enableAutoFormat(props.options.autoFormatSeparator);
        if (props.options.autoSubmit)
            this.enableAutoSubmit(props.options.autoSubmitFormId);
        if (props.options.iFieldstyle)
            this.setStyle(props.options.iFieldstyle);
        if (props.onLoad)
            props.onLoad();
    }
    /**
     * 
     * @param {{data: TokenData}} param0 
     */
    onToken({ data }) {
        const { getTokenTimeoutIds } = this.state;
        this.setState({getTokenTimeoutIds: []});
        getTokenTimeoutIds.forEach(timeoutId => clearTimeout(timeoutId));
        if (data.result === ERROR) {
            this.log("Token Error: " + data.errorMessage);
            if (this.props.onError)
                this.props.onError(data);
        } else {
            this.setState({ xToken: data.xToken });
            if (this.props.onToken)
                this.props.onToken(data);
        }
    }
    /**
     * 
     * @param {{data: UpdateData}} param0 
     */
    onUpdate({ data }) {
        if (this.shouldUpdateToken(data))
            this.getToken();
        this.setState({
            ifieldDataCache: {
                length: data.length,
                issuer: data.issuer || this.state.ifieldDataCache.issuer
                //todo handle cache token, handle null issuer in vue, angular
            }
        });
        if (this.props.type === CARD_TYPE)
            data.issuer = data.issuer || 'unknown';
        if (this.props.onUpdate)
            this.props.onUpdate(data);
    }
    /**
     * 
     * @param {{data: SubmitData}} param0 
     */
    onSubmit({ data }) {
        //call first before submit is triggered
        if (this.props.onSubmit)
            this.props.onSubmit();
        if (data?.formId) {
            document.getElementById(data.formId).dispatchEvent(new Event("submit", {
                bubbles: true,
                cancelable: true
            }));
        }
    }
    //----------------------/
    //----------------------Actions
    ping() {
        const message = {
            action: PING
        };
        this.logAction(PING);
        this.postMessage(message);
    }
    /**
     * 
     * @param {AccountData} data 
     */
    setAccount(data) {
        const message = {
            action: SET_ACCOUNT_DATA,
            data
        };
        this.logAction(SET_ACCOUNT_DATA);
        this.postMessage(message);
    }
    init() {
        const message = {
            action: INIT,
            tokenType: this.props.type,
            referrer: window.location.toString()
        };
        this.logAction(INIT);
        this.postMessage(message);
    }
    getToken() {
        const message = {
            action: GET_TOKEN
        };
        this.logAction(GET_TOKEN);
        this.postMessage(message);
        const getTokenTimeoutId = setTimeout(() => {
            this.onToken({
                data: {
                    result: ERROR,
                    errorMessage: "Transaction timed out."
                }
            })
        }, 60000);
        this.setState({getTokenTimeoutIds: [...this.state.getTokenTimeoutIds, getTokenTimeoutId]});
    }
    /**
     * 
     * @param {boolean} waitForResponse 
     * @param {number} waitForResponseTimeout 
     */
    enable3DS(waitForResponse, waitForResponseTimeout) {
        const message = {
            action: ENABLE3DS,
            data: {
                waitForResponse,
                waitForResponseTimeout
            }
        };
        this.logAction(ENABLE3DS);
        this.postMessage(message);
    }
    /**
     * 
     * @param {string} fieldName - The field to update
     * @param {string} value 
     */
    update3DS(fieldName, value) {
        const message = {
            action: UPDATE3DS,
            data: {
                fieldName,
                value
            }
        };
        this.logAction(UPDATE3DS);
        this.postMessage(message);
    }
    /**
     * 
     * @param {string} issuer 
     */
    updateIssuer(issuer) {
        const message = {
            action: UPDATE_ISSUER,
            issuer: issuer || 'unknown'
        };
        this.logAction(UPDATE_ISSUER);
        this.postMessage(message);
    }
    /**
     * 
     * @param {string} data 
     */
    setPlaceholder(data) {
        const message = {
            action: SET_PLACEHOLDER,
            data
        };
        this.logAction(SET_PLACEHOLDER);
        this.postMessage(message);
    }
    /**
     * 
     * @param {string} formatChar 
     */
    enableAutoFormat(formatChar) {
        const message = {
            action: FORMAT,
            data: {
                formatChar
            }
        };
        this.logAction(FORMAT);
        this.postMessage(message);
    }
    enableLogging() {
        const message = {
            action: ENABLE_LOGGING
        };
        this.logAction(ENABLE_LOGGING);
        this.postMessage(message);
    }
    /**
     * 
     * @param {string} formId - The ID attribute of the form to trigger submit on
     */
    enableAutoSubmit(formId) {
        const message = {
            action: ENABLE_AUTO_SUBMIT,
            data: {
                formId
            }
        };
        this.logAction(ENABLE_AUTO_SUBMIT);
        this.postMessage(message);
    }
    setStyle(data) {
        const message = {
            action: STYLE,
            data
        };
        this.logAction(STYLE);
        this.postMessage(message);
    }
    //----------------------Public Actions
    focusIfield() {
        const message = {
            action: FOCUS
        }
        this.logAction(FOCUS);
        this.postMessage(message);
    }
    clearIfield() {
        const message = {
            action: CLEAR_DATA
        };
        this.logAction(CLEAR_DATA);
        this.postMessage(message);
    }
    //----------------------/
    //----------------------Helper Functions
    /**
     * 
     * @param {{action: string, data: *}} data 
     */
    postMessage(data) {
        if (!this.state.iFrameLoaded && data.action !== PING) {
            this.log("Iframe not loaded");
            return;
        }
        this.iFrameRef.current.contentWindow.postMessage(data, '*');
    }

    shouldUpdateToken = (data) => {
        return data.isValid
            && this.props.options.autoSubmit
            && (data.length !== this.state.ifieldDataCache.length
                || (this.props.type === CVV_TYPE && this.props.issuer !== this.state.ifieldDataCache.issuer))
    }


    /**
     * 
     * @param {string} message
     */
    log(message) {
        if (this.props.options.enableLogging) {
            console.log(`IField ${this.props.type}: ${message}`);
        }
    }
    /**
     * 
     * @param {string} action
     */
    logAction(action) {
        this.log(`Sending message ${action}`);
    }
    /**
     * 
     * @param {string} message
     */
    error(message) {
        console.error(`IField ${this.props.type}: ${message}`);
    }
    //---------------------------/
};

IField.propTypes = {
    type: PropTypes.string.isRequired,
    options: PropTypes.shape({
        autoFormat: PropTypes.bool,
        autoFormatSeparator: PropTypes.string,
        autoSubmit: PropTypes.bool,
        autoSubmitFormId: PropTypes.string,
        enableLogging: PropTypes.bool,
        placeholder: PropTypes.string,
        iFrameStyle: PropTypes.object,
        iFieldstyle: PropTypes.object
    }),
    account: PropTypes.shape({
        xKey: PropTypes.string.isRequired,
        xSoftwareName: PropTypes.string.isRequired,
        xSoftwareVersion: PropTypes.string.isRequired
    }),
    threeDS: PropTypes.shape({
        enable3DS: PropTypes.bool,
        waitForResponse: PropTypes.bool,
        waitForResponseTimeout: PropTypes.number,
        amount: PropTypes.string,
        month: PropTypes.string,
        year: PropTypes.string
    }),
    issuer: PropTypes.string,
    onLoad: PropTypes.func,
    onToken: PropTypes.func,
    onUpdate: PropTypes.func,
    onSubmit: PropTypes.func,
    onError: PropTypes.func
};

IField.defaultProps = {
    options: {
        autoFormatSeparator: AUTO_FORMAT_DEFAULT_SEPARATOR
    },
    account: {},
    threeDS: {
        waitForResponseTimeout: WAIT_FOR_3DS_RESPONSE_TIMEOUT_DEFAULT
    }
};

/**
 *
 * @typedef TokenData
 * @property {string} xToken
 * @property {string} xTokenType
 */
/**
 * @typedef UpdateData
 * @property {boolean} isEmpty
 * @property {boolean} isValid
 * @property {number} length
 * @property {number} cardNumberLength
 * @property {string} issuer
 * @property {string} type
 */
/**
 * @typedef SubmitData
 * @property {string} formId
 */
/**
 * @typedef AccountData
 * @property {string} xKey
 * @property {string} xSoftwareName
 * @property {string} xSoftwareVersion
 */
