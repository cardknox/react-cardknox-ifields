
export interface Options {
    placeholder: string,
    enableLogging: boolean,
    autoFormat: boolean,
    autoFormatSeparator: string,
    autoSubmit: boolean,
    iFieldstyle: object
}

export interface ThreeDS {
    enable3DS: boolean,
    waitForResponse: boolean,
    waitForResponseTimeout: number,
    amount: number,
    month: string,
    year: string
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

export default class IField {
    constructor(props: Props) { }
}