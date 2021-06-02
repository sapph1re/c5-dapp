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

    componentDidUpdate(prevProps) {
      if(this.props !== prevProps) 
      {
         this.getBounds();
      }
    } 

    getBounds() {
        const points = this.props.points
        let bounds = new this.props.google.maps.LatLngBounds()
        //default points
        if (points.length === 0) {
            bounds.extend({ "lat": 40.885091, "lng": -73.868285 })
            bounds.extend({"lat":40.685091, "lng":-74.068285})
        } else {
            for (let i = 0; i < points.length; i++) {
                bounds.extend(points[i])
            }
        }
        this.setState({bounds})
    }

    render() {
        return (
            <Map google={this.props.google} 
                bounds={this.state.bounds}
                style={this.props.style}
                containerStyle={this.props.containerStyle}
            >
                {this.props.points.map((marker,i) =>
                    <Marker 
                        key={i}
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
