
import React from "react";
import PropTypes from 'prop-types';
import {
    LOADED, TOKEN, PING, STYLE, ERROR, AUTO_SUBMIT, BLOCK_NON_NUMERIC_INPUT, UPDATE, GET_TOKEN, INIT, FORMAT, SET_PLACEHOLDER, FOCUS, CLEAR_DATA,
    CARD_TYPE, SET_ACCOUNT_DATA, ENABLE_LOGGING, ENABLE_AUTO_SUBMIT, ENABLE3DS, DISABLE3DS,
    AUTO_FORMAT_DEFAULT_SEPARATOR, UPDATE_ISSUER, IFIELD_ORIGIN, IFIELDS_VERSION, CVV_TYPE
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
                className={this.props.className}
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
        this.updateAccount(prevProps);
        this.update3DS(prevProps);
        this.updateIssuer(prevProps);
        this.updateAutoFormat(prevProps);
        this.updateAutoSubmit(prevProps);
        this.updateBlockNonDigitInput(prevProps);
        this.updateLogging(prevProps);
        this.updatePlaceholder(prevProps);
        this.updateStyle(prevProps);
    }
    updateAccount(prevProps) {
        const { account } = this.props;
        if (account !== prevProps.account) {
            this.setAccount(account);
        }
    }
    update3DS(prevProps) {
        const { threeDS } = this.props;
        const { threeDS: prevThreeDS } = prevProps;

        if (threeDS?.enable3DS) {
            if (this.state.iFrameLoaded && (!prevThreeDS?.enable3DS
                || threeDS.environment !== prevThreeDS.environment
                || threeDS.handle3DSResults !== prevThreeDS.handle3DSResults)) {
                this.enable3DS(threeDS.environment, threeDS.handle3DSResults);
            }
        } else if (prevThreeDS?.enable3DS) {
            this.disable3DS();
        }
    }
    updateIssuer(prevProps) {
        const { issuer } = this.props;
        if (issuer !== prevProps.issuer) {
            this.updateIssuer(issuer);
        }
    }
    updateAutoFormat(prevProps) {
        const { options } = this.props;
        const { options: prevOptions } = prevProps;

        if (options.autoFormat !== prevOptions.autoFormat ||
            options.autoFormatSeparator !== prevOptions.autoFormatSeparator) {
            this.enableAutoFormat(options.autoFormatSeparator);
        }
    }
    updateAutoSubmit(prevProps) {
        const { options } = this.props;
        const { options: prevOptions } = prevProps;

        if (options.autoSubmit !== prevOptions.autoSubmit ||
            options.autoSubmitFormId !== prevOptions.autoSubmitFormId) {
            this.enableAutoSubmit(options.autoSubmitFormId);
        }
    }
    updateBlockNonDigitInput(prevProps) {
        const { options } = this.props;
        const { options: prevOptions } = prevProps;

        if (options.blockNonDigitInput !== prevOptions.blockNonDigitInput && options.blockNonDigitInput) {
            this.enableBlockNonDigitInput();
        }
    }
    updateLogging(prevProps) {
        const { options } = this.props;
        const { options: prevOptions } = prevProps;

        if (options.enableLogging !== prevOptions.enableLogging) {
            this.enableLogging();
        }
    }
    updatePlaceholder(prevProps) {
        const { options } = this.props;
        const { options: prevOptions } = prevProps;

        if (options.placeholder !== prevOptions.placeholder) {
            this.setPlaceholder(options.placeholder);
        }
    }
    updateStyle(prevProps) {
        const { options } = this.props;
        const { options: prevOptions } = prevProps;

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
    }
    onLoad = () => {
        const props = this.props;
        this.setAccount(props.account);
        if (this.props.type === CARD_TYPE) {
            const { threeDS } = props;
            if (threeDS?.enable3DS && threeDS.environment) {
                this.enable3DS(threeDS.environment, threeDS.handle3DSResults);
            } else {
                this.disable3DS();
            }
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
        if (props.options.blockNonDigitInput)
            this.enableBlockNonDigitInput();
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
        this.setState({ getTokenTimeoutIds: [] });
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
        this.setState({ getTokenTimeoutIds: [...this.state.getTokenTimeoutIds, getTokenTimeoutId] });
    }

    validateProps() {
        const props = this.props;
        const accountProps = props.account ?
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
     * @param {string} environment 
     * @param {Handle3DSResults} handle3DSResults 
     */
    enable3DS(environment, handle3DSResults) {
        if (handle3DSResults) {
            if (typeof window.ck3DS !== 'undefined') {
                ck3DS.configuration.onVerifyComplete = this.handle3DSResultsWrapper(handle3DSResults);
                ck3DS.configuration.enableConsoleLogging = this.props.options.enableLogging;
                if (!ck3DS.initialized)
                    ck3DS.initialize3DS(environment);
            }
        }
        const message = {
            action: ENABLE3DS,
            data: {
                environment,
                verificationEnabled: !!handle3DSResults
            }
        };
        this.logAction(ENABLE3DS);
        this.postMessage(message);
    }

    /**
     * 
     * @param {Handle3DSResults} handle3DSResults 
     */
    handle3DSResultsWrapper(handle3DSResults) {
        return function (actionCode, xCavv, xEciFlag, xRefNum, xAuthenticateStatus, xSignatureVerification) {
            handle3DSResults(actionCode, xCavv, xEciFlag, xRefNum, xAuthenticateStatus, xSignatureVerification, ck3DS.error);
        }
    }

    disable3DS() {
        const message = {
            action: DISABLE3DS,
            data: {}
        };
        this.logAction(DISABLE3DS);
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
    enableBlockNonDigitInput() {
        const message = {
            action: BLOCK_NON_NUMERIC_INPUT
        };
        this.logAction(BLOCK_NON_NUMERIC_INPUT);
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
    className: PropTypes.string,
    type: PropTypes.string.isRequired,
    options: PropTypes.shape({
        autoFormat: PropTypes.bool,
        autoFormatSeparator: PropTypes.string,
        blockNonDigitInput: PropTypes.bool,
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
        environment: PropTypes.string,
        handle3DSResults: PropTypes.func
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
    threeDS: {}
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

/**
 * @callback Handle3DSResults
 * @param {string} actionCode
 * @param {string} xCavv
 * @param {string} xEciFlag
 * @param {string} xRefnum
 * @param {string} xAuthenicationStatus
 * @param {string} xSignatureVerification
 * @param {string} xError
 */
