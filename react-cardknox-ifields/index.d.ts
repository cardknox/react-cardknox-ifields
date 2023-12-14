
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