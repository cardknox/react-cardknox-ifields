export interface Options {
    placeholder: string,
    enableLogging: boolean,
    autoFormat: boolean,
    autoFormatSeparator: string,
    autoSubmit: boolean,
    iFieldstyle: object
}

export function Handle3DSResults(actionCode: string,
    xCavv: string,
    xEciFlag: string,
    xRefnum: string,
    xAuthenticationStatus: string,
    xSignatureVerification: string,
    xError: string): void;

export interface ThreeDS {
    enable3DS: boolean,
    environment: string,
    handle3DSResults: Handle3DSResults
}

export interface Account {
    xKey: string,
    xSoftwareName: string,
    xSoftwareVersion: string
}

export interface UpdateData {
    isEmpty: boolean,
    isValid: boolean,
    length: number,
    cardNumberLength: number,
    type: string,
    issuer: string
}

export interface TokenData {
    xToken: string,
    xTokenType: string
}

export interface ErrorData {
    result: string,
    errorMessage: string,
    xTokenType: string
}

export interface Props {
    account: Account,
    threeds: ThreeDS,
    options: Options,
    issuer: string,
    type: string,
    onLoad: () => void,
    onUpdate: (data: UpdateData) => void,
    onSubmit: () => void,
    onToken: (data: TokenData) => void,
    onError: (data: ErrorData) => void
}

export const CARD_TYPE: string;
export const CVV_TYPE: string;
export const ACH_TYPE: string;
export const THREEDS_ENVIRONMENT = {
    Production: string,
    Staging: string
}

export default class IField {
    constructor(props: Props) { }
}

//Apple Pay
export const ApplePayButtonColor = {
    black: "black",
    white: "white",
    whiteOutline: "white-outline"
}    

export const ApplePayButtonType = {
    buy: "buy",
    pay: "pay",
    plain: "plain",
    order: "order",
    donate: "donate",
    continue: "continue",
    checkout: "check-out"
}    

export const ApplePayLineItemType = {
    pending: "pending",
    final: "final"
}
export interface ApplePayShippingMethod {
    label: string,
    detail: string,
    amount: string,
    identifier: string
}

export interface ApplePayLineItem {
    label: string,
    type: ApplePayLineItemType,
    amount: string
}

export interface ApplePayTransactionInfo {
    lineItems: Array<ApplePayLineItem>,
    total: ApplePayLineItem,
}

export interface ApplePayPaymentToken {
    paymentMethod: object,
    transactionIdentifier: string,
    paymentData: object
}

export interface ApplePayPaymentContact {
    phoneNumber: string,
    emailAddress: string,
    givenName: string,
    familyName: string,
    phoneticGivenName: string,
    phoneticFamilyName: string,
    addressLines: Array<string>,
    subLocality: string,
    locality: string,
    postalCode: string,
    subAdministrativeArea: string,
    administrativeArea: string,
    country: string,
    countryCode: string
}

export interface ApplePayPayment {
    token: ApplePayPaymentToken,
    billingContact: ApplePayPaymentContact,
    shippingContact: ApplePayPaymentContact
}

export interface ApplePayInitalProps {
    buttonOptions: {
        buttonColor: APButtonColor,
        buttonType: APButtonType,
        width: number,
        height: number,
        minWidth: number,
        minHeight: number
    },
    walletCheckEnabled: boolean,
    merchantIdentifier: string,
    merchantCapabilities: Array<string>,
    supportedNetworks: Array<string>,
    supportedCountries: Array<string>,
    countryCode: string,
    currencyCode: string,
    requiredFeatures: Array<string>,
    requiredBillingContactFields: Array<string>,
    requiredShippingContactFields: Array<string>,
    shippingMethods: Array<APShippingMethod>
}

export interface ApplePayProps {
    enableLogging: boolean,
    properties: ApplePayInitalProps,
    onGetTransactionInfo: () => ApplePayTransactionInfo,
    onPaymentAuthorize: (payment: ApplePayPayment) => Promise,
    onValidateMerchant: () => Promise,
    onBeforeProcessPayment: () => Promise,
    onGetShippingMethods: () => Array<ApplePayShippingMethod>,
    onShippingContactSelected: (shippingContact: ApplePayPaymentContact) => Promise,
    onShippingMethodSelected: (shippingMethod: ApplePayShippingMethod) => Promise,
    onPaymentMethodSelected: (paymentMethod: object) => Promise,
    onCancel: () => void
}

export class CardknoxApplePay {
    constructor(props: ApplePayProps) { }
}