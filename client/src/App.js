import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Api from './api';

export default class App extends Component {
  constructor() {
    super();
    this.api = new Api();
    this.api.handle.choosePoints = this.handleChoosePoints;
    this.api.handle.clear = this.handleClear;
    this.api.sendApiPacket("test message");
    this.state = {
      pointEstimates: {}
    }
  }
  handlePointChoice = (numPoints) => {
    this.api.sendApiPacket("choosePoints", numPoints)
  }

  handleChoosePoints = (msg) => {
    const estimateNum = msg.msg.msg;

    this.setState( (prevState) => ({
      pointEstimates: {
        ...prevState.pointEstimates,
        [msg.client_id]: estimateNum,
      }
    }))
  }

  handleClickClear = () => {
    this.api.sendApiPacket("clear")
  }

  handleClear = () => {
    this.setState( {
      pointEstimates: {},
    } )
  }

  render() {
    return (
      <div className="App">
        <PointEstimates pointEstimates={this.state.pointEstimates} handleChoice={this.handlePointChoice}  />
        <button onClick={this.handleClickClear}>Clear</button>
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

    console.log(returnValue);
    return returnValue;
  }

  get pointEstimateDiagram() {
    let returnValue = [];
    let histogram = this.histogram;

    histogram.forEach((numPeople, numPoints ) => {
      returnValue.push(
        <div>
          <div className="VerticalBar" style={{height: `${numPeople}em`}}>
            &nbsp;
          </div>
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
const FIBBINACCI_SERIES = fibbinacciSeries(10);
