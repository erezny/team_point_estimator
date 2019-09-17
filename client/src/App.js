import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Api from './api';

export default class App extends Component {
  constructor() {
    super();
    this.api = new Api();
    this.api.handle.choosePoints = (msg) => this.handleChoosePoints(msg);
    this.api.handle.clear = (msg) => this.handleClear(msg);
    
    this.clientId = undefined;
    this.api.handle.register = (msg) => this.handleRegister(msg);

    this.state = {
      pointEstimates: {},
      selfHasEstimated: false
    }
  }

  handleRegister = (msg) => {
    if (this.clientId === undefined) {
      this.clientId = msg.client_id;
    }
  }

  handlePointChoice = (numPoints) => {
    this.api.sendApiPacket("choosePoints", numPoints)
  }

  handleChoosePoints = (msg) => {
    const estimateNum = msg.msg.msg;
    const clientId = msg.client_id;

    this.setState( (prevState) => ({
      pointEstimates: {
        ...prevState.pointEstimates,
        [msg.client_id]: estimateNum,
      },
    }))
  }

  handleClickClear = () => {
    this.api.sendApiPacket("clear")
  }
  
  handleClickShow = () => {
    this.setState({selfHasEstimated:true})
  }

  handleClear = () => {
    this.setState( {
      pointEstimates: {},
      selfHasEstimated: false
    } )
  }

  render() {
    return (
      <div className="App">
        <PointEstimates 
          pointEstimates={this.state.pointEstimates} 
          handleChoice={this.handlePointChoice} 
          selfHasEstimated={this.state.selfHasEstimated} />
        <button className="Clear" onClick={this.handleClickClear}>Clear</button>
        <button className="Show" onClick={this.handleClickShow}>Show</button>
        <div>submissions: {Object.keys(this.state.pointEstimates).length}</div>
      </div>
    );
  }
}

export class PointEstimates extends Component {

  FIBBINACCI_MAP = FIBBINACCI_SERIES.reduce((currentValue, num) => (
    currentValue.set(num, 0)
    ), new Map())

  get histogram() {
    let returnValue = new Map(this.FIBBINACCI_MAP);

    for (var clientId in this.props.pointEstimates) {
      returnValue.set(
        this.props.pointEstimates[clientId],
        1 + returnValue.get(this.props.pointEstimates[clientId])
      );
    }

    return returnValue;
  }

  get pointEstimateDiagram() {
    let returnValue = [];
    let histogram = this.histogram;

    let avgWidth = `${Math.floor (100 / histogram.size)}%`;

    histogram.forEach((numPeople, numPoints ) => { 
      returnValue.push(
        <div key={`${numPoints}`} style={{width: avgWidth}}>
        <div className="VerticalBarSpace">
          {this.props.selfHasEstimated && 
            <div className="VerticalBar" style={{height: `${numPeople}em`}}>
              &nbsp;
            </div>
          }
        &nbsp;</div>
          <div>
            <button onClick={() => this.props.handleChoice(numPoints)}>
              {numPoints}
            </button>
          </div>
        </div>
      )
    }) 

    return returnValue;
  }

  render() {
    return (
      <div className="Histogram">
        {this.pointEstimateDiagram}
      </div>
    )
  }
}

function fibbinacciSeries(numElements) {
  let series = [1,2];
  while (series.length < numElements) {
    series.push(series[series.length -1] + series[series.length -2])
  }
  return series
}
const FIBBINACCI_SERIES = fibbinacciSeries(15);
