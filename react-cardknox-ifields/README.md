# react-ifields

## A React component for Cardknox iFields

---

## Cardknox

Cardknox is a developer-friendly payment gateway integration provider for in-store, online, or mobile transactions

**Sandbox:** https://www.cardknox.com/sandbox/

**iFields:** https://www.cardknox.com/ifields/

A sandbox or live account is required to use this component

---

## Usage

There are 2 basic props required to get this up and running.

#### 1. Type

There are three types of payment data iFields supports:
* Credit Card
* CVV
* ACH

```
    <IField type={CARD_TYPE} />
```

The possible values for this property are 
* card
* cvv
* ach

These can be imported from the component

```
import { CARD_TYPE, CVV_TYPE, ACH_TYPE } from '@cardknox/react-ifields';
```

#### 2. Account
Pass your [iFields key](https://www.cardknox.com/ifields/) to the component in the **account** prop like this:

```
export default class App extends React.Component {
  state = {
    account = {
      xKey: "{Your iFields key}",
      xSoftwareName: "{The name of your app}",
      xSoftwareVersion: "{Your app's version}"
    }
  }
  render() {
    return <IField account={this.state.account} />
  }
}
```

---

## Events

There are 2 lifecycle events and 7 user events.

---

### Lifecycle events

#### 1. Load

Is emitted when the `iframe` has loaded

```
    <IField onLoad={this.onLoad} />
```

#### 2. Token

Is emitted when a token is received from the iField

```
    <IField onToken={this.onToken} />
```

---

### User events

User events are events passed along from iFields when the user interacts with it.

The available events are
1. click
1. dblclick
1. focus
1. blur
1. input
1. change
1. keypress
1. issuerupdated (CVV only)
1. submit*

\* the submit event works slightly differently, see below.

#### Update Event

Aside from submit, the above events are all collected on a single event `update`.

The event payload is in `e.data`. The data also contains the event type so you can filter out events you don't need with a `switch` statement like this:

```
export default class App extends React.Component {
  render() {
    return <IField onUpdate={this.onUpdate} />
  }
  onUpdate = (data) => {
    switch (data.event) {
      case 'input':
        console.log("input event received");
        break;
      case 'click':
        console.log("click event received");
        break;
      default:
        break;
    }
  }
}
```

#### Submit Event

This event is triggered when the user submits the form (presses the Enter key) from within the iFrame.

This event works differently than other user events. 
* This event is only emitted if prop `options.autoSubmit` is true.
* This event does not call `onUpdate`.
* No data is passed along with this event.

```
export default class App extends React.Component {
  state = {
    options: {
      autoSubmit: true
    }
  }
  render() {
    return <IField options={this.state.options} onSubmit={this.onSubmit} />
  }
  onSubmit = () => {
    //submit to server
  }
}
```

It is also possible to have the component automatically submit the form for you when _submit_ is triggered from the iFrame.If `autoSubmitFormId` is set on the options prop, the component will call submit on the element with that ID. This is useful for smaller applications relying on the form element to handle submission.

```
export default class App extends React.Component {
  state = {
    options: {
      autoSubmit: true,
      autoSubmitFormId: 'form'
    }
  }
  render() {
    return <form id="form">
        <IField options={this.state.options} />
      </form>
  }
}
```

### Error

There is also an error event that can be subscribed to.

```
export default class App extends React.Component {
  render() {
    return <IField onError={this.onError} />
  }
  onError = (data) => {
    console.error("IFrame errored", data);
  }
}
```

---

## Actions

There are 3 actions available on this component as well

### Focus

`focusIfield`

This action will set the focus to the ifield when called

### Clear

`clearIfield`

This action will clear the data from the ifield when called

### Get Token

`getToken`

This action will load the token for the ifield when called.

```
export default class App extends React.Component {
  iFieldRef = React.createRef();
  render() {
    return <IField ref={this.iFieldRef} />
  }
  focus = () => {
    this.iFieldRef.current.focusIfield();
  }
  clear = () => {
    this.iFieldRef.current.clearIfield();
  }
  getToken = () => {
    this.iFieldRef.current.getToken();
  }
}
```



## Props

<table>
    <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Description</th>
        <th>Valid values</th>
    </tr>
    <tr>
        <td>type</td>
        <td>String</td>
        <td>iFields type</td>
        <td>
            <ul>
                <li>card</li>
                <li>cvv</li>
                <li>ach</li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>account</td>
        <td><a href="">Account</a></td>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td>options</td>
        <td><a href="">Options</a></td>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td>threeDS</td>
        <td><a href="#ThreeDS">ThreeDS</a></td>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td>issuer</td>
        <td>String</td>
        <td>Card issuer</td>
        <td>For cvv iField only</td>
    </tr>
    <tr>
        <td>onLoad</td>
        <td>Function</td>
        <td>Called when the <code>iframe</code> loads</td>
        <td></td>
    </tr>
    <tr>
        <td>onUpdate</td>
        <td>Function<<a href="">Update Event Data</a>></td>
        <td>Called when the iField has been updated</td>
        <td></td>
    </tr>
    <tr>
        <td>onSubmit</td>
        <td>Function</td>
        <td>Called when the user presses the Enter key inside the <code>iframe</code></td>
        <td></td>
    </tr>
    <tr>
        <td>onToken</td>
        <td>Function<<a href="">Token Data</a>></td>
        <td>Called when the iField has received a token</td>
        <td></td>
    </tr>
    <tr>
        <td>onError</td>
        <td>Function<<a href="">Error Data</a>></td>
        <td>Called when an error occurs while retrieving the token</td>
        <td></td>
    </tr>
</table>

### Account

<table>
    <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Description</th>
    </tr>
    <tr>
        <td>xKey</td>
        <td>String</td>
        <td>iFields key</td>
    </tr>
    <tr>
        <td>xSoftwareName</td>
        <td>String</td>
        <td>Software name</td>
    </tr>
    <tr>
        <td>xSoftwareVersion</td>
        <td>String</td>
        <td>Software version</td>
    </tr>
</table>

### Options

<table>
    <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Description</th>
    </tr>
    <tr>
        <td>enableLogging</td>
        <td>Boolean</td>
        <td>Turn iField logs to the console on and off.</td>
    </tr>
    <tr>
        <td>autoFormat</td>
        <td>Boolean</td>
        <td>Turn iField auto-formatting on and off. This is only used for iFields of <i>card</i> type. See <i>autoFormatSeparator</i>.</td>
    </tr>
    <tr>
        <td>autoFormatSeparator</td>
        <td>String</td>
        <td>A string to be used to auto-format card numbers when <i>autoFormat</i> is turned on. The default value is " " (space).</td>
    </tr>
    <tr>
        <td>blockNonNumericInput</td>
        <td>Boolean</td>
        <td>Block non-numeric character input. This is only used for iFields of <i>card</i> type. This does not interfere with <i>autoFormatSeparator</i>.</td>
    </tr>
    <tr>
        <td>autoSubmit</td>
        <td>Boolean</td>
        <td>The token should be retrieved as soon as the data is valid. This setting will also turn on capturing a submit event triggered from within the iFrame when submitting the data.</td>
    </tr>
    <tr>
        <td>autoSubmitFormId</td>
        <td>String</td>
        <td>If autoSubmit is true, the ID of a form element can be set and the component will trigger <i>submit</i> on the form when submit is triggered in the iFrame.</td>
    </tr>
    <tr>
        <td>placeholder</td>
        <td>String</td>
        <td>Text to be used as <i>placeholder</i> text for the input field.</td>
    </tr>
    <tr>
        <td>iFieldstyle</td>
        <td>Object</td>
        <td>A style object to be used to style the iFields input element. This object is assigned to <b>HTMLElement.style</b>.</td>
    </tr>
</table>

### ThreeDS

<table>
    <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Description</th>
    </tr>
    <tr>
        <td>enable3DS</td>
        <td>Boolean</td>
        <td>Turn 3DSecure on and off</td>
    </tr>
    <tr>
        <td>environment</td>
        <td>String</td>
        <td>`Staging` or `Production`
        <br/>
        These values can be imported from the package
        </td>
    </tr>
    <tr>
        <td>handle3DSResults</td>
        <td>Function</td>
        <td>A callback to handle the 3DS results</td>
    </tr>
</table>

For full documentation about 3D-Secure with iFields see [here](https://docs.cardknox.com/cardknox-products/ifields#ifields-with-3d-secure-authentication)

### Update Event Data

<table>
    <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Description</th>
    </tr>
    <tr>
        <td>cardNumberlength</td>
        <td>Number</td>
        <td>The length of the data in the card iField <br/> Only returned on an update event from the card iField</td>
    </tr>
    <tr>
        <td>event</td>
        <td>String</td>
        <td>The name of the event.</td>
    </tr>
    <tr>
        <td>isEmpty</td>
        <td>Boolean</td>
        <td>Whether or not the iField is empty.</td>
    </tr>
    <tr>
        <td>isValid</td>
        <td>Boolean</td>
        <td>Whether or not the data in the iField is valid.</td>
    </tr>
    <tr>
        <td>issuer</td>
        <td>String</td>
        <td>The card issuer <br/> Only returned on an update event from the card iField.</td>
    </tr>
    <tr>
        <td>length</td>
        <td>Boolean</td>
        <td>The length of the data in the iField <br/><emp>Note:</emp> For card iFields, this includes the formating character. Use <code>cardNumberlength</code> to get the actual data length.</td>
    </tr>
    <tr>
        <td>ifieldValueChanged </td>
        <td>Boolean</td>
        <td>Whether or not the iField value has changed.</td>
    </tr>
</table>

### Token Data

<table>
    <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Description</th>
    </tr>
    <tr>
        <td>xToken</td>
        <td>string</td>
        <td>The token</td>
    </tr>
    <tr>
        <td>xTokenType</td>
        <td>String</td>
        <td>Either card, cvv, or ach</td>
    </tr>
</table>

### Error Data

<table>
    <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Description</th>
    </tr>
    <tr>
        <td>result</td>
        <td>String</td>
        <td>This will always have the value of <code>error</code></td>
    </tr>
    <tr>
        <td>errorMessage</td>
        <td>String</td>
        <td>Contains the error message</td>
    </tr>
    <tr>
        <td>xTokenType</td>
        <td>String</td>
        <td>Either card, cvv, or ach</td>
    </tr>
</table>

<br/><br/><br/>

---

**iFields Version:** [2.15.2309.2601](https://cdn.cardknox.com/ifields/2.15.2309.2601/ifield-sample.htm)
