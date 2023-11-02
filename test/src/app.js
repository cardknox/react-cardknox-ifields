
import React from 'react';
import IField, { CARD_TYPE, CVV_TYPE } from '@cardknox/react-ifields';


export default class App extends React.Component {
    constructor(props) {
        super(props);
        const account = {
            xKey: "",
            xSoftwareName: "react-cardknox-ifields",
            xSoftwareVersion: "1.0.0"
        };
        const threeds = {
            enable3DS: false,
            waitForResponse: false,
            waitForResponseTimeout: undefined,
            amount: 0,
            month: "01",
            year: "2020"
        };
        const ccoptions = {
            placeholder: 'Card Number',
            enableLogging: true,
            autoFormat: true,
            autoFormatSeparator: ' ',
            autoSubmit: false,
            iFieldstyle: {

            },
            iFrameStyle: {

            }
        };
        const cvvoptions = {
            placeholder: 'CVV',
            enableLogging: true,
            autoFormat: true,
            autoFormatSeparator: ' ',
            autoSubmit: false,
            iFieldstyle: {

            },
            iFrameStyle: {

            }
        };
        this.state = {
            account,
            threeds,
            ccoptions,
            cvvoptions,
            issuer: ''
        };
        this.cvvRef = React.createRef();
        this.cardRef = React.createRef();
    }
    render() {
        return (
            <>
                <IField
                    type={CARD_TYPE}
                    account={this.state.account}
                    options={this.state.ccoptions}
                    threeDS={this.state.threeds}
                    onLoad={this.onLoad}
                    onUpdate={this.onUpdate}
                    onSubmit={this.onSubmit}
                    onToken={this.onToken}
                    ref={this.cardRef}
                    onError={this.onError} />
                <IField
                    type={CVV_TYPE}
                    account={this.state.account}
                    options={this.state.cvvoptions}
                    threeDS={this.state.threeds}
                    issuer={this.state.issuer}
                    onLoad={this.onLoad}
                    onUpdate={this.onUpdate}
                    onSubmit={this.onSubmit}
                    onToken={this.onToken}
                    ref={this.cvvRef}
                    onError={this.onError} />
                <button style={{display: 'block'}} onClick={this.getToken}>Get CVV Token</button>
                <button style={{display: 'block'}} onClick={this.getCard}>Get Card Token</button>
            </>
        );
    }
    onLoad = () => {
        console.log("Iframe loaded");
    }
    onUpdate = (data) => {
        if (data.issuer)
            this.setState({ issuer: data.issuer });
    }
    onSubmit = (data) => {
        console.log("IFrame submitted", data);
    }
    onToken = (data) => {
        console.log("IFrame sent token", data);
    }
    onError = (data) => {
        console.error("IFrame errored", data);
    }
    getToken = () => {
        this.cvvRef.current.getToken();
    }
    getCard = () => {
        this.cardRef.current.getToken();
    }
}