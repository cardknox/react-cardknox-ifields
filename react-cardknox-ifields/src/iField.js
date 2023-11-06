
import React from "react";
import {
    LOADED, TOKEN, PING, STYLE, ERROR, AUTO_SUBMIT, UPDATE, GET_TOKEN, INIT, FORMAT, SET_PLACEHOLDER, FOCUS, CLEAR_DATA,
    CARD_TYPE, SET_ACCOUNT_DATA, ENABLE_LOGGING, ENABLE_AUTO_SUBMIT, ENABLE3DS, UPDATE3DS, AMOUNT,
    MONTH, YEAR, WAIT_FOR_3DS_RESPONSE_TIMEOUT_DEFAULT, AUTO_FORMAT_DEFAULT_SEPARATOR, UPDATE_ISSUER, IFIELD_ORIGIN, IFIELDS_VERSION, CVV_TYPE
} from "./constants";

export default class IField extends React.Component {
    constructor(props) {
        super(props);
        this.validateProps();
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
        if (this.props.account !== prevProps.account)
            this.setAccount(this.props.account);
        if (this.props.threeDS.enable3DS) {
            if (this.props.threeDS.enable3DS !== prevProps.threeDS.enable3DS)
                this.enable3DS(this.props.threeDS.waitForResponse, this.props.threeDS.waitForResponseTimeout);
            if (this.props.threeDS.amount !== prevProps.threeDS.amount)
                this.update3DS(AMOUNT, this.props.threeDS.amount);
            if (this.props.threeDS.month !== prevProps.threeDS.month)
                this.update3DS(MONTH, this.props.threeDS.month);
            if (this.props.threeDS.year !== prevProps.threeDS.year)
                this.update3DS(YEAR, this.props.threeDS.year);
        }
        if (this.props.issuer !== prevProps.issuer)
            this.updateIssuer(this.props.issuer);
        if (this.props.options.autoFormat) {
            if (this.props.options.autoFormat !== prevProps.options.autoFormat ||
                this.props.options.autoFormatSeparator !== prevProps.options.autoFormatSeparator)
                this.enableAutoFormat(this.props.options.autoFormatSeparator);
        }
        if (this.props.options.autoSubmit) {
            if (this.props.options.autoSubmit !== prevProps.options.autoSubmit ||
                this.props.options.autoSubmitFormId !== prevProps.options.autoSubmitFormId)
                this.enableAutoSubmit(this.props.options.autoSubmitFormId);
        }
        if (this.props.options.enableLogging !== prevProps.options.enableLogging)
            this.enableLogging();
        if (this.props.options.placeholder !== prevProps.options.placeholder)
            this.setPlaceholder(this.props.options.placeholder);
        if (this.props.options.iFieldstyle !== prevProps.options.iFieldstyle)
            this.setStyle(this.props.options.iFieldstyle);
    }
    //----------------------Events
    /**
     * 
     * @param {MessageEvent} e 
     */
    onMessage = (e) => {
        var data = e.data;
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
        var props = this.props;
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
        if (data && data.formId) {
            document.getElementById(data.formId).dispatchEvent(new Event("submit", {
                bubbles: true,
                cancelable: true
            }));
        }
    }
    //----------------------/
    //----------------------Actions
    ping() {
        var message = {
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
        var message = {
            action: SET_ACCOUNT_DATA,
            data
        };
        this.logAction(SET_ACCOUNT_DATA);
        this.postMessage(message);
    }
    init() {
        var message = {
            action: INIT,
            tokenType: this.props.type,
            referrer: window.location.toString()
        };
        this.logAction(INIT);
        this.postMessage(message);
    }
    getToken() {
        var message = {
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
        var message = {
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
        var message = {
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
        var message = {
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
        var message = {
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
        var message = {
            action: FORMAT,
            data: {
                formatChar
            }
        };
        this.logAction(FORMAT);
        this.postMessage(message);
    }
    enableLogging() {
        var message = {
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
        var message = {
            action: ENABLE_AUTO_SUBMIT,
            data: {
                formId
            }
        };
        this.logAction(ENABLE_AUTO_SUBMIT);
        this.postMessage(message);
    }
    setStyle(data) {
        var message = {
            action: STYLE,
            data
        };
        this.logAction(STYLE);
        this.postMessage(message);
    }
    //----------------------Public Actions
    focusIfield() {
        var message = {
            action: FOCUS
        }
        this.logAction(FOCUS);
        this.postMessage(message);
    }
    clearIfield() {
        var message = {
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

    validateProps() {
        var props = this.props;
        var accountProps = props.account ?
            props.account.xKey ?
                props.account.xSoftwareName ?
                    props.account.xSoftwareVersion ? false :
                        'xSoftwareVersion' :
                    'xSoftwareName' :
                'xKey' :
            'account';
        if (accountProps) {
            this.error("Missing " + accountProps)
        }
        if (!props.type)
            this.error("Missing props (type)")
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
}

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
