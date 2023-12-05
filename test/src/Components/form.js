import React, { useRef, useState } from 'react';
import WrappedIfield from './wrapped-ifield';
import { CARD_TYPE, CVV_TYPE } from '@cardknox/react-ifields';
import { format } from 'date-fns';

export default function AppForm() {
  const [cardToken, setCardToken] = useState('');
  const [cvvToken, setCvvToken] = useState('');
  const [issuer, setIssuer] = useState('');
  const [amount, setAmount] = useState(2.36);
  const [firstName, setFirstName] = useState('John');
  const [lastName, setLastName] = useState('Doe');
  const [address, setAddress] = useState('123 Somewhere');
  const [city, setCity] = useState('Anywhere');
  const [addressState, setAddressState] = useState('NY');
  const [zip, setZip] = useState('98765');
  const [mobile, setMobile] = useState('1234567890');
  const [email, setEmail] = useState('test@test.com');
  const [expMonth, setExpMonth] = useState(new Date().getMonth());
  const [expYear, setExpYear] = useState(new Date().getFullYear());
  const [gatewayResponse, setGatewayResponse] = useState('');
  const [gateway3dsReseponse, setGateway3dsResponse] = useState('');
  const cardRef = useRef();
  const cvvRef = useRef();
  const getCardToken = () => {
    cardRef.current.getToken();
  };
  const getCvvToken = () => {
    cvvRef.current.getToken();
  };
  const focusCard = () => {
    cardRef.current.focusIfield();
  };
  const focusCvv = () => {
    cvvRef.current.focusIfield();
  };
  const clearCard = () => {
    cardRef.current.clearIfield();
  };
  const clearCvv = () => {
    cvvRef.current.clearIfield();
  };
  const onCardToken = (data) => {
    setCardToken(data.xToken);
  };
  const onCvvToken = (data) => {
    setCvvToken(data.xToken);
  };
  const submitToGateway = async () => {
    setGatewayResponse('');
    let request = {
      xSoftwareName: "Test-React-iFields",
      xSoftwareVersion: "1.0",
      xVersion: "5.0.0",
      xCommand: "cc:sale",
      xAmount: amount,
      xCardnum: cardToken,
      xBillFirstName: firstName,
      xBillLastName: lastName,
      xBillStreet: address,
      xBillCity: city,
      xBillZip: zip,
      xBillState: addressState,
      xBillMobile: mobile,
      xEmail: email,
      xExp: format(
        new Date(expYear, expMonth - 1),
        "MMyy"
      ),
      xCvv: cvvToken
    };
    try {
      const response = await fetch("/api/gatewayjson", {
        method: 'POST',
        body: JSON.stringify(request),
        headers: { 'Content-Type': 'application/json' }
      });
      const responseBody = await response.json();
      setGatewayResponse(responseBody);
      if (responseBody.xResult === 'V')
        verify3DS(responseBody);
    } catch (error) {
      console.error(error);
      setGatewayResponse(error);
    }
  }
  const verify3DS = (verifyData) => {
    window.ck3DS.verifyTrans(verifyData);
  }

  const handle3DSResults = async (actionCode, xCavv, xEciFlag, xRefNum, xAuthenticateStatus, xSignatureVerification, error) => {
    try {
      console.log('handle3DSResults')
      const postData = {
        xSoftwareName: "Test-React-iFields",
        xSoftwareVersion: "1.0",
        xVersion: "5.0.0",
        x3dsError: error,
        xRefNum: xRefNum,
        xCavv: xCavv,
        xEci: xEciFlag,
        x3dsAuthenticationStatus: xAuthenticateStatus,
        x3dsSignatureVerificationStatus: xSignatureVerification,
        x3dsActionCode: actionCode,
      };
      console.log(postData);
      const response = await fetch('/api/verifyjson', { method: 'POST', body: JSON.stringify(postData), headers: { 'Content-Type': 'application/json' } });
      setGateway3dsResponse(await response.json());
    } catch (error) {
      console.error(error);
      setGateway3dsResponse(error);
    }
  };
  return (
    <div>
      <section className='hero is-primary'>
        <div className='hero-body'>
          <div className='container'>
            <h1 className='title'>
              Checkout
            </h1>
            <h4 className='subtitle'>
              Please enter your credit card information
            </h4>
          </div>
        </div>
      </section>
      <div className='main'>
        <p id="total">
          Your Total: <span id="total-amount">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)}</span>
        </p>
        <div className='columns'>
          <div className='column'>
            <section className='box card-box'>
              <div className="field">
                <label className="label">Amount</label>
                <div className="control">
                  <input className="input" type="text" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
              </div>
              <div className="field is-grouped">
                <div className='field'>
                  <label className="label">First Name</label>
                  <div className="control">
                    <input className="input" type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                </div>
                <div className='field'>
                  <label className="label">Last Name</label>
                  <div className="control">
                    <input className="input" type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="field">
                <label className="label">Address</label>
                <div className="control">
                  <input className="input" type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
              </div>
              <div className="field is-grouped">
                <div className='field is-expanded'>
                  <label className="label">City</label>
                  <div className="control">
                    <input className="input" type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                </div>
                <div className='field smallWidth'>
                  <label className="label">State</label>
                  <div className="control">
                    <input className="input" type="text" placeholder="State" value={addressState} onChange={(e) => setAddressState(e.target.value)} />
                  </div>
                </div>
                <div className='field smallWidth'>
                  <label className="label">Zip</label>
                  <div className="control">
                    <input className="input" type="text" placeholder="Zip" value={zip} onChange={(e) => setZip(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="field">
                <label className="label">Mobile</label>
                <div className="control">
                  <input className="input" type="text" placeholder="Mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label className="label">Email</label>
                <div className="control">
                  <input className="input" type="text" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div className='field'>
                <label className="label">Card Number</label>
                <div className="control">
                  <WrappedIfield ifieldType={CARD_TYPE} onIssuer={setIssuer} onToken={onCardToken} handle3DSResults={handle3DSResults} ref={cardRef} />
                </div>
              </div>
              <button className="button is-info is-rounded is-small" onClick={focusCard}>Focus</button>
              <button className="button is-info is-rounded is-small" onClick={clearCard}>Clear</button>
              <button className="button is-info is-rounded is-small" onClick={getCardToken}>Submit</button>
              <div className="field is-grouped mt-3">
                <div className='field'>
                  <label className="label">Month</label>
                  <div className="control">
                    <div className="select">
                      <select value={expMonth} onChange={(e) => setExpMonth(e.target.value)}>
                        {[...Array(12).keys()].map((i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className='field'>
                  <label className="label">Year</label>
                  <div className="control">
                    <div className="select">
                      <select value={expYear} onChange={(e) => setExpYear(e.target.value)}>
                        {[...Array(10).keys()].map((i) => <option key={i + 1} value={new Date().getFullYear() + i}>{new Date().getFullYear() + i}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className='field'>
                <label className="label">CVV</label>
                <WrappedIfield ifieldType={CVV_TYPE} issuer={issuer} onToken={onCvvToken} ref={cvvRef} />
              </div>
              <button className="button is-info is-rounded is-small" onClick={focusCvv}>Focus</button>
              <button className="button is-info is-rounded is-small" onClick={clearCvv}>Clear</button>
              <button className="button is-info is-rounded is-small" onClick={getCvvToken}>Submit</button>
              <div className='button-spaced mt-3'>
                <button className='button is-success is-rounded' onClick={submitToGateway}>Submit to Gateway</button>
              </div>
            </section>
          </div>
          <div className='column'>
            <section className='box result-box'>
              <div className='field'>
                <label className='label'>Card Token</label>
                <p className='token-field'>{cardToken}</p>
              </div>
              <div className='field'>
                <label className='label'>CVV Token</label>
                <p className='token-field'>{cvvToken}</p>
              </div>
              <div className='field'>
                <label className='label'>Gateway Response</label>
                <p className='token-field'>{JSON.stringify(gatewayResponse)}</p>
              </div>
              <div className='field'>
                <label className='label'>3DS Response</label>
                <p className='token-field'>{JSON.stringify(gateway3dsReseponse)}</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>);
}