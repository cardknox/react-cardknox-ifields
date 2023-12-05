import IField, { CARD_TYPE, CVV_TYPE, ACH_TYPE, THREEDS_ENVIRONMENT } from '@cardknox/react-ifields';
import React, { useImperativeHandle, useRef } from 'react';
import PropTypes from 'prop-types';

const WrappedIfield = React.forwardRef((props, ref) => {
  const internalRef = useRef();
  useImperativeHandle(ref, () => ({
    getToken() {
      internalRef.current.getToken();
    },
    focusIfield() {
      internalRef.current.focusIfield();
    },
    clearIfield() {
      internalRef.current.clearIfield();
    }
  }), []);

  const { ifieldType, issuer, onIssuer, onToken, onError, handle3DSResults } = props;
  const account = {
    xKey: "",
    xSoftwareName: "react-cardknox-ifields",
    xSoftwareVersion: "1.0.0"
  };
  const options = {
    placeholder: ifieldType === CARD_TYPE ? 'Card Number' : 'CVV',
    enableLogging: false,
    autoFormat: true,
    autoFormatSeparator: ' ',
    autoSubmit: false,
    iFieldstyle: {
      width: "50%",
      "max-width": "100%",
      "box-shadow": "inset 0 1px 2px rgba(10, 10, 10, 0.1)",
      "background-color": "white",
      border: "1px solid transparent",
      "border-color": "#dbdbdb",
      "border-radius": "4px",
      color: "#363636",
      height: "2.25em",
      "line-height": "1.5",
      "padding-bottom": "calc(0.375em - 1px)",
      "padding-left": "calc(0.625em - 1px)",
      "padding-right": "calc(0.625em - 1px)",
      "padding-top": "calc(0.375em - 1px)",
      outline: "none"
      
    }
  };
  const onLoad = () => {
    console.log("Iframe loaded");
  };
  const onUpdate = (data) => {
    if (ifieldType === CARD_TYPE && data.issuer)
      onIssuer(data.issuer);
  };
  const onSubmit = (data) => {
    console.log("IFrame submitted", data);
  };

  const threeds = {
    enable3DS: true,
    environment: THREEDS_ENVIRONMENT.Staging,
    handle3DSResults: handle3DSResults
  };
  return (<IField
    type={ifieldType}
    account={account}
    options={options}
    threeDS={ifieldType === CARD_TYPE ? threeds : null}
    onLoad={onLoad}
    onUpdate={onUpdate}
    onSubmit={onSubmit}
    onToken={onToken}
    ref={internalRef}
    onError={onError}
    issuer={issuer}
    className='ifields' />);
});
WrappedIfield.propTypes = {
  ifieldType: PropTypes.oneOf([CARD_TYPE, CVV_TYPE, ACH_TYPE]),
  issuer: PropTypes.string,
  onIssuer: PropTypes.func,
  onToken: PropTypes.func,
  onError: PropTypes.func,
  handle3DSResults: PropTypes.func
};
export default WrappedIfield;