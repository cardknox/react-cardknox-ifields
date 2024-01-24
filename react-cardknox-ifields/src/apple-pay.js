import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import * as lib from './lib';
import HttpService from './services/httpService';
import './styles/main.css';
import { logDebug } from './lib';

const MAX_VERSION = 100;

const iStatus = {
    success: 100,
    invalid: -50,
    unsupported: -100,
    error: -200
}

const APRequiredFeaturesMap = {
    'address_validation': 3,
    'support_recurring': 13,
    'support_subscription' : 13
}

const APRequiredFeatures = {
    address_validation: 'address_validation',
    support_recurring: 'support_recurring',
    support_subscription : 'support_subscription'
}

const APButtonColor = {
    black: "black",
    white: "white",
    whiteOutline: "white-outline"
}    

const APButtonType = {
    buy: "buy",
    pay: "pay",
    plain: "plain",
    order: "order",
    donate: "donate",
    continue: "continue",
    checkout: "check-out"
}    

class CardknoxApplePay extends Component {
    constructor(props) {        
		super(props);
		this.state = this.initialState;
        const {enableLogging} = this.state;
        this.httpService = new HttpService({enableLogging});
	};

    get initialState() {
        const {enableLogging, properties} = this.props;
        return {
            enableLogging: enableLogging || false,
            buttonOptions: {
                buttonColor: properties.buttonOptions?.buttonColor || APButtonColor.black,
                buttonType: properties.buttonOptions?.buttonType || APButtonType.pay,
                width: properties.buttonOptions?.width,
                height: properties.buttonOptions?.height,
                minWidth: properties.buttonOptions?.minWidth,
                minHeight: properties.buttonOptions?.minHeight
            },
            walletCheckEnabled: properties.walletCheckEnabled || false,
            applicationData: properties.applicationData,
            merchantIdentifier: properties.merchantIdentifier,
            merchantCapabilities: properties.merchantCapabilities || [ 'supports3DS' ],
            supportedNetworks: properties.supportedNetworks || [ 'amex', 'discover', 'masterCard', 'visa'],
            supportedCountries: properties.supportedCountries || [],
            countryCode: properties.countryCode || 'US',
            currencyCode: properties.currencyCode || 'USD',
            requiredFeatures: properties.requiredFeatures || [],
            requiredBillingContactFields: properties.requiredBillingContactFields || ['postalAddress', 'name'],
            requiredShippingContactFields: properties.requiredShippingContactFields,
            billingContact: properties.billingContact,
            shippingContact: properties.shippingContact,
            shippingMethods: properties.shippingMethods || [],
            total: null,
            lineItems: null
        }
    };

    get appleButtonStyle() {
        const {buttonOptions} = this.state;
        const styles = {};
        styles['-apple-pay-button-type'] = buttonOptions.buttonType;
        styles['-apple-pay-button-style'] = buttonOptions.buttonColor;
        if (buttonOptions.minWidth) {
            styles['min-width'] = buttonOptions.minWidth+'px';
        }
        if (buttonOptions.minHeight) {
            styles['min-height'] = buttonOptions.minHeight+'px';
        }                
        if (buttonOptions.width) {
            styles.width = buttonOptions.width+'px';
        }
        if (buttonOptions.height) {
            styles.height = buttonOptions.height+"px";
        }
        return styles;
    }

    async componentDidMount() {
        await this.init();
    }

    init = async () => {
        const validate = () => {
            if (!window.ApplePaySession || !window.ApplePaySession.canMakePayments()) {
                throw new Error("Apple Pay not supported");
            }
            if (!this.state.merchantIdentifier) {
                throw new Error("merchantIdentifier is required")
            }
        };
        const getSupportedVersion = () => {
            let minVer = 1,
                maxVer = MAX_VERSION,
                currVer;
            while ((maxVer-minVer) > 1) {
                currVer = lib.roundToNumber((maxVer+minVer) / 2, 0);
                if (window.ApplePaySession.supportsVersion(currVer)) {
                    minVer = currVer;
                } else {
                    maxVer = currVer;                    
                }
            }
            return minVer;
        }

        const getMinRequiredVersion = () => {
            const {requiredFeatures} = this.state;
            if (!requiredFeatures) return 1;
            const requiredVersions = requiredFeatures.map(x => APRequiredFeaturesMap[x]);
            const minRequiredVer = Math.max(...requiredVersions);
            if (!minRequiredVer || minRequiredVer < 1) return 1;
            return minRequiredVer;
        }

        try {
            validate();
            const supportedVersion = getSupportedVersion();
            const minRequiredVersion = getMinRequiredVersion();
            if (supportedVersion < minRequiredVersion){
                throw new Error("Minimum Apple Pay required version is not supported by this device.\nPlease upgrade your iOS version.");
            }
            this.setState({
                appVersion: supportedVersion
            });                
            try {
                const transactionInfo = await this.props.onGetTransactionInfo();
                if (transactionInfo) {
                    this.validateFeatures(transactionInfo);
                    this.setState({
                        total: transactionInfo.total,
                        lineItems: transactionInfo.lineItems
                    });                
                }                
            } catch (error) {
                lib.logError(this.state.enableLogging, "onGetTransactionInfo error", error);                
            }
            try {
                if (this.props.onGetShippingMethods) {
                    const shippingMethods = await this.props.onGetShippingMethods();
                    this.setState({
                        shippingMethods
                    });                
                }
            } catch (error) {
                lib.logError(this.state.enableLogging, "onGetShippingMethods error", error);                
            }
            const {walletCheckEnabled, merchantIdentifier} = this.state;
            if (walletCheckEnabled) {
                const canMakePayments = await window.ApplePaySession.canMakePaymentsWithActiveCard(merchantIdentifier);
                if (!canMakePayments) {
                    throw new Error("Apple Pay not supported");
                }
            } 
        } catch (err) {
            lib.logError(this.state.enableLogging, "Apple Pay initialization failed", err);
        }
    };

    isFeatureRequested = (...features) => {
        const {requiredFeatures} = this.state;
        return features.some(feature => requiredFeatures.includes(feature));
    };

    validateFeatures = (obj) => {
        if (!obj) return;
        if (obj.error && !this.isFeatureRequested(APRequiredFeatures.address_validation)) 
            throw new Error("Error. A Required Feature 'address_validation' must be set. Please refer to documentation on how to set 'requiredFeatures' for Address Validation");

        if (obj.lineItems && 
            !this.isFeatureRequested(APRequiredFeatures.support_recurring, APRequiredFeatures.support_subscription) &&
            obj.lineItems.some(item =>  item.paymentTiming || 
                                    item.recurringPaymentStartDate ||
                                    item.recurringPaymentIntervalUnit ||
                                    item.recurringPaymentIntervalCount ||
                                    item.deferredPaymentDate ||
                                    item.automaticReloadPaymentThresholdAmount)) 
            throw new Error("Error. A Required Feature 'support_recurring' or 'support_subscription' must be set. Please refer to documentation on how to set 'requiredFeatures' for Recurring/Subscription");
    };

    getApplePayError = (error) => {
        if (error) {
            if (!error.code) {
                throw new Error("'error.code' is required. For available codes refer to 'APErrorCode'");
            }
            lib.logError(this.state.enableLogging, "ApplePayError custom error", error);
            return new window.ApplePayError(error.code, error.contactField, error.message);
        }
        return null;
    };

    onCancel = (e) => {
        lib.logError(this.state.enableLogging, "Apple Pay Session canceled", JSON.stringify(e));
        if (this.props.onCancel) {
            this.props.onCancel(e);
        }
    }

    onValidateMerchant = async (event) => {
        const {session} = this.state;
        try {
            if (!event.isTrusted) {
                lib.logError(this.state.enableLogging, "onValidateMerchant", "Not trusted");
                session.abort();
            }
            const response = this.props.onValidateMerchant ?
                                await this.props.onValidateMerchant() :
                                await this.validateMerchant();
            const resp = typeof(response) === "string" ? JSON.parse(response) : response;
            session.completeMerchantValidation(resp);
        } catch (err) {
            lib.logError(this.state.enableLogging, "onValidateMerchant error", err);
            session.abort();
        }
    }

    validateMerchant = async () => {
        return await this.httpService.post("https://api.cardknox.com/applepay/validate");            
    }

    onPaymentAuthorize = async (event) => {
        const {session} = this.state;
        try {
            if (!event.isTrusted) {
                lib.logError(this.state.enableLogging, "onPaymentAuthorize", "Not trusted");
                session.abort();
            }
            const response = await this.props.onPaymentAuthorize(event.payment);
            session.completePayment(window.ApplePaySession.STATUS_SUCCESS);   
            if (this.props.onPaymentComplete) {
                this.props.onPaymentComplete({response: response});
            }            
        } catch (error) {
            lib.logError(this.state.enableLogging, "onPaymentAuthorize error", error);
            session.abort();
            if (this.props.onPaymentComplete) {
                this.props.onPaymentComplete({error: error});
            }
        }
    }

    onShippingContactSelected = async (event) => {
        const {session, appVersion, total, lineItems, shippingMethods} = this.state;
        try {
            if (!event.isTrusted) {
                lib.logError(this.state.enableLogging, "onShippingContactSelected", "Not trusted");
                session.abort();
            }
            let finalResp = null;
            if (this.props.onShippingContactSelected) {
                const response = await this.props.onShippingContactSelected(event.shippingContact);
                this.validateFeatures(response);
                finalResp = { 
                    newTotal: response.total,
                    newLineItems: response.lineItems,
                    newShippingMethods: response.shippingMethods
                };
                if (appVersion >= 3) {
                    const err = this.getApplePayError(response.error);
                    if (err) {
                        finalResp.errors = [err];
                    }
                }
            } else {
                finalResp = { 
                    newTotal: total,
                    newLineItems: lineItems,
                    newShippingMethods: shippingMethods
                }
            }
            appVersion >= 3 ? session.completeShippingContactSelection(finalResp)
                            : session.completeShippingContactSelection(window.ApplePaySession.STATUS_SUCCESS, finalResp.newShippingMethods, finalResp.newTotal, finalResp.newLineItems);
        } catch (err) {
            lib.logError(this.state.enableLogging, "onShippingContactSelected error", err);
            session.abort();
        }        
    }

    onShippingMethodSelected = async (event) => {
        const {session, appVersion, total, lineItems, shippingMethods} = this.state;
        try {
            if (!event.isTrusted) {
                lib.logError(this.state.enableLogging, "onShippingMethodSelected", "Not trusted");
                session.abort();
            }
            let finalResp = null;
            if (this.props.onShippingMethodSelected) {
                const response = await this.props.onShippingMethodSelected(event.shippingMethod);
                this.validateFeatures(response);
                if (appVersion >= 3) {
                    finalResp = { 
                        newTotal: response.total,
                        newLineItems: response.lineItems
                    };
                    if (appVersion >= 13) {
                        if (response.shippingMethods) {
                            finalResp.newShippingMethods = response.shippingMethods;
                        }
                    }
                }
            } else {
                finalResp = { 
                    newTotal: total,
                    newLineItems: lineItems,
                    newShippingMethods: shippingMethods
                };
            }
            appVersion >= 3 ? session.completeShippingMethodSelection(finalResp)
                            : session.completeShippingMethodSelection(window.ApplePaySession.STATUS_SUCCESS, finalResp.total, finalResp.lineItems);
        } catch (err) {
            lib.logError(this.state.enableLogging, "onShippingMethodSelected error", err);
            session.abort();
        }
    }

    onPaymentMethodSelected = async (event) => {            
        const {session, appVersion, total, lineItems, shippingMethods} = this.state;
        try {
            if (!event.isTrusted) {
                lib.logError(this.state.enableLogging, "onPaymentMethodSelected", "Not trusted");
                session.abort();
            }
            let finalResp = null;
            if (this.props.onPaymentMethodSelected) {
                const response = await this.props.onPaymentMethodSelected(event.paymentMethod);
                this.validateFeatures(response);
                if (appVersion >= 3) {
                    const finalResp = { 
                        newTotal: response.total,
                        newLineItems: response.lineItems
                    };
                    if (appVersion >= 13) {
                        if (response.shippingMethods) {
                            finalResp.newShippingMethods = response.shippingMethods;
                        }
                        const err = this.getApplePayError(response.error);
                        if (err) {
                            response.errors = [err];
                        }
                    }
                }
            } else {
                finalResp = { 
                    newTotal: total,
                    newLineItems: lineItems,
                    newShippingMethods: shippingMethods
                };
            }
            appVersion >= 3 ? session.completePaymentMethodSelection(finalResp)
                            : session.completePaymentMethodSelection(finalResp.total, finalResp.lineItems);
        } catch (err){
            lib.logError(this.state.enableLogging, "onPaymentMethodSelected error", err);
            session.abort();
        }
    }

    onBeforeProcessPayment = async () => {
        try {
            if (this.props.onBeforeProcessPayment) 
            {
                const response = await this.props.onBeforeProcessPayment();
                if (response !== iStatus.success) {
                    throw response;
                }
            }
            return iStatus.success;
        } catch (err) {
            throw err;
        }
    } 
    
    getPaymentRequest = () => {
        const {
            merchantCapabilities,
            supportedNetworks,
            supportedCountries,
            countryCode,
            currencyCode,
            requiredBillingContactFields,
            requiredShippingContactFields,
            billingContact,
            shippingContact,
            shippingMethods,
            total,
            lineItems
        } = this.state;
        return {
            merchantCapabilities,
            supportedNetworks,
            supportedCountries,
            countryCode,
            currencyCode,
            requiredBillingContactFields,
            requiredShippingContactFields,
            billingContact,
            shippingContact,
            shippingMethods,
            total,
            lineItems
        };
    }

    createSession = () => {
        const session = new window.ApplePaySession(this.state.appVersion, this.getPaymentRequest());
        session.merchantIdentifier = this.state.merchantIdentifier;
        session.oncancel = this.onCancel;
        session.onvalidatemerchant = this.onValidateMerchant;
        session.onpaymentauthorized = this.onPaymentAuthorize;
        session.onshippingcontactselected = this.onShippingContactSelected;
        session.onshippingmethodselected = this.onShippingMethodSelected;
        session.onpaymentmethodselected = this.onPaymentMethodSelected;
        this.setState({
            session
        });
        return session;
    }   
    
    appleButtonClicked = async () => {
        try {
            const session = this.createSession();
            const response = await this.onBeforeProcessPayment();
            if (response !== iStatus.success) {
                throw new Error(response);
            }
            session.begin();            
        } catch (error) {
            lib.logError(this.state.enableLogging, "Apple Pay session error", error);
        }
    }

    render() {
        return (
            <div 
                className='apple-pay-button visible'
                style={this.appleButtonStyle}
                onClick={this.appleButtonClicked}
            >
            </div>
        )
    }
}

CardknoxApplePay.propTypes = {
    enableLogging: PropTypes.bool,
    properties: PropTypes.object.isRequired,
    onGetTransactionInfo: PropTypes.func.isRequired,
    onPaymentAuthorize: PropTypes.func.isRequired,
    onValidateMerchant: PropTypes.func,
    onBeforeProcessPayment: PropTypes.func,
    onGetShippingMethods: PropTypes.func,
    onShippingContactSelected: PropTypes.func,
    onShippingMethodSelected: PropTypes.func,
    onPaymentMethodSelected: PropTypes.func,
    onCancel: PropTypes.func
};

export default CardknoxApplePay;