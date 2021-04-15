import React from 'react'
import {Map, Marker, GoogleApiWrapper} from 'google-maps-react'

export class MapContainer extends React.Component {
    constructor (props) {
        super(props)
        this.state = {
          bounds: null
        }
    }

    componentDidMount() {
        this.getBounds()
    }

    getBounds() {
        var points = this.props.points
        var bounds = new this.props.google.maps.LatLngBounds();
        for (var i = 0; i < points.length; i++) {
            bounds.extend(points[i]);
        }
        this.setState({bounds})
    }

    render() {
        return (
            <Map google={this.props.google} 
                bounds={this.state.bounds}
                style={this.props.style}
            >
                {this.props.points.map((marker,i) =>
                    <Marker 
                        key={i}
                        onClick={this.onMarkerClick}
                        position={{lat: marker.lat, lng: marker.lng}}
                    />
                )} 
            </Map>
        )
    }   
}

export default GoogleApiWrapper({
    apiKey: ('AIzaSyCOGe9fobxpbO9mW9jqObRMj-vKtSNonOY')
  })(MapContainer)
